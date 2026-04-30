---
stage: 3
task: 2
agent: frontend-agent
log_path: ".apm/memory/stage-03/task-03-02.log.md"
has_dependencies: true
---

# Roster UI, org chart, MCP dashboard, teams

## Task Reference

Build the **agent roster**, **skills** UX, **MCP credential installer**, **team builder**, and **org chart** on top of the Stage 3.1 server actions already on `main`.

## Context from Dependencies

**Read before coding (repository paths):**

1. **`lib/agents/actions.ts`** — `createAgent`, `updateAgent`, `deleteAgent`, `getAgentsByBusiness`, `assertUserOwnsAgent`. `createAgent` expects **`{ businessId, name, role, instructions, reportsToAgentId? }`**. All mutations require the session user to be a **member of `businessId`** (or own the agent).
2. **`lib/skills/actions.ts`** — `createSkill`, `updateSkill`, `deleteSkill`, `attachSkillToAgent`, `detachSkillFromAgent`, `getSkillsByAgent`. Check parameter shapes in file.
3. **`lib/mcp/actions.ts`** — `saveMcpCredential(agentId, mcpName, payloadObject)`, `getMcpCredentialsMeta(agentId)`, `deleteMcpCredential(id)`. **Never** send secrets to the browser except through HTTPS forms that post into **`saveMcpCredential`**.
4. **`lib/mcp/config.ts`** — `listMcpTypeConfigs()`, `MCP_TYPE_CONFIGS` for **github**, **notion**, **context7** field definitions. Render forms from this metadata.
5. **`lib/teams/actions.ts`** — `createTeam`, `addTeamMember`, `removeTeamMember`, `setTeamLead`, `getTeamWithMembers`. There is **no** `listTeamsByBusiness` yet: add **`export async function listTeamsByBusiness(businessId: string)`** in the same file (read-only: `requireSessionUserId`, `assertUserBusinessAccess`, return teams for that business ordered by name) — small, tested only if you add a minimal test or rely on E2E.
6. **Business scope:** Mirror **`app/dashboard/page.tsx`** for loading the user’s businesses (join `user_businesses` + `businesses`). Roster/team routes need an explicit **`businessId`** (search param, path segment, or “current business” selector). Document the pattern in **`app/README.md`**.

**Agent status badge:** The product Spec references **`getAgentStatus`** (orchestration). That ships in **Stage 4.1**. For this Task, show a **static badge** labelled **`idle`** (or a single neutral state) on agent cards, and note in the Task Log that dynamic status arrives with orchestration — do **not** block the Task on Stage 4.

## Objective

Deliver pages and components so a user can manage agents (CRUD + instructions markdown), skills, MCP installs, and teams with a readable org chart, plus **`tests/agents.spec.ts`** (Playwright).

## Detailed Instructions

1. Install **`@uiw/react-md-editor`** (or equivalent) for **instructions** and skill markdown; mark editor wrappers **`"use client"`**.

2. **`app/dashboard/agents/page.tsx`** — list agents for chosen **`businessId`**; each card: name, role, **`idle`** status badge, skill count, MCP count; links to edit; **New agent** CTA.

3. **`app/dashboard/agents/new/page.tsx`** — form: name, role, instructions (markdown), `reportsToAgentId` (**`<select>`** of same-business agents, empty = null).

4. **`app/dashboard/agents/[agentId]/edit/page.tsx`** — same fields, load current agent via `getAgentsByBusiness` + find or a dedicated read if you add one.

5. **`components/agents/skill-manager.tsx`** — list attached skills, attach/detach, inline create skill (calls `createSkill` + `attachSkillToAgent`).

6. **`components/mcp/mcp-installer.tsx`** — badges from `getMcpCredentialsMeta`; **Install** opens modal driven by **`listMcpTypeConfigs()`**; submit builds **`Record<string, unknown>`** from field names and calls **`saveMcpCredential(agentId, mcpId, payload)`** with **`mcpName`** exactly **`github`**, **`notion`**, or **`context7`**.

7. **`components/agents/org-chart.tsx`** (client) — tree from `reportsToAgentId` for agents in a **team** context or business-wide view per Plan; simple CSS/ flex tree is enough.

8. **`app/dashboard/teams/page.tsx`** — list teams (via **`listTeamsByBusiness`**), member count, lead name.

9. **`app/dashboard/teams/new/page.tsx`** — create team (name, lead select from agents), then add **two** additional members (Plan validation).

10. **`app/dashboard/teams/[teamId]/page.tsx`** — **`getTeamWithMembers`**; show org chart + member list; highlight lead.

11. **`tests/agents.spec.ts`** — Playwright: authenticated user (reuse **`E2E_EMAIL`/`E2E_PASSWORD`** pattern from **`tests/grill-me.spec.ts`**); create agent → edit instructions → create skill → attach → install **GitHub** MCP with **dummy** token fields → assert badges; create team → set lead → add two agents → assert tree visible. Use **`data-testid`** attributes.

12. **Nav:** extend **`app/components/nav-shell.tsx`** with links to **`/dashboard/agents`** and **`/dashboard/teams`** (include **`businessId`** in query or documented default).

13. **`npm run lint`**, **`npm run build`**, **`npm run test:e2e`** (where CI secrets exist locally or skip with note in log).

## Workspace

Branch **`agent-roster-frontend`** (from latest `main`). All commits for this Task on that branch.

## Expected Output

Per Plan output list: dashboard agent/team routes, `components/agents/*`, `components/mcp/*`, `components/teams/*` (or nested under `components/agents` for team chart), Playwright spec, README touch-ups.

## Validation Criteria

- E2E passes locally when auth env + DB are set OR document skip with reason.
- Build passes.

## Instruction Accuracy

If a server action signature differs after you pull, follow the TypeScript definitions in-repo.

## Task Logging

Write **`log_path`** per `.cursor/apm-guides/task-logging.md`.

## Task Report

Clear Task Bus after logging; **`/apm-5-check-reports frontend-agent`** in Manager chat.
