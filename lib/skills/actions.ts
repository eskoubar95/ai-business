"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { agentSkills, agents, skillFiles, skills } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { and, asc, eq } from "drizzle-orm";

const SKILL_MD_PATH = "SKILL.md";

async function ensureBusinessMembership(businessId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
}

async function skillRowForBusiness(skillId: string, businessId: string) {
  const db = getDb();
  const row = await db.query.skills.findFirst({
    where: and(eq(skills.id, skillId), eq(skills.businessId, businessId)),
  });
  return row;
}

export async function createSkill(params: {
  businessId: string;
  name: string;
  markdown: string;
}) {
  const { businessId, name, markdown } = params;
  const nm = name.trim();
  const md = markdown.trim();
  if (!nm) throw new Error("Skill name is required");
  await ensureBusinessMembership(businessId);
  const db = getDb();

  // Neon HTTP driver (drizzle-orm/neon-http) does not support db.transaction().
  const [skillRow] = await db.insert(skills).values({ businessId, name: nm }).returning();
  if (!skillRow) throw new Error("Failed to create skill");
  try {
    await db.insert(skillFiles).values({
      skillId: skillRow.id,
      path: SKILL_MD_PATH,
      content: md.length ? md : "",
    });
  } catch (err) {
    await db.delete(skills).where(eq(skills.id, skillRow.id));
    throw err;
  }

  return skillRow;
}

export async function updateSkill(
  skillId: string,
  patch: Partial<{ name: string; markdown: string }>,
) {
  const db = getDb();
  const userId = await requireSessionUserId();
  const existing = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Skill not found");
  await assertUserBusinessAccess(userId, existing.businessId);

  const payload: Partial<typeof skills.$inferInsert> = {};
  if (patch.name !== undefined) {
    const nm = patch.name.trim();
    if (!nm) throw new Error("Skill name is required");
    payload.name = nm;
  }

  // Neon HTTP driver does not support db.transaction(); run steps sequentially.
  if (patch.markdown !== undefined) {
    const trimmed = patch.markdown.trim();
    await db
      .insert(skillFiles)
      .values({
        skillId,
        path: SKILL_MD_PATH,
        content: trimmed,
      })
      .onConflictDoUpdate({
        target: [skillFiles.skillId, skillFiles.path],
        set: { content: trimmed },
      });
  }

  if (patch.name !== undefined || patch.markdown !== undefined) {
    payload.updatedAt = new Date();
    const [updated] = await db.update(skills).set(payload).where(eq(skills.id, skillId)).returning();
    if (!updated) throw new Error("Skill not found");
    return updated;
  }

  const unchanged = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
  });
  if (!unchanged) throw new Error("Skill not found");
  return unchanged;
}

export async function deleteSkill(skillId: string): Promise<void> {
  const db = getDb();
  const userId = await requireSessionUserId();
  const existing = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Skill not found");
  await assertUserBusinessAccess(userId, existing.businessId);
  await db.delete(skills).where(eq(skills.id, skillId));
}

export async function attachSkillToAgent(agentId: string, skillId: string) {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const skill = await skillRowForBusiness(skillId, businessId);
  if (!skill) throw new Error("Skill not found in business");

  const db = getDb();
  await db.insert(agentSkills).values({ agentId, skillId }).onConflictDoNothing();
}

export async function detachSkillFromAgent(agentId: string, skillId: string): Promise<void> {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const skill = await skillRowForBusiness(skillId, businessId);
  if (!skill) throw new Error("Skill not found in business");

  const db = getDb();
  await db.delete(agentSkills).where(
    and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)),
  );
}

export async function listSkillsByBusiness(businessId: string) {
  await ensureBusinessMembership(businessId);
  const db = getDb();
  return db.query.skills.findMany({
    where: eq(skills.businessId, businessId),
    orderBy: [asc(skills.name)],
  });
}

export type SkillOverviewRow = {
  id: string;
  name: string;
  fileCount: number;
  agents: { id: string; name: string }[];
};

/** Skills with file counts and agents linked via `agent_skills`. */
export async function listSkillsOverviewByBusiness(
  businessId: string,
): Promise<SkillOverviewRow[]> {
  await ensureBusinessMembership(businessId);
  const db = getDb();
  const rows = await db.query.skills.findMany({
    where: eq(skills.businessId, businessId),
    orderBy: [asc(skills.name)],
    columns: { id: true, name: true },
    with: {
      files: { columns: { id: true } },
      agentLinks: {
        with: {
          agent: { columns: { id: true, name: true } },
        },
      },
    },
  });

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    fileCount: s.files.length,
    agents: s.agentLinks
      .map((l) => l.agent)
      .filter((a): a is { id: string; name: string } => Boolean(a)),
  }));
}

export type SkillFilePayload = { path: string; content: string };

/** All files for a skill (ordered by path) for dashboard preview / editor. */
export async function listSkillFilesForSkill(
  skillId: string,
  businessId: string,
): Promise<SkillFilePayload[]> {
  await ensureBusinessMembership(businessId);
  const skill = await skillRowForBusiness(skillId, businessId);
  if (!skill) throw new Error("Skill not found");

  const db = getDb();
  const files = await db.query.skillFiles.findMany({
    where: eq(skillFiles.skillId, skillId),
    orderBy: [asc(skillFiles.path)],
    columns: { path: true, content: true },
  });

  return files.map((f) => ({ path: f.path, content: f.content }));
}

export async function getSkillsByAgent(agentId: string) {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const db = getDb();

  const links = await db.query.agentSkills.findMany({
    where: eq(agentSkills.agentId, agentId),
    with: {
      skill: {
        with: {
          files: true,
        },
      },
    },
  });

  return links
    .map((link) => link.skill)
    .filter((row): row is NonNullable<(typeof links)[number]["skill"]> => row !== null && row.businessId === businessId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
