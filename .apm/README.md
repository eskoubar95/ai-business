# APM workspace (`.apm/`)

Artefacts til **Planner**, **Manager** og **Workers** (spec, plan, tracker, memory, Task Bus).

| Path | Rolle |
|------|--------|
| `spec.md` | **Phase 2** Planner-spec (kopled fra `docs/phase-2-*` april 2026). |
| `plan.md` | **Phase 2**APM-plan — 10 tasks over 5 stages (detaljeret task copy). |
| `tracker.md` | Sandhed om **hvor langt du er nu** (status efter merges på `main`). |
| `memory/` | Task logs (`stage-NN/`), memory index; **recoverede** Worker-handoffs til Task 1.1 + 1.2 under **`memory/handoffs/worker-recovered/`**. |
| `bus/<worker>/` | `task.md`, `report.md`, `handoff.md` — seneste handoff for backend på bus efter Task 2.1. |

## Hvorfor filerne forsvant tidligere

Commit **`490232d`** flyttede aktiv `.apm/` til **`archives/phase-one/`** og fjernede de levende Planner-filer på `main`. Phase 2-øvelsen kørte derefter mest som **iklædt men ikke tilbageført** ændringer + senere blev **Tracker** committet igen ved `73c8451`, mens **fuld Phase 2 `plan.md`/`spec.md`** først nu er **genskabt** fra Cursor **agent transcripts** (samme tekst som i Planner/Manager-chatten).

**Genskabelses-script:** `node scripts/recover-apm-phase2-from-transcript.mjs` — se `scripts/README.md`.

## Ikke bland sammen med `cursor/apm-planning-phase`

Den git-gren holder et **ældre** Phase 1-lignende `.apm/plan.md`/`spec.md`. Overskriv **ikke** dine Phase 2-filer fra den gren uden tjek — brug **`recover-apm-phase2-from-transcript.mjs`** eller ret manuelt efter `$USER/.cursor/projects/.../agent-transcripts/`.
