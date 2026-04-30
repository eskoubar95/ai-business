# Tasks domain (`lib/tasks`)

Server Actions and helpers for business-scoped **tasks**, **task logs**, and **@mention** orchestration triggers.

## Files

| File | Role |
|------|------|
| `actions.ts` | `"use server"` — CRUD, status updates (including approval link), subtree delete, tree listing by business, list by agent |
| `log-actions.ts` | `"use server"` — append log lines and fetch logs; human-authored logs trigger mention parsing |
| `mention-trigger.ts` | Scans log text for `@Name`, matches agents in the same business (case-insensitive), emits `orchestration_events` with `type: mention_trigger` (`status: pending`) |
| `task-tree.ts` | Pure helpers: subtree collection and safe delete ordering (children before parents) |

## Usage

- Import actions only from **Server Components**, Route Handlers, or other Server Actions — not from Client Components (`AGENTS.md` boundary).
- `authorId` on task logs is a **text** identifier (e.g. session user id or agent id), aligned with `task_logs.author_id`.

## Tests

```bash
npm test -- lib/tasks
```
