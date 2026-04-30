---
stage: 2
task: 1
agent: backend-agent
log_path: ".apm/memory/stage-02/task-02-01.log.md"
has_dependencies: true
---

# Grill-Me backend and Cursor SDK

## Task Reference

Implement Grill-Me conversation backend: business creation, Cursor SDK turn loop, SSE stream route, soul file persistence using existing schema.

## Context from Dependencies

Building on your previous work:

**From Task 1.1**

- `db/schema.ts` now includes `businesses`, `user_businesses`, `grill_me_sessions` (roles `user` | `assistant`, ordered by `seq` per `businessId`), and `memory` with `memory_scope` enum (`business` | `agent`). Use `getDb()` from `db/index.ts` and existing Drizzle patterns.
- Neon Auth is wired: `lib/auth/server.ts`, `app/api/auth/[...path]/route.ts`, `middleware.ts` protects `/account`, `/dashboard`, `/api/protected`.
- Resolve current auth user in Server Actions the same way other protected server code will (e.g. `auth.getSession()` from your server module).

**Integration approach**

- Align new routes with existing path conventions. Re-read `db/schema.ts` for exact column names and enums before inserting rows.
- Adjust `grill_me_sessions` or `memory` only if you discover a genuine gap vs the Grill-Me flow; if you change schema, run `npm run db:generate` and commit new migrations.

## Objective

Deliver the Grill-Me conversation backend so the frontend can drive a turn-based chat, SSE streaming, and soul file handoff: **`createBusiness`**, **`startGrillMeTurn`**, **`extractAndStoreSoulFile`**, Cursor SDK wrapper, `/api/grill-me/stream` SSE, Vitest coverage, READMEs.

## Detailed Instructions

1. **Install** `@cursor/sdk` (`npm install @cursor/sdk` with `--legacy-peer-deps` if peer resolution requires it, consistent with existing `@neondatabase/auth` usage).

2. **`lib/cursor/agent.ts`:** Thin wrapper: export `runCursorAgent(prompt: string): Promise<AsyncIterable<string>>` using `Agent.create()` with `model: "composer-2"` and `runtime: { type: "local", cwd: process.cwd() }`, then stream via the SDK’s stream API as documented. Export a **`mockCursorAgent`** (or injectable hook) for Vitest to avoid real SDK calls in unit tests.

3. **`lib/grill-me/actions.ts`**, first line `"use server"`:
   - **`createBusiness(name: string)`** — validate non-empty name; insert `businesses`; insert `user_businesses` for the current authenticated user and that business; return new business id.
   - **`startGrillMeTurn(businessId: string, userMessage: string)`** — authorize that the session user has access to this business (via `user_businesses`); append user turn to `grill_me_sessions` with correct `seq`; load full history; build prompt (system or Grill-Me instructions + transcript + new message); call `runCursorAgent`; collect full assistant text from the stream; write assistant turn row; if the combined assistant output contains **`[[GRILL_ME_COMPLETE]]`**, call extraction and persist soul file.
   - **`extractAndStoreSoulFile(businessId: string, rawResponse: string)`** — strip the completion marker and surrounding noise as needed; insert or update `memory` with **`scope: 'business'`**, `agentId` null, markdown content = soul document (verbatim markdown as per product intent).

4. **Grill-Me UX contract (server):** One assistant reply per user submission for MVP; the completion marker is the signal that onboarding produced the soul file. Document the marker in README.

5. **`app/api/grill-me/stream/route.ts`:** **GET**, `businessId` query param (reject missing/invalid). **AuthZ** same business access as actions. Return **`Content-Type: text/event-stream`** and stream SSE `data:` events forwarding SDK/chunk output suitable for the browser `EventSource` consumer used in the next Task. You may reuse `runCursorAgent` with an appropriate prompt for “continue stream” if that matches your design, or document a minimal stream contract in README (must send at least one `data:` line in tests).

6. **Vitest (`lib/grill-me/__tests__/actions.test.ts`):**
   - Mock `@cursor/sdk` / `runCursorAgent` so tests do not hit the network.
   - Assert a user turn is persisted with correct `business_id`, role `user`, and content.
   - Assert assistant completion with marker yields a **`memory`** row with `scope` business and expected markdown body.

7. **SSE integration test (Vitest or co-located test):** Hit the route handler (or minimal app test harness) and assert response headers include `text/event-stream` and body contains at least one `data:` line — mock heavy SDK if needed.

8. **Docs:** `lib/cursor/README.md` and `lib/grill-me/README.md` describing the flow, marker, and SSE usage.

## Workspace

- Work in the **repository root** on branch **`grill-me-backend`** (`git checkout grill-me-backend`). All commits for this task go on this branch.
- Task Log path below is relative to the repo root.

## Expected Output

- `lib/cursor/agent.ts`, `lib/grill-me/actions.ts`, `app/api/grill-me/stream/route.ts`, tests, READMEs.
- Any schema/migration updates if required.
- `npm run build` still passes.

## Validation Criteria

- Vitest: turn write test; soul file extraction test; SSE route content-type / `data:` smoke as specified above.
- `npm run build` exits 0.
- `npm test` passes.

## Instruction Accuracy

If Cursor SDK API surface differs from the above (`Agent.create`, stream iteration), follow installed package behavior and document the actual calls in the Task Log.

## Task Iteration

Investigate failures before large refactors; use a debug subagent if stuck after targeted fixes.

## Task Logging

After completion, write the Task Log to **`log_path`** following `.cursor/apm-guides/task-logging.md` (Task Log Procedure).

## Task Report

Clear your Task Bus after logging; write `.apm/bus/backend-agent/report.md`; ask the user to run **`/apm-5-check-reports backend-agent`** in the Manager chat.
