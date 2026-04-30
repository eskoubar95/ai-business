# Agents (roster)

Server Actions for business-scoped agents: create, update, delete, list, and `reports_to_agent_id` validation (cycle + same-business checks).

| File | Role |
|------|------|
| `actions.ts` | Neon Auth + `user_businesses` gated CRUD. |
| `document-model.ts` | Shared slugs + row shape for `agent_documents` (no Server Actions). |
| `document-actions.ts` | `getAgentDocuments` / `updateAgentDocument` for soul, tools, and heartbeat markdown. |
| `reports-cycle.ts` | Shared `wouldIntroduceReportsCycle` / `validateReportsToForBusiness` (pure DB types; testable without Neon Auth). |

Use Server Actions from this folder only via Next’s server action wiring (`"use server"`). Do not import `getDb` or other server-only modules into Client Components.
