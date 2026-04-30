# Dashboard routes

Business-scoped UI under `/dashboard/*`. Pages use `resolveBusinessIdParam` from `lib/dashboard/business-scope.ts` with `?businessId=` so tenants stay authorized.

| Path | Purpose |
|------|---------|
| `approvals/` | Pending approval queue + `[approvalId]` detail |
| `notion/` | Notion MCP credential form per agent + recent sync table |
| `webhooks/` | `webhook_deliveries` log for the selected business |
