# Communication graph (Stream C)

Server-side **communication edges** and **policy enforcement** for cross-agent consults (ADR §8).

## Modules

| File | Purpose |
|------|---------|
| [`schemas.ts`](schemas.ts) | Zod schemas for edge CRUD and `POST /api/communication/check` body |
| [`edge-store.ts`](edge-store.ts) | Drizzle CRUD + idempotent upsert + `merge_smart` updates |
| [`template-defaults.ts`](template-defaults.ts) | Load canonical `policy.json` for drift detection |
| [`policy-enforcer.ts`](policy-enforcer.ts) | `checkConsult` / `checkConsultAgainstEdges` — `hard_block` semantics |
| [`actions.ts`](actions.ts) | Server Actions (`createEdge`, `updateEdge`, `deleteEdge`, `listEdges`) |
| [`seed-from-bundle.ts`](seed-from-bundle.ts) | Idempotent seed from `CommunicationPolicyShard` |
| [`http.ts`](http.ts) | JSON helper for registry-aligned API errors |
| [`route-auth.ts`](route-auth.ts) | Shared session gate for edge CRUD routes |
| [`orchestrator-auth.ts`](orchestrator-auth.ts) | Bearer secret check for `POST /check` (timing-safe) |
| [`params.ts`](params.ts) | UUID validation for `[edgeId]` route params |

## HTTP API

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/communication/edges?businessId=` | Session + business membership | List edges |
| `POST /api/communication/edges` | Session + membership | Create / upsert edge (JSON body includes `businessId`) |
| `PATCH /api/communication/edges/:edgeId?businessId=` | Session + membership | `merge_smart` patch (`edgeId` must be UUID) |
| `DELETE /api/communication/edges/:edgeId?businessId=` | Session + membership | Delete edge (`edgeId` must be UUID) |
| `POST /api/communication/check` | **Session + membership** *or* **`Authorization: Bearer` + `COMMUNICATION_ORCHESTRATOR_SECRET`** | Policy gate; returns registry-shaped errors with `correlation_id` |

### Orchestrator / worker

Set `COMMUNICATION_ORCHESTRATOR_SECRET` in the server environment (see root `.env.example`). Callers send the same value as `Authorization: Bearer <secret>`. If the secret is unset, only dashboard/session auth works (local dev).

### Quotas

`checkConsult` does **not** increment or enforce `quota_per_hour` (`warnOnly` / `enforce`). That belongs in the job queue / orchestrator (Stream B). This layer checks graph membership, intent, artifacts, and human-ack only.

## Dashboard

- `/dashboard/communication?businessId=` — table + create/edit form (DB is source of truth).

## Tests

```bash
npx vitest run lib/communication
```

## Related

- DB: `communication_edges` in [`db/schema.ts`](../../db/schema.ts)
- Template shard: [`templates/conduro/enterprise/v3/communication/policy.json`](../../templates/conduro/enterprise/v3/communication/policy.json)
- Errors: [`templates/conduro/enterprise/v3/errors/registry.json`](../../templates/conduro/enterprise/v3/errors/registry.json)
