---

## worker: frontend-agent

task: "3.2 — Tasks UI + log feed + dashboard integration"
phase: 2
stage: 3
branch: phase2/stage3-frontend
status: pr_open
pr_number: 7
handoff_version: 3
commit_tip: 535a20a

# Worker Handoff — Frontend Agent → Manager / downstream

## Summary

Task **3.2** er **klar til review** og tracker på **PR [#7](https://github.com/eskoubar95/ai-business/pull/7)** (`phase2/stage3-frontend` → `main`). UI til tasks-board, oprettelse, detail med log-feed og kommentarer (`appendTaskLog`), samt dashboard-tællinger pr. virksomhed.

## Authoritative artifacts


| Artifact        | Path                                                                 |
| --------------- | -------------------------------------------------------------------- |
| Task definition | `.apm/bus/frontend-agent/task.md` / `.apm/plan.md` — Stage **3**, Task **3.2** |
| Task log        | `.apm/memory/stage-03/task-03-02.log.md`                            |
| Worker report   | `.apm/bus/frontend-agent/report.md`                                  |
| Pull request    | https://github.com/eskoubar95/ai-business/pull/7                    |

## Deliverables checklist (Worker-verified)

- **`app/dashboard/tasks/page.tsx`** — five-column board, `BusinessSelector`, link til new/detail
- **`app/dashboard/tasks/new/page.tsx`** + **`components/tasks/task-create-form.tsx`** — `createTask`
- **`app/dashboard/tasks/[taskId]/page.tsx`** — detail, **`TaskLogFeed`**, **`TaskCommentInput`**, **`TaskStatusSelect`**
- **`components/tasks/`** — `task-card.tsx`, `task-status-board.tsx`, `task-log-feed.tsx`, `task-comment-input.tsx`, `task-status-select.tsx`
- **`app/dashboard/page.tsx`** — in-progress / blocked counts, **Open tasks** link
- **Server helpers:** `lib/tasks/actions.ts` (`getTaskById`), `lib/tasks/flatten-task-tree.ts`, `lib/tasks/dashboard-queries.ts`; `lib/dashboard/business-scope.ts` (`/dashboard/tasks` scoped path)
- **Tests:** `lib/tasks/__tests__/flatten-task-tree.test.ts`; `tests/tasks.spec.ts` (E2E gated på `E2E_EMAIL` / `E2E_PASSWORD`)

## Validation gate (Worker-reported — re-run before merge)

`npm test -- lib/tasks/__tests__/flatten-task-tree.test.ts lib/tasks --run`, `npm run lint`, `npx tsc --noEmit`, `npm run build` — **Green** på branch tip (bekræft ved merge).

## Manager actions

1. Review og merge **PR #7** til `main` når gate er grøn.
2. Efter merge: opdater task-log med merge-commit; kør evt. **`/apm-5-check-reports frontend-agent`** (eller tilsvarende post-merge check).
3. **Backend Task 4.1** kan planlægges fra **`phase2/stage4-backend`** når `main` indeholder **Task 3.2**.

## Downstream notes

1. Importer `createTask`, `updateTaskStatus`, `getTasksByBusiness`, `getTaskById`, `appendTaskLog`, `getTaskLogs` kun fra **server**-grænser (RSC / Server Actions), jf. `AGENTS.md`.
2. `getTasksByBusiness` returnerer træ — UI flader via **`flattenTaskTree`** til kolonne-board.

## Integration

Hvis `main` flytter før merge: merge eller rebase `main` ind i `phase2/stage3-frontend` og genkør validation gate.
