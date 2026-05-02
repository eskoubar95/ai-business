import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SKILL_FALLBACK_REL = ".agents/skills/grill-me-onboarding/SKILL.md";

/**
 * Loads Markdown bodies from `GRILL_ME_SKILL_PATHS` (comma-separated repo-relative paths),
 * or the default onboarding skill path when present. Used server-side before `runCursorAgent`.
 */
export async function loadGrillSkillAppendix(
  cwd: string = process.cwd(),
): Promise<string> {
  const rawEnv = process.env.GRILL_ME_SKILL_PATHS?.trim();
  const relPaths: string[] = rawEnv
    ? rawEnv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : existsSync(path.resolve(cwd, DEFAULT_SKILL_FALLBACK_REL))
      ? [DEFAULT_SKILL_FALLBACK_REL]
      : [];

  if (relPaths.length === 0) {
    return "";
  }

  const blocks: string[] = [];
  for (const rel of relPaths) {
    const abs = path.resolve(cwd, rel);
    if (!existsSync(abs)) {
      continue;
    }
    const body = (await readFile(abs, "utf8")).trim();
    if (!body.length) {
      continue;
    }
    const label = path.basename(rel, path.extname(rel));
    blocks.push(`## Skill: ${label}\n\n${body}`);
  }

  return blocks.join("\n\n---\n\n");
}
