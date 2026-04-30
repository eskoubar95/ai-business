# Task Bus — Backend Agent

**Phase:** 2  
**Stage:** 5  
**Task:** **5.1 — Archetypes seeding + Grill-Me two-path onboarding** — **STATUS: leveret på gren**  
**Worker:** Backend Agent  

**Branch:** `phase2/stage5-backend` @ **`709c545`** (klar til PR → `main`).

---

## Manager / reviewer (efter implementering)

1. Gennemgå PR fra `phase2/stage5-backend` mod **`main`**.
2. Efter merge: overvej **`npm run db:seed`** i deploy/dev for at opdatere `agent_archetypes`-tekster (upsert på slug).
3. Når **`main`** har 5.1: dispatch **Frontend** Task **5.2** via `.apm/bus/frontend-agent/task.md` + **Task**-værktøjet.

---

## Leverancer (verificeret på grenen)

- `db/seeds/archetypes.ts`, `db/seeds/archetype-rows.ts` — upsert launch archetypes.
- `package.json` — `npm run db:seed` → `tsx db/seeds/archetypes.ts`.
- `lib/grill-me/grill-prompt.ts`, `lib/grill-me/actions.ts` — `startGrillMeTurn(..., businessType?)`.
- `app/api/grill-me/ui/route.ts` — valgfri body `businessType`: `existing` | `new`.
- Vitest: prompt-, actions-, seed-data tests.
- Heartbeat: eksisterende `prompt-builder` indlæste allerede `heartbeat_addendum` fra archetype — ingen ændring krævet.

### Quality gate (leveret)

`npm test`, `npm run lint`, `npm run build` grønt. Ingen nye secrets.

---

## References

| Resource | Path |
| -------- | ---- |
| Tracker  | `.apm/tracker.md` |
| Handoff  | `handoff.md` |
| Plan     | `.apm/plan.md` Stage 5, Task 5.1 |
