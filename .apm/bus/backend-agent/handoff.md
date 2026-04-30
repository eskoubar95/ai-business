---

## worker: backend-agent

task: "3.1 — Tasks CRUD + task_logs + @mention trigger"
phase: 2
stage: 3
branch: phase2/stage3-backend
status: merged_main
handoff_version: 1
commit_tip: 51cbc67

# Worker Handoff — Backend Agent → Manager / downstream

## Summary

Task **3.1** er **merged** til **`main`** (**PR [#6](https://github.com/eskoubar95/ai-business/pull/6)**, squash). Tasks-domæne: CRUD, hierarkisk liste (`getTasksByBusiness` som træ), sikker subtræ-sletning, task logs og automatisk `mention_trigger` i `orchestration_events` ved menneskeskabte loglinjer med `@handle`.

## Authoritative artifacts


| Artifact        | Path                                       |
| --------------- | ------------------------------------------ |
| Task definition | `.apm/plan.md` — Stage **3**, Task **3.1** |
| Task log        | `.apm/memory/stage-03/task-03-01.log.md`   |
| Worker report   | `.apm/bus/backend-agent/report.md`         |
| Domain README   | `lib/tasks/README.md`                      |


## Deliverables checklist (Worker-verified)

- `**lib/tasks/actions.ts`** — `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`, `getTasksByBusiness`, `getTasksByAgent` (`"use server"`)
- `**lib/tasks/log-actions.ts`** — `appendTaskLog`, `getTaskLogs`; human logs → `parseAndTriggerMentions`
- `**lib/tasks/mention-trigger.ts**` — `@`-handles, case-insensitive agent-navn pr. business, `logEvent` med `type: mention_trigger`, `status: pending`
- `**lib/tasks/task-tree.ts**` — subtree + sletterækkefølge (børn før forælder)
- **Tests:** `lib/tasks/__tests__/*.test.ts` (10 tests)

## Validation gate (Worker-reported — re-run before merge)

`npm test -- lib/tasks`, `npm test`, `npm run lint`, `npm run build` — **Green** på branch tip (bekræfter Manager før merge).

Manuel smoke mod Neon er **ikke** kørt i Worker-session (jf. Task Log).

## Manager actions (**efter merge** — udført)

1. ✅ **PR #6** merged til `main`.
2. **Frontend:** Checkout `main`, opret **`phase2/stage3-frontend`**, følg **Task 3.2** i `.apm/bus/frontend-agent/task.md`.

## Downstream notes (Frontend Task 3.2)

1. Importer kun `**@/lib/tasks/actions`** og `**@/lib/tasks/log-actions**` fra Server Components / Server Actions — ingen direkte DB i Client Components.
2. `getTasksByBusiness(businessId)` returnerer `**TaskTreeNode[]**` (rod-noder med rekursive `**children**`).
3. `appendTaskLog(taskId, content, authorType, authorId)` — brug `authorType: "human"` og session-bruger-id som `authorId` for kommentarer fra UI; mention-triggers kører automatisk for human.

## Integration

Næste backend-enhed (**Task 4.1**) starter fra **`phase2/stage4-backend`** efter at **Task 3.2** er merged.