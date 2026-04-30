# Skills

Markdown **skills** scoped to a **business**, linked to agents via `agent_skills`. File bodies live in `skill_files` (see `db/schema.ts`).

| Export | Notes |
|--------|--------|
| **`skill-file-utils.ts`** | Pure helpers: `normalizeSkillFilePath`, `parseGitHubRepoUrl` (importable from client bundles). |
| **`file-actions.ts`** | `installSkillFromFiles`, `installSkillFromGitHub`, `deleteSkillFiles` — multi-file skills, GitHub contents API (see optional `GITHUB_TOKEN`). |
| **`skill-upload-files.ts`** | Browser helpers: extract `{ path, content }[]` from a ZIP `File` or `FileList` (folder picks via `webkitRelativePath`). |
| **`actions.ts`** | `createSkill` / `updateSkill` / `deleteSkill` — single-`SKILL.md` flow; require business membership. |
| `listSkillsOverviewByBusiness` | Skills with file counts + linked agents (dashboard Skills page). |
| `attachSkillToAgent` / `detachSkillFromAgent` | Ensures agent + skill share the same `businessId`. |
| `getSkillsByAgent` | Joins through `agent_skills`, ordered by name. |
