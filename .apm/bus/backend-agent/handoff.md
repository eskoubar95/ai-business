---
worker: backend-agent
task: "5.1 — Archetypes seeding + Grill-Me two-path onboarding"
phase: 2
stage: 5
branch: phase2/stage5-backend
status: ready_for_pr
pr_number: null
commit_tip: 709c545
handoff_version: 6
---

# Worker Handoff — Backend Agent (Task **5.1** leveret på gren)

## Summary

**Task 5.1** er implementeret på **`phase2/stage5-backend`** (commit **`709c545`**): `npm run db:seed`, Grill-Me `businessType` (`existing` \| `new`) i `startGrillMeTurn` og **`POST /api/grill-me/ui`**, Vitest. Log: `.apm/memory/stage-05/task-05-01.log.md`.

**Næste skridt:** PR til **`main`** (nej merge endnu — `pr_number` udfyldes når PR findes).

## Authoritative artifacts

| Artifact        | Path                                                                 |
| --------------- | -------------------------------------------------------------------- |
| Task definition | `.apm/plan.md` — Stage **5**, Task **5.1**                           |
| Task log        | `.apm/memory/stage-05/task-05-01.log.md`                             |
| Worker report   | `.apm/bus/backend-agent/report.md`                                   |
| Dispatch (arkiv) | `.apm/bus/backend-agent/task.md` — leverance beskrevet; ny dispatch first når ny backend-task findes |

## Manager actions

1. **Åbn PR** `phase2/stage5-backend` → **`main`** (tip **`709c545`**); sæt `pr_number` i denne fil når PR eksisterer.
2. **Efter merge af 5.1:** kør **`npm run db:seed`** i hvert miljø hvor archetype-addenda skal opdateres (idempotent).
3. **Dispatch Frontend Task 5.2:** når **`main`** har 5.1, brug **Task**-værktøjet med **fuld** prompt fra `.apm/bus/frontend-agent/task.md` (jf. `AGENTS.md`).
4. Ingen ny backend-dispatch i Stage 5 efter 5.1 medmindre plan udvider scope.

## Downstream (Frontend **5.2**)

Frontend skal sende **`businessType`** til Grill-Me API (`/api/grill-me/ui`) og vise to-path valg i onboarding — se `.apm/plan.md` Task **5.2**. **Start ikke** frontend-arbejde på `main` før **5.1** er merged.
