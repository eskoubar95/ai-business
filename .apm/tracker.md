---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 1:**

| Task | Status | Agent | Branch |
| ---- | ------ | ----- | ------ |
| 1.1 | Active | backend-agent | schema-auth-infra |
| 1.2 | Done | frontend-agent | |

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Task 1.1 — merge `main` into branch before continuing (see Working Notes) |
| frontend-agent | 1 | Task 1.2 reviewed and merged to `main`; idle until next dispatch |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
| ---------- | ----------- | ----------------- | ----------------- |
| ai-business (GitHub) | `main` | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |

## Working Notes

- **`main`** now includes Stage 1.2 UI foundation (Tailwind v4, Neon Auth UI, middleware, `lib/auth/*`, dashboard shell, Playwright smoke). Branch `ui-foundation-auth` merged and removed; its worktree was removed.
- **Backend (1.1):** In `.apm/worktrees/schema-auth-infra`, run `git merge main` before further commits so the worktree sees current auth files. Prefer extending/changing only what 1.1 still requires (schema, migrations, Docker, Vitest, `db/README.md`); do not blindly replace `middleware.ts` / `lib/auth/server.ts` / `app/api/auth` unless reconciliation is needed with Drizzle work.
- Remote push remains manual unless the team decides otherwise.
