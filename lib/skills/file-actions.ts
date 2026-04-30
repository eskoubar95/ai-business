"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { skillFiles, skills } from "@/db/schema";
import { normalizeSkillFilePath, parseGitHubRepoUrl } from "@/lib/skills/skill-file-utils";
import { requireSessionUserId } from "@/lib/roster/session";
import { and, eq } from "drizzle-orm";

const SKILL_MD = "SKILL.md";

const ALLOWED_GITHUB_EXT = new Set([".md", ".js", ".mjs"]);

async function ensureBusinessMembership(businessId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
}

function includesSkillMd(paths: { path: string }[]): boolean {
  return paths.some((f) => f.path === SKILL_MD || f.path.endsWith(`/${SKILL_MD}`));
}

function encodeGitHubContentsPath(relPath: string): string {
  if (!relPath) return "";
  return relPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function allowedGithubFile(path: string): boolean {
  const lower = path.toLowerCase();
  for (const ext of ALLOWED_GITHUB_EXT) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

type GhContentFile = {
  type: string;
  path: string;
  encoding?: string;
  content?: string;
};

type GhContentItem = {
  type: "file" | "dir";
  path: string;
};

async function githubFetchJson(url: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${t.slice(0, 240)}`);
  }
  return res.json();
}

async function fetchGithubFileContent(
  owner: string,
  repo: string,
  ref: string | undefined,
  filePath: string,
): Promise<string> {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const pathPart = encodeGitHubContentsPath(filePath);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${pathPart}${q}`;
  const data = (await githubFetchJson(url)) as GhContentFile;
  if (data.type !== "file" || data.encoding !== "base64" || !data.content) {
    throw new Error("Unexpected GitHub file payload");
  }
  return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
}

/**
 * Lists allowed skill files (`.md`, `.js`, `.mjs`) under a GitHub path, recursing into at most `maxDepth` subdirectory levels.
 */
export async function collectGitHubSkillFiles(
  owner: string,
  repo: string,
  ref: string | undefined,
  pathPrefix: string,
  maxDepth: number,
): Promise<{ path: string; content: string }[]> {
  const acc: { path: string; content: string }[] = [];

  async function visit(relPath: string, depthRemaining: number): Promise<void> {
    const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const seg = relPath ? `/${encodeGitHubContentsPath(relPath)}` : "";
    const url = `https://api.github.com/repos/${owner}/${repo}/contents${seg}${qs}`;
    const payload = await githubFetchJson(url);

    if (!Array.isArray(payload)) {
      const f = payload as GhContentFile;
      if (f.type !== "file") throw new Error("Unexpected GitHub API response");
      if (!allowedGithubFile(f.path)) return;
      const content =
        f.encoding === "base64" && f.content
          ? Buffer.from(f.content.replace(/\n/g, ""), "base64").toString("utf8")
          : await fetchGithubFileContent(owner, repo, ref, f.path);
      acc.push({ path: normalizeSkillFilePath(f.path), content });
      return;
    }

    for (const item of payload as GhContentItem[]) {
      if (item.type === "file") {
        if (!allowedGithubFile(item.path)) continue;
        const content = await fetchGithubFileContent(owner, repo, ref, item.path);
        acc.push({ path: normalizeSkillFilePath(item.path), content });
      } else if (item.type === "dir") {
        if (depthRemaining <= 0) continue;
        await visit(item.path, depthRemaining - 1);
      }
    }
  }

  await visit(pathPrefix, maxDepth);
  return acc;
}

export async function installSkillFromFiles(
  businessId: string,
  skillName: string,
  files: { path: string; content: string }[],
): Promise<{ skillId: string }> {
  await ensureBusinessMembership(businessId);
  const nm = skillName.trim();
  if (!nm) throw new Error("Skill name is required");
  if (!files.length) throw new Error("At least one file is required");

  const byPath = new Map<string, string>();
  for (const f of files) {
    byPath.set(normalizeSkillFilePath(f.path), f.content);
  }
  const normalized = [...byPath.entries()].map(([path, content]) => ({ path, content }));
  if (!includesSkillMd(normalized)) throw new Error("Skill must include SKILL.md");

  const db = getDb();
  const existing = await db.query.skills.findFirst({
    where: and(eq(skills.businessId, businessId), eq(skills.name, nm)),
  });

  let skillId: string;
  if (existing) {
    skillId = existing.id;
    await db.delete(skillFiles).where(eq(skillFiles.skillId, skillId));
    await db.update(skills).set({ updatedAt: new Date() }).where(eq(skills.id, skillId));
  } else {
    const [row] = await db.insert(skills).values({ businessId, name: nm }).returning();
    if (!row) throw new Error("Failed to create skill");
    skillId = row.id;
  }

  try {
    for (const f of normalized) {
      await db
        .insert(skillFiles)
        .values({ skillId, path: f.path, content: f.content })
        .onConflictDoUpdate({
          target: [skillFiles.skillId, skillFiles.path],
          set: { content: f.content },
        });
    }
  } catch (err) {
    if (!existing) {
      await db.delete(skills).where(eq(skills.id, skillId));
    }
    throw err;
  }

  return { skillId };
}

export async function installSkillFromGitHub(
  businessId: string,
  skillName: string,
  githubUrl: string,
): Promise<{ skillId: string }> {
  const { owner, repo, ref, pathPrefix } = parseGitHubRepoUrl(githubUrl);
  const collected = await collectGitHubSkillFiles(owner, repo, ref, pathPrefix, 2);
  return installSkillFromFiles(businessId, skillName, collected);
}

export async function deleteSkillFiles(skillId: string): Promise<void> {
  const db = getDb();
  const userId = await requireSessionUserId();
  const skill = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    columns: { businessId: true },
  });
  if (!skill) throw new Error("Skill not found");
  await assertUserBusinessAccess(userId, skill.businessId);
  await db.delete(skillFiles).where(eq(skillFiles.skillId, skillId));
}