---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 1:** Complete

**Stage 2:** Complete

**Stage 3:** Complete

**Stage 4:**

| Task | Status | Agent | Branch |
| ---- | ------ | ----- | ------ |
| 4.1 | Active | backend-agent | orchestration-backend |
| 4.2 | Waiting | frontend-agent | — (after 4.1) |

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Task 4.1 on `orchestration-backend` |
| frontend-agent | 1 | Idle; Task 4.2 after 4.1 merges |

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
