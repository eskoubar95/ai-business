/** Pure path / GitHub URL helpers (no `"use server"` — safe to import from Client Components). */

export function normalizeSkillFilePath(path: string): string {
  const forward = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = forward.split("/").filter(Boolean);
  if (segments.some((s) => s === "..")) throw new Error("Invalid skill file path");
  return segments.join("/");
}

export function parseGitHubRepoUrl(input: string): {
  owner: string;
  repo: string;
  ref?: string;
  pathPrefix: string;
} {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    throw new Error("Invalid GitHub URL");
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host !== "github.com") throw new Error("Only github.com URLs are supported");
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Invalid GitHub repository path");
  const owner = parts[0]!;
  const repo = parts[1]!.replace(/\.git$/, "");
  let ref: string | undefined;
  let pathPrefix = "";
  if (parts[2] === "tree" && parts.length >= 4) {
    ref = decodeURIComponent(parts[3]!);
    pathPrefix = parts
      .slice(4)
      .map((p) => decodeURIComponent(p))
      .join("/");
  } else if (parts[2] === "blob" && parts.length >= 5) {
    ref = decodeURIComponent(parts[3]!);
    pathPrefix = parts
      .slice(4)
      .map((p) => decodeURIComponent(p))
      .join("/");
  }
  return {
    owner,
    repo,
    ref,
    pathPrefix: pathPrefix ? normalizeSkillFilePath(pathPrefix) : "",
  };
}
