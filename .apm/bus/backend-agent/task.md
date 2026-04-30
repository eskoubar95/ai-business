# Task Bus — Backend Agent

**Phase:** 2  
**Stage:** 5  
**Task:** **5.1 — Archetypes seeding + Grill-Me two-path onboarding**  
**Worker:** Backend Agent  

**Branch:** `phase2/stage5-backend` fra **`main`** (ingen merge af frontend-4.2 påkrævet for denne opgave).

---

## Instruktioner til Worker

1. Læs den kanoniske spec: [`.apm/plan.md`](../plan.md) → **Stage 5**, **Task 5.1** (Implementation + Validation + Output).
2. Udfør arbejdet på gren **`phase2/stage5-backend`**.
3. Skriv **Task log:** `.apm/memory/stage-05/task-05-01.log.md` (scope, filer, tests, quality gate).
4. Skriv **Task report:** `.apm/bus/backend-agent/report.md` (kort summary + næste skridt).
5. Returnér ét-afsnit summary til Manager.

### Leverancer (fra plan)

- `db/seeds/archetypes.ts` — upsert `vertical-fullstack` og `harness-engineer` med fuld indhold fra projekt-spec (soul/tools/heartbeat addenda).
- `package.json` — script `npm run db:seed` → `tsx db/seeds/archetypes.ts`.
- `lib/grill-me/actions.ts` — udvid `startGrillMeTurn` med `businessType: 'existing' | 'new'`; forskellig systemprompt path A vs B; samme 6-sektion soul-output format.
- `lib/heartbeat/prompt-builder.ts` — ved agent med `archetype_id`, hent archetype og append `heartbeat_addendum` efter heartbeat-sektion.
- **Vitest** for seeds (mock/db efter projekt-mønster), prompt-forskelle, og heartbeat builder hvor muligt.

### Quality gate

`npm test`, `npm run lint`, `npm run build` grønt; ingen secrets; migrations kun hvis schema ændres (5.1 seeds kan være ren TS seed — følg repo-konvention).

---

## References

| Resource | Path |
|----------|------|
| Tracker | [`.apm/tracker.md`](../tracker.md) |
| Handoff | [`handoff.md`](./handoff.md) |
