---

## worker: backend-agent

task: "5.1 — Archetypes seeding + Grill-Me two-path onboarding"
phase: 2
stage: 5
branch: phase2/stage5-backend
status: ready_dispatch
pr_number: null
handoff_version: 5
commit_tip: null

# Worker Handoff — Backend Agent (næste: Task **5.1**)

## Summary

**Task 4.1** er **merged** til **`main`** (**PR [#8](https://github.com/eskoubar95/ai-business/pull/8)**, `fbe25fc`). **Task 5.1** er næste backend-arbejde: archetype seeds, Grill-Me `businessType` existing vs new, heartbeat prompt addendum.

**Plan-afhængighed:** Task **5.1** afhænger af **4.1** (ikke af **4.2**). Gren **`phase2/stage4-frontend`** kan mergeseparat.

## Authoritative artifacts

| Artifact        | Path                                                                 |
| --------------- | -------------------------------------------------------------------- |
| Task definition | `.apm/plan.md` — Stage **5**, Task **5.1**                           |
| Task log (ny)   | `.apm/memory/stage-05/task-05-01.log.md`                             |
| Worker report   | `.apm/bus/backend-agent/report.md`                                   |
| Dispatch prompt | `.apm/bus/backend-agent/task.md`                                     |

## Manager actions

1. Opret/sync **`phase2/stage5-backend`** fra **`main`**.
2. Brug **Task**-værktøjet med prompt fra **`task.md`** (fuld Task Prompt til Worker).
3. Efter merge af **5.1**: kør **frontend Task 5.2** (afhænger af **5.1**).

## Downstream (Frontend **5.2**)

Frontend skal have `startGrillMeTurn`-param for two-path + seeded archetypes til UI og heartbeat-visning. Koordinér merge-rækkefølge: **5.1** → `main` før **5.2** PR.
