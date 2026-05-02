// "agent" is the only guaranteed default — all other filenames are user-defined.
export const DEFAULT_DOC_SLUG = "agent";
export const DEFAULT_DOC_FILENAME = "agent.md";

export type AgentDocumentRow = {
  slug: string;
  content: string;
  filename: string;
};

/** Derive a URL/DB-safe slug from a user-typed filename. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.md$/, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}

/** Ensure filename ends with .md */
export function toFilename(name: string): string {
  const trimmed = name.trim();
  return trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`;
}
