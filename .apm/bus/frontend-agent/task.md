# Task dispatch — Stage 4, Task 4.2 (Frontend Agent)

**Branch:** Work on **`approval-notion-ui`** (create from current `main` after pulling latest).

**Task Log:** `.apm/memory/stage-04/task-04-02.log.md`

**Task Report:** When done, write `.apm/bus/frontend-agent/report.md` (YAML frontmatter + body).

---

## Objective

Approval queue, Notion connection + sync view, webhook delivery log, agent status from **`getAgentStatus`** — see `.apm/plan.md` **Task 4.2** for full checklist and Playwright criteria.

## Backend contracts (on `main`)

- **Approvals:** `lib/approvals/actions.ts` — `createApproval`, `approveArtifact`, `rejectArtifact` (`"use server"`).
- **Agent status:** `lib/orchestration/events.ts` — `getAgentStatus(agentId)` → `idle` | `working` | `awaiting_approval`.
- **Notion MCP:** `saveMcpCredential` / `lib/mcp/config.ts` includes Notion + optional **`tasksDatabaseId`** for sync datasource.
- **Webhook log:** Read `webhook_deliveries` / Drizzle `webhookDeliveries` (server-only query pattern — add **`listWebhookDeliveriesByBusiness`** or inline in page if no action exists yet; follow existing `lib/*/actions.ts` style, `"use server"`).

## Deliverables (plan steps 1–10)

Implement pages under `app/dashboard/approvals/`, `app/dashboard/notion/`, `app/dashboard/webhooks/`, components under `components/approvals/`, `components/notion/`, update **`components/agents/agent-card.tsx`** for live status badge (Suspense/`getAgentStatus`), dashboard nav with approvals link + **pending count**, `tests/approvals.spec.ts`.

## Validation

`npm run lint`, `npm test -- --run`, `npm run build`, `npm run test:e2e` where applicable (`E2E_*` + DB for authenticated flows).

## Dependencies

Task 3.2 ✅; Task 4.1 ✅ on `main`.
