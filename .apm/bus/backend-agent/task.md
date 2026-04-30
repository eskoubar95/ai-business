# Task Bus — Backend Agent

**Phase:** 2  
**Stage:** 5  
**Task:** **5.1 — Archetypes seeding + Grill-Me two-path onboarding** — **STATUS: merged til `main`** (**[PR #10](https://github.com/eskoubar95/ai-business/pull/10)** @ `4f3821b`)  
**Worker:** Backend Agent  

**Branch:** Arbejde skete på **`phase2/stage5-backend`** (feature-tip **`709c545`** indeholdt af squash-merge).

---

## Manager / reviewer (efter merge) — ✅

1. ~~PR til `main`~~ — lavet (**PR [#10](https://github.com/eskoubar95/ai-business/pull/10)**).
2. **Deploy/dev:** **`npm run db:seed`** for at upserte archetype-tekster efter behov (idempotent).
3. ~~Dispatch Frontend **5.2**~~ — se `.apm/bus/frontend-agent/task.md` når **Frontend** Worker startes (**5.2** ikke backend-scope).

---

## Leverancer (på `main`)

- `db/seeds/archetypes.ts`, `db/seeds/archetype-rows.ts` — upsert launch archetypes.
- `package.json` — `npm run db:seed` → `tsx db/seeds/archetypes.ts`.
- `lib/grill-me/grill-prompt.ts`, `lib/grill-me/actions.ts` — `startGrillMeTurn(..., businessType?)`.
- `app/api/grill-me/ui/route.ts` — valgfri body `businessType`: `existing` | `new`.
- Vitest: prompt-, actions-, seed-data tests.
- Heartbeat: eksisterende `prompt-builder` indlæste allerede `heartbeat_addendum` fra archetype — ingen ændring krævet.

### Quality gate (merged)

Se `.apm/memory/stage-05/task-05-01.log.md` — **`npm test`**, **`npm run lint`**, **`npm run build`** grønt ved merge.

---

## References

| Resource | Path |
| -------- | ---- |
| Tracker  | `.apm/tracker.md` |
| Handoff  | `handoff.md` |
| Plan     | `.apm/plan.md` Stage 5, Task 5.1 |
