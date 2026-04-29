---
stage: 1
task: 2
agent: frontend-agent
log_path: ".apm/memory/stage-01/task-01-02.log.md"
has_dependencies: false
---

# UI foundation, shadcn preset, Neon Auth UI, Playwright

## Task Reference

Frontend foundation: Tailwind v4, shadcn preset, Neon Auth UI provider and pages, app shell, dashboard placeholder, Playwright smoke test.

## Objective

Establish the visual and auth UX foundation: Tailwind v4 with the specified shadcn preset, Neon Auth UI wired in the root layout, auth and account routes, a minimal navigation shell, a protected dashboard placeholder, and Playwright with a baseline smoke test.

## Detailed Instructions

1. **Tailwind v4 + shadcn:** Install Tailwind v4 (`tailwindcss@next` and the integration path compatible with Next.js 15—`@tailwindcss/postcss` or `@tailwindcss/vite` per current stack). Initialize shadcn with **`npx shadcn@latest init --preset b3YQiewWyG`**. Verify tokens/theme at `/`.

2. **Global CSS:** In the global stylesheet, use `@import "tailwindcss";` and `@import "@neondatabase/auth/ui/tailwind";`. **Do not** import both `ui/tailwind` and `ui/css`.

3. **Neon Auth client package:** Install `@neondatabase/auth`. Implement **`lib/auth/client.ts`** with `"use client"` as the **first line**: export `authClient` from `createAuthClient()` (`@neondatabase/auth/next`). **Overwrite** the minimal stub left by the backend task so the client is production-ready for this milestone.

4. **Root layout (`app/layout.tsx`):** Wrap children with `NeonAuthUIProvider` and `authClient`. Set **`suppressHydrationWarning`** on `<html>` (Neon Auth injects theme class client-side). Import auth UI styles via the global CSS file—not a duplicate conflicting import chain.

5. **Auth routes:** Create `app/auth/[path]/page.tsx` using `AuthView` from Neon Auth UI. Create `app/account/[path]/page.tsx` using `AccountView` with `generateStaticParams` and `dynamicParams = false` per Neon Auth App Router examples.

6. **Navigation shell:** Add `app/components/nav-shell.tsx` as a **Server Component**: logo placeholder, placeholder nav links, `SignedIn` / `SignedOut`, and `UserButton` for signed-in users. Import into the root layout above page content as appropriate.

7. **Dashboard:** Add `app/dashboard/page.tsx` as a minimal placeholder. Middleware (from backend task) must send unauthenticated users to `/auth/sign-in` for dashboard routes.

8. **Playwright:** `npm install -D @playwright/test`. Run `npx playwright install`. Create `playwright.config.ts` with `baseURL: 'http://localhost:3000'`, `webServer` running `npm run dev`, reasonable timeout/retries for CI.

9. **Smoke test:** Add `tests/smoke.spec.ts`: visiting `/` returns 200; `/auth/sign-in` shows a form with an **email** input.

10. **Scripts:** Add `"test:e2e": "playwright test"` to `package.json`.

11. **Documentation:** Add `app/README.md`: route map, Server vs Client conventions, how auth context flows through layout.

## Workspace

- **Primary code directory (clone for this branch):**  
  `c:\Users\Nicklas\Github\ai-business\.apm\worktrees\ui-foundation-auth`  
  Run installs, `dev`, `build`, Playwright, and git commits **only** here on branch **`ui-foundation-auth`**.
- **Message Bus and Task Log paths** use repository root  
  `c:\Users\Nicklas\Github\ai-business`  
  Write the Task Log to `.apm/memory/stage-01/task-01-02.log.md` under that root.

## Expected Output

- Tailwind v4 + shadcn preset applied.
- `lib/auth/client.ts` (client), updated `app/layout.tsx`, `app/auth/[path]/page.tsx`, `app/account/[path]/page.tsx`.
- `app/components/nav-shell.tsx`, `app/dashboard/page.tsx`.
- `playwright.config.ts`, `tests/smoke.spec.ts`, npm scripts.
- `app/README.md`.

## Validation Criteria

- `npm run dev` serves `/` with expected theme.
- `/auth/sign-in` renders Neon Auth sign-in UI.
- Sign-up → sign-in → sign-out completes without errors (manual is acceptable if Playwright does not cover full auth in CI yet).
- `UserButton` shows for authenticated users.
- `npx playwright test` (or `npm run test:e2e`) exits 0.

## Instruction Accuracy

If package names, export paths, or Neon Auth APIs differ from this prompt, follow **installed package** typings and official Neon Auth Next.js docs; note differences in the Task Log.

## Task Iteration

Same as backend: minimal targeted fixes; escalate with a debug subagent if blocked.

## Task Logging

Write the Task Log to **`log_path`** per `.cursor/apm-guides/task-logging.md` (Task Log Procedure).

## Task Report

Clear your incoming Task Bus after logging, write `.apm/bus/frontend-agent/report.md`, and direct the user to **`/apm-5-check-reports frontend-agent`** in the **Manager** chat.
