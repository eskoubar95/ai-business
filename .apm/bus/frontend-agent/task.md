# Task Bus — Frontend Agent

**Phase:** 2  
**Stage:** 5  
**Task:** **5.2 — Brand color + UI polish + empty states + business dashboard**  
**Worker:** Frontend Agent  

**Status:** **BLOCKER** — start først når **Backend Task 5.1** er **merged til `main`** (Grill-Me two-path API + archetypes). **Task 4.2** bør også være merged til `main` så du rebaser/cutter **`phase2/stage5-frontend`** fra et komplet Stage 4 `main`.

**Branch:** `phase2/stage5-frontend` fra **`main`** efter **5.1** merge.

---

## Instruktioner til Worker

1. Læs [`.apm/plan.md`](../plan.md) → **Stage 5**, **Task 5.2** (Implementation + Validation).
2. Udfør på **`phase2/stage5-frontend`**.
3. Task log: `.apm/memory/stage-05/task-05-02.log.md`
4. Report: `.apm/bus/frontend-agent/report.md`

### Hovedpunkter (fra plan)

- Empty states: Agents, Teams, Approvals, Tasks — forklaring + primær CTA.
- `app/dashboard/page.tsx` — business cards med agent count + tasks in progress (+ gerne “last active” hvis data findes).
- Sonner toasts på relevante forms (agent edit, team create, osv.) hvis ikke allerede dækket.
- Onboarding / Grill-Me: trin **før** chat — existing vs new project; send valg til `startGrillMeTurn` i tråd med **5.1** contract.
- Dark mode: fjern død `dark:bg-green-950` ell. lign. minimum.
- Nav: “New business” som knap/ikon frem for ren nav-link (jf. plan).

### Quality gate

`npm test`, `npm run lint`, `npm run build`; ved UI-flow ændring: `npm run test:e2e` hvis projektets Grill-Me/onboarding specs berøres.

---

## References

| Resource | Path |
|----------|------|
| Tracker | [`.apm/tracker.md`](../tracker.md) |
| Handoff (4.2 gren) | [`handoff.md`](./handoff.md) |
