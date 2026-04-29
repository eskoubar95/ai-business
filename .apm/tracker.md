---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 1:**

| Task | Status | Agent | Branch |
| ---- | ------ | ----- | ------ |
| 1.1 | Active | backend-agent | schema-auth-infra |
| 1.2 | Active | frontend-agent | ui-foundation-auth |

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | First dispatch — parallel Stage 1 |
| frontend-agent | 1 | First dispatch — parallel Stage 1 |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
| ---------- | ----------- | ----------------- | ----------------- |
| ai-business (GitHub) | `main` | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |

## Working Notes

- Planning branch `cursor/apm-planning-phase` was merged into `main` locally; `main` is the implementation base.
- Parallel Stage 1: backend worktree `.apm/worktrees/schema-auth-infra` on `schema-auth-infra`; frontend worktree `.apm/worktrees/ui-foundation-auth` on `ui-foundation-auth`.
- Remote push is manual unless the team decides otherwise.
