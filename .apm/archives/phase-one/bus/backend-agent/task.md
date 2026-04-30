# Task dispatch — Stage 4, Task 4.1 (Backend Agent)

**Branch:** Work on `orchestration-backend` (create from current `main` if missing).

**Task Log:** `.apm/memory/stage-04/task-04-01.log.md` (create `stage-04` if needed).

**Task Report:** When done, write `.apm/bus/backend-agent/report.md` per APM bus protocol (YAML frontmatter + short summary body).

---

## Objective (from Plan)

Implement the webhook orchestration engine, bidirectional Notion API client, comment-based agent-mention parsing, approval lifecycle management, and orchestration event logging.

## Schema truth (repo)

Do **not** assume a table named `orchestration`. Use Drizzle types in `db/schema.ts`:

- **Events:** `orchestrationEvents` → PostgreSQL `orchestration_events` (`id`, `business_id`, `type`, `payload` JSONB, `status` enum `pending` | `processing` | `succeeded` | `failed`, `correlation_id`, `correlation_key`, timestamps).
- **Webhook audit:** `webhookDeliveries` → `webhook_deliveries` with unique `idempotency_key`.
- **Approvals:** `approvals` with `approval_status` enum `pending` | `approved` | `rejected`.

If Task text in `.apm/plan.md` says “insert into `orchestration`”, implement against **`orchestration_events`** instead. If Notion task sync needs extra structure, add a migration with a **one-line rationale** in the PR — do not invent unversioned schema.

## Deliverables

- `lib/webhooks/hmac.ts` — `signPayload`, `verifySignature` using `crypto.createHmac` and **`crypto.timingSafeEqual`** for verification.
- `lib/webhooks/engine.ts` — e.g. `deliverWebhook(type, businessId, payload, idempotencyKey)` with idempotency via `webhook_deliveries`; skip re-processing when already delivered.
- `lib/notion/client.ts` — `getNotionClient(businessId)` using decrypted Notion MCP credential (`getMcpCredentialDecrypted` / existing MCP patterns), **`@notionhq/client`**.
- `lib/notion/sync.ts` — `syncNotionTasks(businessId)`, `writeBackToNotion(businessId, pageId, update)` aligned with schema above.
- `lib/notion/parser.ts` — `parseAgentMentions(commentText)` → `{ agentSlug, message }[]` (plan example: `"Hello !grill-me please review"`).
- `lib/approvals/actions.ts` — `"use server"`: `createApproval`, `approveArtifact(approvalId, comment)`, `rejectArtifact(approvalId, comment)`; each should record orchestration/events as appropriate.
- `lib/orchestration/events.ts` — `logEvent(...)`, `getAgentStatus(agentId)` → `idle | working | awaiting_approval` from recent events (define consistent mapping in code + tests).

## Tests & docs

- Vitest: `lib/webhooks/__tests__/hmac.test.ts`, `lib/webhooks/__tests__/engine.test.ts`, `lib/notion/__tests__/parser.test.ts`, `lib/approvals/__tests__/actions.test.ts` (mock DB/Notion where needed).
- READMEs: `lib/webhooks/README.md`, `lib/notion/README.md`, `lib/approvals/README.md`, `lib/orchestration/README.md`.

## Config

- Ensure **`WEBHOOK_SECRET`** is documented in `.env.example` (name only; already added in this dispatch — keep it).

## Validation

- `npm run lint`, `npm test -- --run`, `npm run build` green.
- HMAC verify uses constant-time compare; duplicate `idempotency_key` does not double-process.

## Dependencies

Plan: depends on Task 3.1 (done on `main`).
