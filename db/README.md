# Database (`db/`)

Schema is defined in Drizzle (`schema.ts`). Migrations live under `drizzle/` and are produced by drizzle-kit.

## Workflow

1. **`npm run db:generate`** — Generates SQL under `drizzle/` from `schema.ts`. `drizzle.config.ts` loads `.env` / `.env.local` and chooses **`DATABASE_DIRECT_URL`** (if set), else **`DATABASE_URL`** — see `.cursor/rules/database-architecture.mdc`.
2. **`npm run db:migrate`** — Applies pending migrations against that same resolved URL.

## Tables (summary)

| Table | Purpose |
| --- | --- |
| `businesses` | Tenant root; agents, memory, teams, etc. reference this. |
| `user_businesses` | Links Neon Auth users (`user_id` text) to `businesses`. |
| `agents` | Agent roster per business; optional `reports_to_agent_id` self-FK. |
| `memory` | Markdown memory; `scope` distinguishes business vs agent-level rows. |
| `grill_me_sessions` | Grill-Me ordered turns per business (`seq` unique per business). |
| `skills` / `agent_skills` | Named markdown skills and join to agents. |
| `teams` / `team_members` | Teams with `lead_agent_id` and member ordering. |
| `mcp_credentials` | Encrypted MCP payloads per agent (`encrypted_payload` JSON + `iv`). |
| `orchestration_events` | Orchestration payloads and correlation fields. |
| `webhook_deliveries` | Delivery audit with idempotency key and attempts. |
| `approvals` | Human approval gate with `artifact_ref` JSON and status enum. |

Relations for relational queries are exported next to each table in `schema.ts`.
