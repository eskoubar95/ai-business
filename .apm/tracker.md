---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 2:** Complete

**Stage 3:**

| Task | Status | Agent | Branch |
| ---- | ------ | ----- | ------ |
| 3.1 | Done | backend-agent | |
| 3.2 | Active | frontend-agent | agent-roster-frontend |

**Stage 1:** Complete

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Task 3.1 merged to `main` |
| frontend-agent | 1 | Dispatched Task 3.2 on `agent-roster-frontend` |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
| ---------- | ----------- | ----------------- | ----------------- |
| ai-business (GitHub) | `main` | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |

## Working Notes

- **Neon:** `DATABASE_URL` + Neon Auth locally; `npm run db:migrate` after schema changes.
- **Dev:** Én Next på **:3000** fra **repo-roden**.
- **Grill-Me UI:** `POST /api/grill-me/ui` (AI SDK); `GET /api/grill-me/stream` er ældre SSE-sti.
- **CI:** `.github/workflows/e2e.yml` — repo secrets + `GRILL_ME_E2E_MOCK`.
- **APM:** Workers committer kun; merge/push er Manager/ejer.
- **MCP:** `ENCRYPTION_KEY` som **64 hex-tegn** (32 bytes) i `.env.local` før man gemer rigtige MCP-credentials.
