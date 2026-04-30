---
title: AI Business Platform
---

# APM Tracker

## Task Tracking

**Stage 2:** Complete

**Stage 3:**

| Task | Status | Agent | Branch |
| ---- | ------ | ----- | ------ |
| 3.1 | Active | backend-agent | agent-roster-backend |
| 3.2 | Waiting: 3.1 | frontend-agent | |

**Stage 1:** Complete

## Worker Tracking

| Agent | Instance | Notes |
| ----- | -------- | ----- |
| backend-agent | 1 | Dispatched Task 3.1 on `agent-roster-backend` |
| frontend-agent | 1 | Idle until 3.1 completes |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
| ---------- | ----------- | ----------------- | ----------------- |
| ai-business (GitHub) | `main` | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |

## Working Notes

- **Neon:** `DATABASE_URL` + Neon Auth configured locally; `npm run db:migrate` after schema changes.
- **Dev:** Én Next på **:3000** fra **repo-roden**.
- **Grill-Me UI:** `POST /api/grill-me/ui` (AI SDK UI) kalder `startGrillMeTurn` én gang per besked; `GET /api/grill-me/stream` er ældre SSE-sti.
- **CI:** `.github/workflows/e2e.yml` — sæt repo secrets (`DATABASE_URL`, `NEON_AUTH_*`, `E2E_*`); workflow sætter `GRILL_ME_E2E_MOCK=1` for stabil Grill-Me E2E (Cursor mock i `lib/cursor/agent.ts`).
- **APM:** Workers committer kun; merge/push er Manager/ejer (bekræftet i Task 2.2 rapport).
- **Stage 3.1 — MCP:** Sæt **`ENCRYPTION_KEY`** i `.env.local` som **64 hex-tegn** (32 bytes) før MCP-kode testes; opdater `.env.example` hvis beskrivelsen afviger.
