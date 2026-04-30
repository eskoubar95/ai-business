---
stage: 2
task: 2
agent: frontend-agent
log_path: ".apm/memory/stage-02/task-02-02.log.md"
has_dependencies: true
---

# Grill-Me UI, onboarding, and E2E

## Task Reference

Deliver the Grill-Me end-user flow: create business, chat turns, soul file preview, Playwright E2E — building on the merged backend on `main`.

## Context from Dependencies

This Task depends on work completed by the backend track:

**Integration steps (read in repo before coding)**

1. Open `lib/grill-me/actions.ts` — note **`createBusiness(name)`** returns **`Promise<{ id: string }>`** and **`startGrillMeTurn(businessId, userMessage)`** returns **`Promise<{ assistantReply: string; soulStored: boolean }>`**. Import these server actions from their module in Client Components only via Form actions or typed calls — do not import server-only DB paths into client files.
2. Open `lib/grill-me/README.md` — completion marker is exactly **`[[GRILL_ME_COMPLETE]]`** (see also `lib/grill-me/markers.ts`).
3. Open `app/api/grill-me/stream/route.ts` — **GET** SSE at **`/api/grill-me/stream?businessId=<uuid>`** (middleware protects `/api/grill-me/*`). The route runs a **separate** Cursor pass for streaming; **`startGrillMeTurn` already runs the agent once** and persists user + assistant rows.

**Producer output summary**

- **Authoritative assistant text for each turn** after submit: use the **`assistantReply`** field from **`startGrillMeTurn`**. Render it in the message list (you may **simulate** “streaming” in the UI by revealing chunks of `assistantReply` client-side if you want progressive UX **without** calling the SSE endpoint for that same turn).
- **Do not** call **`/api/grill-me/stream`** in the same user submit path as **`startGrillMeTurn`** unless you accept **two** Cursor invocations per turn (slow/costly). Optional: expose a separate “debug stream” control later — out of scope for MVP unless documented.
- Soul file: when **`soulStored`** is true or when **`assistantReply`** contains the marker, show markdown preview (fetch memory via a small server action or extend backend if needed — prefer adding **`getBusinessSoulMemory(businessId)`** server read if no API exists yet; keep reads server-only).

If no read action exists for `memory` rows, add a minimal **`"use server"`** getter in `lib/grill-me/` (or colocated file) that returns the latest `business`-scoped markdown for the business — **validate membership** with the same pattern as `assertUserBusinessAccess`.

## Objective

Ship onboarding + Grill-Me chat + soul preview integrated with existing actions, plus **`tests/grill-me.spec.ts`** covering the Plan’s happy path.

## Detailed Instructions

1. Install **`react-markdown`** (or `@uiw/react-md-editor` preview-only) if not present.

2. **`app/dashboard/onboarding/page.tsx`**: client or server form with business name; on submit call **`createBusiness`** then **`redirect`** to **`/dashboard/grill-me/[businessId]`**.

3. **Components under `components/grill-me/`** (or `app/components/grill-me/` if you align with existing `nav-shell` layout):
   - **`message-list.tsx`** — scrollable turns (`user` vs `assistant` alignment); accepts props from parent state.
   - **`input-form.tsx`** — textarea + send; disabled while a turn is in flight.
   - **`soul-file-preview.tsx`** — read-only markdown when soul file is available.
   - **`chat.tsx`** — client orchestrator: holds messages, calls **`startGrillMeTurn`** on send, appends user message optimistically then assistant from `assistantReply`, handles **`soulStored`** / marker for preview; optional **fake streaming** by ticking substrings of `assistantReply`.

4. **`app/dashboard/grill-me/[businessId]/page.tsx`**: server page loads existing `grill_me_sessions` via **`getDb()`** in a server-only module (new small helper if needed), passes initial turns into **`Chat`**.

5. **`app/dashboard/page.tsx`**: list businesses the user belongs to with links to each Grill-Me chat or onboarding; match existing dashboard styling.

6. **Navigation**: add “Start new business” (or similar) pointing to onboarding — extend `nav-shell` as needed.

7. **Playwright `tests/grill-me.spec.ts`**: authenticated user (reuse auth setup from smoke tests if any or document manual `storageState`); flow: onboarding → chat → **three** user turns with deterministic short messages; assert assistant text appears and soul preview or completion state; assert DB via API is **out of scope** for Playwright — assert UI markers only unless you add a test-only route (prefer UI assertions).

8. Update **`app/README.md`** with new routes.

## Workspace

- Branch **`grill-me-frontend`** (synced from `main`). Commit all frontend work here; Manager merges to `main` after review.

## Expected Output

- Onboarding page, Grill-Me dynamic route, grill-me components, optional `hooks/use-grill-me-stream.ts` only if you implement a **non-conflicting** use (not required if you use `assistantReply` only).
- Playwright spec + passing **`npm run test:e2e`**.
- **`npm run build`** succeeds.

## Validation Criteria

- Manual or E2E: sign-in → create business → chat → soul preview when completion fires.
- **`npm run lint`**, **`npm run build`**, **`npm run test:e2e`** green.

## Instruction Accuracy

If reading `memory` for preview requires a new server action, add the smallest safe query and document it in the Task Log.

## Task Logging

Write **`.apm/memory/stage-02/task-02-02.log.md`** per `.cursor/apm-guides/task-logging.md`.

## Task Report

Clear Task Bus when done; write **`.apm/bus/frontend-agent/report.md`**; user runs **`/apm-5-check-reports frontend-agent`** in Manager chat.
