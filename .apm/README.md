# APM workspace (`.apm/`)

Artefacts til **Planner/Manager**: spec, plan, tracker, memory og Worker **bus**.

| Path | Rolle |
|------|--------|
| `spec.md` | Produkt/overblik fra Planner (**baseline** fra `cursor/apm-planning-phase`; detaljeret Phase 2-teknik se `docs/phase-2-architecture-spec.md`). |
| `plan.md` | Planner work breakdown (**Phase 1**-struktur); ** aktiv Phase 2** følger `tracker.md` + architecture-spec ovenfor. |
| `tracker.md` | Aktuel opgaveliste / stage-status (jf. `.apm/bus/*` og PR-landinger). |
| `memory/` | Task logs og indeks pr. sprint/stage. |
| `bus/<worker>/` | `task.md`, `report.md`, `handoff.md` pr. Worker. |

## Synk fra Planner-gren (`cursor/apm-planning-phase`)

Planner-output opdateres typisk kun på **`cursor/apm-planning-phase`**. Lokalt tracking-gren er **`cursor/apm-planning-phase`** ↔ `origin/cursor/apm-planning-phase`.

```bash
git fetch origin cursor/apm-planning-phase
git branch -u origin/cursor/apm-planning-phase cursor/apm-planning-phase
```

For at kopiere Planner-filer til **`main`** uden merge af app-kode (tilpas før commit ved konflikt med jeres edits):

```bash
git checkout main
git checkout origin/cursor/apm-planning-phase -- .apm/spec.md .apm/plan.md .apm/metadata.json .apm/memory/index.md
```

Fjern eller ret **callout-blokken** øverst i `plan.md` efter kopiering, hvis Planner har overskrevet den.
