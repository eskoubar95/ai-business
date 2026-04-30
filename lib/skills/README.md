# Skills

Markdown **skills** scoped to a **business**, linked to agents via `agent_skills`.

| Export | Notes |
|--------|--------|
| `createSkill` / `updateSkill` / `deleteSkill` | Require business membership. |
| `attachSkillToAgent` / `detachSkillFromAgent` | Ensures agent + skill share the same `businessId`. |
| `getSkillsByAgent` | Joins through `agent_skills`, ordered by name. |
