# APM — Handoff til Worker (Manager)

Brug når en task på en gren er klar til PR / næste dispatch skal dokumenteres.

## Gør dette

1. Læs [`.apm/tracker.md`](../../.apm/tracker.md) og relevant stage i [`.apm/plan.md`](../../.apm/plan.md).
2. Opdater **handoff** for den Worker der lige har leveret eller skal modtage næste task:
   - Frontend: [`.apm/bus/frontend-agent/handoff.md`](../../.apm/bus/frontend-agent/handoff.md)
   - Backend: [`.apm/bus/backend-agent/handoff.md`](../../.apm/bus/backend-agent/handoff.md)
3. Sæt YAML-frontmatter: `task`, `phase`, `stage`, `branch`, `status`, `commit_tip`, `pr_number` hvor det passer.
4. Skriv **Manager actions** (PR, merge-rækkefølge, hvem der dispatch’es næst).
5. Opdater **dispatch-prompt** i samme bus-mappe:
   - [`.apm/bus/frontend-agent/task.md`](../../.apm/bus/frontend-agent/task.md)
   - [`.apm/bus/backend-agent/task.md`](../../.apm/bus/backend-agent/task.md)
6. Afstem **report.md** i samme bus-mappe (kort status + næste skridt).
7. Commit som `chore(apm): …` på den gren du arbejder på, eller på `main` hvis det kun er bus-dokumentation.

## Dispatch

Spawn Worker med **Task**-værktøjet og den **fulde** prompt fra den pågældende `task.md` (jf. `AGENTS.md` og `.cursor/rules/apm-worker-subagents.mdc`).
