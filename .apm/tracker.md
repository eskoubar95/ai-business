---

## title: AI Business Platform

# APM Tracker

## Task Tracking

**Stage 2:**


| Task | Status       | Agent          | Branch           |
| ---- | ------------ | -------------- | ---------------- |
| 2.1  | Active       | backend-agent  | grill-me-backend |
| 2.2  | Waiting: 2.1 | frontend-agent |                  |


**Stage 1:** Complete

## Worker Tracking


| Agent          | Instance | Notes                                     |
| -------------- | -------- | ----------------------------------------- |
| backend-agent  | 1        | Dispatched Task 2.1 on `grill-me-backend` |
| frontend-agent | 1        | Idle until 2.1 completes                  |


## Version Control


| Repository           | Base Branch | Branch Convention                                                                                                               | Commit Convention                                                              |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ai-business (GitHub) | `main`      | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |


## Working Notes

- **Neon:** `DATABASE_URL` and Neon Auth are configured locally (`.env.local`). `npm run db:migrate` has been run successfully from **repo root** on the current branch tip.
- **Dev:** Keep a single Next dev/server on **:3000** from **repo root**; a leftover `next start`/dev from the old `schema-auth-infra` worktree caused false Neon Auth errors until stopped.
- **Stage 2.1:** Branch `grill-me-backend`; merge to `main` after review.
- **Worktree cleanup:** If `.apm/worktrees/schema-auth-infra` still exists on disk (Windows lock), remove when free and `git worktree prune` / `git branch -d schema-auth-infra` if needed.