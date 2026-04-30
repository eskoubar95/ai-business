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
| 4.1 | Done | backend-agent | merged → `main` |
| 4.2 | Done | frontend-agent | `approval-notion-ui` (merge til `main` / PR) |

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Task 4.1 merged to `main`; idle |
| frontend-agent | 1 | Task 4.2 reviewed; idle — næste Task via bus |

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
- **Task 4.2:** Bekræft `tests/approvals.spec.ts` i CI eller lokalt med fri **:3000** (`baseURL` / `webServer.url`) og `E2E_EMAIL` / `E2E_PASSWORD` / `E2E_SETUP_SECRET`.
- **MCP:** `ENCRYPTION_KEY` som **64 hex-tegn** (32 bytes) i `.env.local` før man gemer rigtige MCP-credentials.
