# Scripts

## `run-drizzle-migrate.mjs`

Runs Drizzle migrations from `./drizzle` using the **`postgres`** TCP client (see `package.json` script **`npm run db:migrate`**). Prefer **`DATABASE_DIRECT_URL`** for Neon when available; otherwise **`DATABASE_URL`**.

The Next.js app continues to use Neon HTTP via `getDb()`; this script is only for applying versioned SQL migrations reliably (including in CI).

## `recover-apm-phase2-from-transcript.mjs`

One-off / repeat use: genskaber **`.apm/spec.md`**, **`.apm/plan.md`**, **Stage 1 Task Bus** (`task.md`), **`.apm/memory/index.md`** (overskrives — kør evt. efterfølgende manuel sync), samt **Task 1.1 / 1.2 Worker handoffs** til **`.apm/memory/handoffs/worker-recovered/`** fra Cursor **agent transcripts** under `%USERPROFILE%\.cursor\projects\c-Users-Nicklas-Github-ai-business\agent-transcripts\`.

Lader **`.apm/tracker.md`** stå urørt (sandhed med PR-merge status skal komme fra repo).
