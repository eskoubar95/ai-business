# Local orchestration runner

Polls `orchestration_events` (status `pending`) every 10 seconds and dispatches `webhook_trigger` events to Cursor via `@cursor/sdk`, using the same prompt layers as the product (system role, agent instructions, optional business memory, skills).

## Cursor API key resolution (workspace first)

For each event, the runner resolves the API key in this order:

1. **Workspace** — decrypts the first available key from `user_settings` for users linked to the business via `user_businesses`, ordered by **earliest membership** (`created_at` ascending). That usually matches whoever onboarded the business first when they saved a key.
2. **`CURSOR_API_KEY`** in `.env.local` — optional **fallback** only when no linked user has a stored key.

The runner needs **`ENCRYPTION_KEY`** in the environment (same as the Next.js app) so it can decrypt workspace keys.

## Prerequisites

- `DATABASE_URL` loaded from `.env` / `.env.local` (same as the Next.js app).
- **`ENCRYPTION_KEY`** (64 hex chars) — required to read encrypted keys from `user_settings`.
- At least **one business member** with a **validated Cursor key** saved in the app — or set **`CURSOR_API_KEY`** as a fallback for this process only.
- Target business: `local_path` set in Settings, business-scope **memory** exists (Grill-Me), webhook events created with `pending` status.
- Target agent: assigned **system role**; default target is the **lead agent** of the first team for the business unless `agentId` is sent in the webhook JSON body.

## Commands

```bash
npm run runner        # runner only
npm run dev:full      # Next.js + runner (concurrently)
```

## Stream B (orchestration sidecar)

- **`runner/orchestrator/server.ts`** — HTTP API: `POST /agent/spawn`, `GET /agent/:job_id`, `GET /health`. Set `DATABASE_URL`, run `npm run orchestrator` (default port 8787 via `ORCHESTRATOR_PORT`).
- **`runner/runpod/`** — RunPod GraphQL client + DB-backed wake/shutdown state machine (`runpod_instances`).
- **`runner/queue/`** — `agent_jobs` fair-share queue + quota warn-only checker (`communication_edges`).
- **`runner/litellm/`** — LiteLLM config template + `buildLiteLLMHeaders` for correlation headers.

## Engineer isolation

Agents with system role slug `engineer` run in a `git worktree` under `<localPath>/.worktrees/<taskId-or-eventId>`. The repo must be clean (`git status`) before the worktree is created.
