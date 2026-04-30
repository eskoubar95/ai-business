# Skills

Markdown **skills** scoped to a **business**, linked to agents via `agent_skills`. File bodies live in `skill_files` (see `db/schema.ts`).

| Export | Notes |
|--------|--------|
| **`file-actions.ts`** | `installSkillFromFiles`, `installSkillFromGitHub`, `deleteSkillFiles` — multi-file skills, GitHub contents API (see optional `GITHUB_TOKEN`). |
| **`actions.ts`** | `createSkill` / `updateSkill` / `deleteSkill` — single-`SKILL.md` flow; require business membership. |
| `attachSkillToAgent` / `detachSkillFromAgent` | Ensures agent + skill share the same `businessId`. |
| `getSkillsByAgent` | Joins through `agent_skills`, ordered by name. |
