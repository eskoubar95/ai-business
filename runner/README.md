# Local orchestration runner

Polls `orchestration_events` (status `pending`) every 10 seconds and dispatches `webhook_trigger` events to Cursor via `@cursor/sdk`, using the same prompt layers as the product (system role, agent instructions, optional business memory, skills).

## Prerequisites

- `DATABASE_URL` loaded from `.env` / `.env.local` (same as the Next.js app).
- `CURSOR_API_KEY` in `.env.local` — used only by this process (outside Neon Auth session encryption).
- Target business: `local_path` set in Settings, business-scope **memory** exists (Grill-Me), webhook events created with `pending` status.
- Target agent: assigned **system role**; default target is the **lead agent** of the first team for the business unless `agentId` is sent in the webhook JSON body.

## Commands

```bash
npm run runner        # runner only
npm run dev:full      # Next.js + runner (concurrently)
```

## Engineer isolation

Agents with system role slug `engineer` run in a `git worktree` under `<localPath>/.worktrees/<taskId-or-eventId>`. The repo must be clean (`git status`) before the worktree is created.
