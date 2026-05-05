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

## HTTP API

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/communication/edges?businessId=` | Session + business membership | List edges |
| `POST /api/communication/edges` | Session + membership | Create / upsert edge (JSON body includes `businessId`) |
| `PATCH /api/communication/edges/:edgeId?businessId=` | Session + membership | `merge_smart` patch |
| `DELETE /api/communication/edges/:edgeId?businessId=` | Session + membership | Delete edge |
| `POST /api/communication/check` | Session + membership | Policy gate; returns registry-shaped errors with `correlation_id` |

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
