# Agent rules (APM)

This file may be extended by the APM **Planner** during Work Breakdown.  
**Do not remove** the section below — it defines how Workers are run in Cursor.

## Worker dispatch via sub-agents

When dispatching a Task to a Worker, do **not** wait for the user to open a separate chat.

Use the **Task** tool (`subagent_type`: `generalPurpose` unless a narrower type fits) with the full Task Prompt. The Worker sub-agent must:

1. Read `.apm/bus/<worker-id>/task.md` for full instructions.
2. Execute the task.
3. Write the Task Log under `.apm/memory/` at the path specified in the Task Prompt.
4. Write a brief Task Report to `.apm/bus/<worker-id>/report.md`.
5. Return a one-paragraph summary to the parent Manager.

The Manager continues from the summary + report file.

(A mirrored copy lives in `.cursor/rules/apm-worker-subagents.mdc` so this behavior survives Planner edits — Planner should keep this section aligned.)

---

APM_RULES {

## Server / Client Boundary

- Every file containing Server Actions must have `"use server"` as its first line.
- Every file using React hooks, browser APIs, or interactive event handlers must have `"use client"` as its first line.
- Never import `lib/auth/server.ts`, `db/index.ts`, or any file that calls `getDb()` from a Client Component or a file marked `"use client"`. Database and auth are server-only.
- Server Components that call `auth.getSession()` must export `export const dynamic = "force-dynamic"` to prevent static caching.

## Database Access

- All database queries go through `getDb()` from `db/index.ts`. Never instantiate a separate Neon or Drizzle client.
- All schema changes are made via `drizzle-kit generate` followed by `drizzle-kit migrate`. Never use `db:push` as a primary workflow — it does not produce versioned migration files.
- All new tables use UUID primary keys (`.primaryKey().defaultRandom()`) and UTC timestamptz for every timestamp column (`.notNull().defaultNow()` with `withTimezone: true`).

## Secrets and Credentials

- Never hardcode secrets, tokens, connection strings, or keys in source files.
- When a task introduces a new environment variable, add its name (without a real value) and a one-line description to `.env.example`.
- Decrypted MCP credentials must never be returned to client components or logged. Server Actions that decrypt credentials consume the result server-side only.

## Testing

- New logic (Server Actions, utility functions, encryption, retrieval) gets Vitest unit or integration tests in a `__tests__/` subdirectory alongside the source file.
- Run `npm test` before marking a task complete. All existing tests must remain green.
- E2E tests (Playwright) cover critical user flows. Run `npm run test:e2e` for any task that adds or modifies a user-facing flow.

## Documentation

- Write or update a `README.md` in every directory you create or substantially modify. The README must explain: what the directory contains, what each major file does, and how to use the main exports or run relevant scripts.
- Keep README files current — if you change a Server Action signature or add a table, update the relevant README in the same commit.

## Commits

- Use Conventional Commits for all commit messages: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`. Example: `feat: add agent CRUD server actions`.
- Keep commits focused — one logical change per commit. Do not bundle unrelated changes.

## Version control (APM)

- Base branch: `main`. Create one feature branch per dispatch unit; use descriptive kebab-case names that reflect the work (do not embed APM Task IDs or Stage numbers in branch names).
- All implementation commits for the assigned unit go on that branch only; do not merge—leave merge coordination to the Manager.

## Code Language

- All code, comments, variable names, function names, file names, and inline documentation must be written in English.

## Worker Dispatch

Workers are **always** run as sub-agents spawned by the Manager using the `Task` tool — never as separate Cursor chat windows opened by the user. The full workflow:

1. Manager writes the Task Prompt to `.apm/bus/<worker-id>/task.md`.
2. Manager calls `Task(subagent_type="generalPurpose", prompt=<full task prompt>)` — the sub-agent runs inside the Manager's agent session.
3. The Worker sub-agent reads its task file, executes, writes a Task Log to `.apm/memory/`, writes a report to `.apm/bus/<worker-id>/report.md`, and returns a one-paragraph summary to the Manager.
4. Manager reads the summary + report and continues orchestration.

This rule is also enforced by `.cursor/rules/apm-worker-subagents.mdc` (`alwaysApply: true`), which applies to every agent session in this workspace automatically.

} //APM_RULES