---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 1:** Complete

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Task 1.1 merged to `main`; idle until Stage 2 dispatch |
| frontend-agent | 1 | Task 1.2 merged earlier; idle until Stage 2 dispatch |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
| ---------- | ----------- | ----------------- | ----------------- |
| ai-business (GitHub) | `main` | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |

## Working Notes

- **Stage 1** integration is on **`main`** (Drizzle schema + migrations, Docker, Vitest, Neon Auth placeholders, UI shell, Playwright smoke, unified middleware).
- **Follow-up before Stage 2 or release (environment):** With real `DATABASE_URL`, run `npm run db:migrate` on a fresh Neon DB; confirm Neon Auth session semantics with a live `NEON_AUTH_BASE_URL` (Worker log: placeholder URL yielded 502/connection errors, not 401).
- `schema-auth-infra` feature branch removed after merge; remote push remains manual.
