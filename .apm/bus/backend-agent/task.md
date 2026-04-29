---
stage: 1
task: 1
agent: backend-agent
log_path: ".apm/memory/stage-01/task-01-01.log.md"
has_dependencies: false
---

# Database schema, Neon Auth server, and infrastructure

## Task Reference

Backend foundation: full Drizzle schema, migrations, Neon Auth server wiring, Docker, Vitest, auth client stub.

## Objective

Establish the complete database schema, Neon Auth server integration, and project infrastructure so all subsequent backend work rests on migration-tracked, deployable foundations.

## Detailed Instructions

1. **Dependencies (npm):** Install and save `@neondatabase/auth`, update `@neondatabase/serverless` and `drizzle-orm` as needed. Dev: `vitest`, `@vitejs/plugin-react`, `@vitest/ui`.

2. **Schema (`db/schema.ts`):** Expand using Drizzle `pgTable` and `drizzle-orm/pg-core`. Types: `uuid`, `text`, `timestamp` with `withTimezone: true`, `integer`, `jsonb`, `bytea` where appropriate. Every primary key: `.primaryKey().defaultRandom()`. Every timestamp: `.notNull().defaultNow()` with UTC (`withTimezone: true`). Define tables in dependency order (no forward references), export a unified `schema` object:
   - **`businesses`** — already exists; extend only if required for downstream FKs or leave as-is if sufficient.
   - **`user_businesses`** — many-to-many between Neon Auth users and businesses (link auth user id to `businesses.id`).
   - **`memory`** — markdown memory; `business_id` required; optional `agent_id`; scope for business vs agent-level content; `updated_at` / optional `version` for concurrency as needed.
   - **`grill_me_sessions`** — Grill-Me turns: `business_id`, role (user vs assistant), `content`, monotonic `seq` per business (or equivalent ordering), timestamps.
   - **`agents`** — roster: business scoping, name, role, instructions (markdown text), optional `reports_to_agent_id` self-FK referencing `agents.id`.
   - **`skills`** — named markdown skill documents per business.
   - **`agent_skills`** — join agents ↔ skills.
   - **`teams`** — `business_id`, `lead_agent_id` FK to `agents`.
   - **`team_members`** — `team_id`, `agent_id`, sort order.
   - **`mcp_credentials`** — per agent; `mcp_name`; `encrypted_payload` as **jsonb**; **`iv` as text** (base64-encoded); timestamps.
   - **`orchestration`** — events: type, payload, status, correlation fields as appropriate.
   - **`webhook_deliveries`** — audit/idempotency: `business_id`, `type`, `payload` jsonb, `status`, `idempotency_key`, `attempts`, `last_error`, timestamps.
   - **`approvals`** — human gate: artifact reference, `pending` / `approved` / `rejected`, comment, timestamps; link to business and/or agent as appropriate.

3. **Relations:** Define `relations()` for all foreign keys so `db/index.ts` supports typed relational queries.

4. **Migrations:** Run `npm run db:generate` and confirm SQL covers all new tables. Commit generated files under `drizzle/`.

5. **Neon Auth (server):** Create `lib/auth/server.ts` exporting `createNeonAuth()` from `@neondatabase/auth/next/server` per package docs. Create `app/api/auth/[...path]/route.ts` exporting the auth `handler()`. Create root `middleware.ts` applying `auth.middleware()` so **protected** routes are under `/dashboard` (all nested paths) and `/api/protected` (all nested paths). **Public:** `/`, `/auth/*` (and any static/public API you add that must stay public). Adjust only if Next.js matcher syntax requires equivalent coverage.

6. **Auth client stub:** Create `lib/auth/client.ts` with `"use client"` as first line; export minimal `authClient` from `createAuthClient()` (`@neondatabase/auth/next`). This file will be replaced/expanded by the frontend task—keep the stub minimal but valid.

7. **Environment template:** Add to `.env.example` (names + short comments only, no real secrets): `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `DATABASE_URL` if not already documented, `ENCRYPTION_KEY` (32-byte AES key placeholder description), `NOTION_API_TOKEN` stub.

8. **Docker:** Multi-stage `Dockerfile`: `node:20-alpine` builder + runner, production-only copy, expose `3000`. Add `.dockerignore` excluding `node_modules`, `.next`, `.env*` files.

9. **Vitest:** Root `vitest.config.ts` using `@vitejs/plugin-react`; include patterns for `lib/**/*.ts`. Add npm scripts: `"test": "vitest"`, `"test:ui": "vitest --ui"`.

10. **Documentation:** Add `db/README.md` describing each table’s purpose, key relations, FKs, and workflow `db:generate` → `db:migrate`.

## Workspace

- **Primary code directory (clone for this branch):**  
  `c:\Users\Nicklas\Github\ai-business\.apm\worktrees\schema-auth-infra`  
  Run installs, `db:*`, `build`, `test`, `docker build`, and git commits **only** here on branch **`schema-auth-infra`**.
- **Message Bus and Task Log paths** are always relative to the **repository root**  
  `c:\Users\Nicklas\Github\ai-business`  
  Example: write logs to `.apm/memory/stage-01/task-01-01.log.md` under that root (the worktree shares the same tracked tree—if your editor resolves `.apm` under the root, use the root path for logging so the Manager sees one canonical copy).

## Expected Output

- Complete `db/schema.ts` with all tables above + `relations`.
- Versioned SQL migrations under `drizzle/`.
- `lib/auth/server.ts`, `app/api/auth/[...path]/route.ts`, `middleware.ts`.
- `lib/auth/client.ts` stub (client).
- Updated `.env.example`, `Dockerfile`, `.dockerignore`, `vitest.config.ts`, `package.json` scripts.
- `db/README.md`.

## Validation Criteria

- `npm run db:generate` emits SQL for the full schema set.
- `npm run db:migrate` succeeds against a **fresh** Neon database when `DATABASE_URL` is set.
- `npm run build` exits 0.
- `npm test` runs with 0 failures (no tests yet is acceptable if the runner exits cleanly).
- Unauthenticated `curl` to the session endpoint pattern for Neon Auth (e.g. `/api/auth/session` or the path your handler exposes) returns **401** or equivalent unauthenticated response.
- `docker build` completes successfully from repo root context (Dockerfile path as you placed it).

## Instruction Accuracy

If the repository’s existing `db/schema.ts`, `drizzle.config.ts`, or Next.js layout contradicts a bullet above, prefer the **actual codebase** and document the deviation in the Task Log.

## Task Iteration

On validation failure: read errors, fix minimally, re-run. If stuck after targeted attempts, use a debug subagent with file paths, commands, and expected vs actual behavior; validate its proposal before applying.

## Task Logging

After completion, write the Task Log to **`log_path`** using the structure and frontmatter rules in `.cursor/apm-guides/task-logging.md` (Task Log Procedure).

## Task Report

Clear your incoming Task Bus file after logging, then write a concise Task Report to `.apm/bus/backend-agent/report.md` (outcome, status, `log_path`, flags). Tell the user to run **`/apm-5-check-reports backend-agent`** in the **Manager** chat when ready.
