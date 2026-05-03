/** Best-effort public GitHub snapshot for Grill-Me reasoning only (never claims private access). */

export function parseGithubRepoUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  try {
    const u = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return null;
    const seg = u.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    if (seg.length < 2) return null;
    const [owner, repo] = seg;
    const repoClean = repo.replace(/\.git$/, "").replace(/\/$/, "");
    if (!owner || !repoClean) return null;
    return { owner, repo: repoClean };
  } catch {
    return null;
  }
}

type GithubContentFile = {
  encoding: string;
  content?: string;
};

async function ghGet(path: string, token?: string): Promise<Response> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "AI-Business-GrillReasoning",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { headers, next: { revalidate: 0 } });
}

function decodeGhBase64(b64: string): string {
  return Buffer.from(b64, "base64").toString("utf8").trim();
}

export type PublicRepoSnapshot = {
  readme: string | null;
  packageJson: string | null;
  topLevelListing: string | null;
  error: string | null;
};

/** Fetches README, package.json, and top-level listing for public repos. */
export async function fetchPublicRepoSnapshot(repoUrl: string): Promise<PublicRepoSnapshot> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const id = parseGithubRepoUrl(repoUrl);
  const empty: PublicRepoSnapshot = {
    readme: null,
    packageJson: null,
    topLevelListing: null,
    error: id ? null : "Invalid GitHub URL",
  };
  if (!id) return empty;

  const base = `https://api.github.com/repos/${encodeURIComponent(id.owner)}/${encodeURIComponent(id.repo)}`;
  try {
    const [readmeRes, pkgRes, rootRes] = await Promise.all([
      ghGet(`${base}/readme`, token),
      ghGet(`${base}/contents/package.json`, token),
      ghGet(`${base}/contents?per_page=100`, token),
    ]);

    let readme: string | null = null;
    if (readmeRes.ok) {
      const jr = (await readmeRes.json()) as GithubContentFile;
      if (jr.encoding === "base64" && jr.content)
        readme = decodeGhBase64(jr.content).slice(0, 24_000);
    }

    let packageJson: string | null = null;
    if (pkgRes.ok) {
      const jp = (await pkgRes.json()) as GithubContentFile;
      if (jp.encoding === "base64" && jp.content)
        packageJson = decodeGhBase64(jp.content).slice(0, 32_000);
    }

    let topLevelListing: string | null = null;
    if (rootRes.ok) {
      const arr = (await rootRes.json()) as Array<{ type: string; name: string }>;
      if (Array.isArray(arr)) {
        topLevelListing = arr
          .map((e) => (e?.type === "dir" ? `${e.name}/` : e.name))
          .filter(Boolean)
          .slice(0, 80)
          .join(", ");
      }
    }

    let error: string | null = null;
    if (!readmeRes.ok && !pkgRes.ok && !rootRes.ok) {
      error = readmeRes.status === 404 ? "Repo not found or private" : `GitHub API ${readmeRes.status}`;
    }

    return { readme, packageJson, topLevelListing, error };
  } catch {
    return { readme: null, packageJson: null, topLevelListing: null, error: "GitHub fetch failed" };
  }
}

export function formatRepoSnapshotForReasoning(snapshot: PublicRepoSnapshot): string {
  const parts: string[] = [];
  if (snapshot.readme) parts.push(`## README (truncated)\n\n${snapshot.readme}`);
  if (snapshot.packageJson) parts.push(`## package.json\n\n\`\`\`json\n${snapshot.packageJson}\n\`\`\``);
  if (snapshot.topLevelListing) parts.push(`## Top-level paths\n\n${snapshot.topLevelListing}`);
  if (snapshot.error && parts.length === 0) parts.push(`## Snapshot note\n\n${snapshot.error}`);
  return parts.join("\n\n---\n\n").trim();
}
