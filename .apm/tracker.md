---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 2:**

| Task | Status | Agent | Branch |
| ---- | ------ | ----- | ------ |
| 2.1 | Active | backend-agent | grill-me-backend |
| 2.2 | Waiting: 2.1 | frontend-agent | |

**Stage 1:** Complete

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Dispatched Task 2.1 on `grill-me-backend` |
| frontend-agent | 1 | Idle until 2.1 completes |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
| ---------- | ----------- | ----------------- | ----------------- |
| ai-business (GitHub) | `main` | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |

## Working Notes

- **Stage 1** integration is on **`main`**. Outstanding env smoke: `npm run db:migrate` + live Neon Auth URL when credentials exist.
- **Stage 2.1** uses branch **`grill-me-backend`** (no worktree); implement Grill-Me backend + Cursor SDK on this branch, merge to `main` after review.
- If `.apm/worktrees/schema-auth-infra` still exists on disk (Windows lock), remove it manually and run `git worktree prune` / `git branch -d schema-auth-infra` when the folder is free.
