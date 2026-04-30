---

## title: AI Business Platform

# APM Memory Index

## Memory Notes

- **npm / Neon Auth:** `@neondatabase/auth` (beta) may list `next@>=16` as optional peer while the app targets Next 15; installs can require `.npmrc` with `legacy-peer-deps=true` until upstream or Next alignment changes.
- **Production builds:** `next build` can require `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` to be set during route analysis for Neon Auth routes—document in CI as the Worker noted.
- **Local dev / port 3000:** Run **at most one** Next process bound to `:3000`, started from the **repository root** (e.g. `npm run dev`). A stray `next start` or `next dev` left running from an old git worktree (e.g. a former `schema-auth-infra` checkout) can still answer on 3000 and surface **misleading Neon Auth errors** while the app you think you are using is another tree. Stop orphan processes before debugging auth.
- **Stage 1 — DB / Auth smoke:** `DATABASE_URL` / Neon Auth are configured in this environment; run `npm run db:migrate` from repo root after schema changes. Verify session behaviour against the real Neon Auth URL (not `build.invalid` placeholders).
- **Grill-Me UI (Stage 2.2):** The chat uses **Vercel AI SDK UI** — `@ai-sdk/react` (`useChat`, `DefaultChatTransport`) and the **`ai`** package (`createUIMessageStream`, `createUIMessageStreamResponse`). The dedicated route is **`POST /api/grill-me/ui`**, which calls **`startGrillMeTurn` once** per user message and streams the returned **`assistantReply`** as incremental text deltas (no second Cursor invocation). Legacy **`GET /api/grill-me/stream`** remains for the earlier SSE design; new UI should prefer **`/api/grill-me/ui`**. Shadcn/Tailwind and “Vercel-style” chat primitives stay as configured in-repo.

## Stage Summaries

### Stage 1 - Foundation

Stage 1 completed with parallel backend (`schema-auth-infra`) and frontend (`ui-foundation-auth`) workstreams merged to `main`. Frontend delivered Tailwind v4, shadcn-themed UI, Neon Auth UI routes, nav shell, dashboard placeholder, and Playwright smoke tests. Backend delivered full Drizzle schema (including `orchestration_events` naming), migrations `0001`/`0002`, Dockerfile (standalone), Vitest wiring, and `db/README.md`. Manager integrated branches: resolved `main` ↔ backend conflicts (auth server placeholders vs strict env, middleware matchers combining `/account`, `/dashboard`, and `/api/protected`, unified `package.json` scripts and `next.config.ts`). Worker's Task 1.1 remained **Partial** on environment validation (`db:migrate` and live Neon Auth 401 check not run in-session); tracked as explicit follow-up in Working Notes and Memory.

**Task Logs:**

- `task-01-01.log.md`
- `task-01-02.log.md`

### Stage 2 - Grill-Me Vertical Slice

Backend (2.1) delivered Cursor SDK wrapper, `createBusiness` / `startGrillMeTurn`, soul persistence, `GET /api/grill-me/stream`, Vitest. Frontend (2.2) delivered onboarding, dashboard business list, chat with **Vercel AI SDK UI** (`POST /api/grill-me/ui`), soul preview via `getBusinessSoulMemory`, Geist fonts, Playwright `grill-me.spec.ts`, and `.github/workflows/e2e.yml` with `GRILL_ME_E2E_MOCK` for deterministic Cursor output in CI. Merged to `main`. Worker's procedural reminder: Workers commit only; merge/push is Manager/repo owner (`AGENTS.md`).

**Task Logs:**

- `task-02-01.log.md`
- `task-02-02.log.md`

### Stage 3 — Agent roster (complete)

**3.1 (backend)** merged to `main`: agent/skill/MCP/team server actions, AES-GCM encryption, `lib/mcp/config.ts`, memory retrieval + `assembleAgentContext`, Vitest. **3.2 (frontend)** merged to `main`: agents and teams routes, MCP installer with skills grouping, markdown editor on forms, org chart (`react-organizational-chart`), static idle badges, dashboard business scope helper, Playwright `tests/agents.spec.ts`; lint, build, Vitest green (agents E2E gated like Grill-Me until `E2E_*` + DB in env).

**Task Logs (3.x):**

- `task-03-01.log.md`
- `task-03-02.log.md`

### Stage 4 — Orchestration (in progress)

**4.1 (backend)** merged to `main`: webhook HMAC + idempotent `deliverWebhook`, Notion client/sync/parser (`dataSources.query`, `tasksDatabaseId` on MCP config), approvals Server Actions, `logEvent` / `getAgentStatus` on `orchestration_events`, Vitest + READMEs. **4.2 (frontend)** active — approvals/Notion/webhook UI and `getAgentStatus` on agent cards.

**Task Logs (4.x):**

- `task-04-01.log.md`