# Agents (roster)

Server Actions for business-scoped agents: create, update, delete, list, and `reports_to_agent_id` validation (cycle + same-business checks).

| File | Role |
|------|------|
| `actions.ts` | Neon Auth + `user_businesses` gated CRUD. |
| `reports-cycle.ts` | Shared `wouldIntroduceReportsCycle` / `validateReportsToForBusiness` (pure DB types; testable without Neon Auth). |

Do not import roster actions from Client Components.
