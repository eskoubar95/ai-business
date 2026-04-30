---

## title: AI Business Platform

# APM Memory Index

## Memory Notes

- **npm / Neon Auth:** `@neondatabase/auth` (beta) may list `next@>=16` as optional peer while the app targets Next 15; installs can require `.npmrc` with `legacy-peer-deps=true` until upstream or Next alignment changes.
- **Production builds:** `next build` can require `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` to be set during route analysis for Neon Auth routes—document in CI as the Worker noted.
- **Local dev / port 3000:** Run **at most one** Next process bound to `:3000`, started from the **repository root** (e.g. `npm run dev`). A stray `next start` or `next dev` left running from an old git worktree (e.g. a former `schema-auth-infra` checkout) can still answer on 3000 and surface **misleading Neon Auth errors** while the app you think you are using is another tree. Stop orphan processes before debugging auth.
- **Stage 1 — DB / Auth smoke:** `DATABASE_URL` / Neon Auth are configured in this environment; run `npm run db:migrate` from repo root after schema changes. Verify session behaviour against the real Neon Auth URL (not `build.invalid` placeholders).

## Stage Summaries

### Stage 1 - Foundation

Stage 1 completed with parallel backend (`schema-auth-infra`) and frontend (`ui-foundation-auth`) workstreams merged to `main`. Frontend delivered Tailwind v4, shadcn-themed UI, Neon Auth UI routes, nav shell, dashboard placeholder, and Playwright smoke tests. Backend delivered full Drizzle schema (including `orchestration_events` naming), migrations `0001`/`0002`, Dockerfile (standalone), Vitest wiring, and `db/README.md`. Manager integrated branches: resolved `main` ↔ backend conflicts (auth server placeholders vs strict env, middleware matchers combining `/account`, `/dashboard`, and `/api/protected`, unified `package.json` scripts and `next.config.ts`). Worker's Task 1.1 remained **Partial** on environment validation (`db:migrate` and live Neon Auth 401 check not run in-session); tracked as explicit follow-up in Working Notes and Memory.

**Task Logs:**

- `task-01-01.log.md`
- `task-01-02.log.md`