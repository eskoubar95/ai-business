---
worker: backend-agent
task: "1.1 — Schema Migrations + Data Migration"
phase: 2
stage: 1
branch: phase2/stage1-backend
status: complete
handoff_version: 1
---

# Worker Handoff — Backend Agent → Manager / downstream

## Summary

Task **1.1** is closed out on **`phase2/stage1-backend`** per Backend Worker completion: Phase 2 schema and data migrations applied in Drizzle; legacy columns (`agents.instructions`, `skills.markdown`, `mcp_credentials.agent_id`) removed after backfill; MCP credentials scoped by **`business_id`** with **`agent_mcp_access`** junction; supporting server code updated so queries align with new tables.

## Authoritative artifacts

| Artifact | Path |
|----------|------|
| Task definition | `.apm/bus/backend-agent/task.md` |
| Task log | `.apm/memory/stage-01/task-01-01.log.md` |
| Worker report | `.apm/bus/backend-agent/report.md` |
| Architecture reference | `docs/phase-2-architecture-spec.md` §2 |

## Deliverables checklist (Worker-reported)

- **`db/schema.ts`**: New enums/tables — `user_settings`, `agent_archetypes`, `agent_documents`, `skill_files`, `tasks`, `task_logs`, `agent_mcp_access`; `businesses` extra columns; MCP model moved to business scope + junction.
- **Migrations** (verify filenames/order on branch tip): **`0003_harsh_turbo.sql`** (DDL + data scripts: archetypes seed, instructions→soul/tools/heartbeat docs, skill markdown→`SKILL.md`, MCP backfill + junction); **`0004_phase2_drop_legacy_columns.sql`** (dedupe MCP per `(business_id, mcp_name)`, drop legacy columns/indexes, `business_id` NOT NULL + unique index).
- **Application code**: Agents/skills/memory retrieval/MCP/notions paths updated for new shapes (Worker cited `agents`, `skills`, `memory/retrieval`, `mcp/actions`, `notion/client`, `AgentForm`-related types).

## Validation gate (Worker-reported — re-run before merge)

`npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run db:migrate`, `npm run build` — all green on delivered branch.

## Downstream notes

1. **Frontend T1.2**: Merge **`phase2/stage1-backend`** into **`phase2/stage1-frontend`** (or merge both via **`main`** once T1.1 PR lands) before final UI verification so types and Server Actions match schema. Worker noted UI may still expose **`instructions`** while mapping reads/writes **soul** `agent_documents` — confirm consistency after integration.
2. **Backend T2.1**: Depends on **`user_settings`** and stable agent document model — safe to plan once T1.1 is on **`main`**.
3. **Manager**: Confirm PR from **`phase2/stage1-backend`** → **`main`**; reconcile `.apm/tracker.md` if merge closes before Frontend finishes.

## VC reminder for incoming readers

Truth lives on **`phase2/stage1-backend`** until merged. If local **`main`** lacks **`0003`**/**`0004`** migrations, fetch/checkout that branch before auditing files.
