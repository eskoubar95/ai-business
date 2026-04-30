---

## title: AI Business Platform

# APM Tracker

## Task Tracking

**Stage 2:**


| Task | Status | Agent          | Branch            |
| ---- | ------ | -------------- | ----------------- |
| 2.1  | Done   | backend-agent  |                   |
| 2.2  | Active | frontend-agent | grill-me-frontend |


**Stage 1:** Complete

## Worker Tracking


| Agent          | Instance | Notes                                      |
| -------------- | -------- | ------------------------------------------ |
| backend-agent  | 1        | Task 2.1 reviewed, merged to `main`        |
| frontend-agent | 1        | Dispatched Task 2.2 on `grill-me-frontend` |


## Version Control


| Repository           | Base Branch | Branch Convention                                                                                                               | Commit Convention                                                              |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ai-business (GitHub) | `main`      | Descriptive kebab-case feature branches off `main`; parallel work uses dedicated worktrees under `.apm/worktrees/` (gitignored) | Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:` |


## Working Notes

- **Neon:** `DATABASE_URL` + Neon Auth configured locally; `npm run db:migrate` ok from repo root.
- **Dev:** Én Next på **:3000** fra **repo-roden** (ingen orphan worktree-server).
- **Grill-Me UI:** Chat kører på **Vercel AI SDK UI** (`@ai-sdk/react` + `ai`): `**POST /api/grill-me/ui`** kalder `**startGrillMeTurn` én gang** pr. besked og streamer `assistantReply` som deltas (ingen ekstra Cursor-kørsel). Gammel `**GET /api/grill-me/stream`** findes stadig til tidligere SSE-design.
- Merge `grill-me-frontend` til `main` efter review.