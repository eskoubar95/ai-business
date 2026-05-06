# Enterprise agent instruction shards

Canonical markdown lives in one folder **per agent slug** (`<slug>/`) with exactly four files:

| File           | slug in `agent_documents` | Purpose                                |
|----------------|---------------------------|----------------------------------------|
| `AGENTS.md`    | `agents`                  | Role mandates, delegation, MUST NOT    |
| `SOUL.md`      | `soul`                    | Voice, persona, decision style         |
| `HEARTBEAT.md` | `heartbeat`               | Activation checklist and task cadence |
| `TOOLS.md`     | `tools`                   | MCP/tool usage and fallbacks          |

Paths are referenced from [`agents/agents.json`](../agents.json) (`instructions_path`).

Bundler (`npm run templates:build`) reads these bodies and attaches them as `agent_documents` on each agent row inside `dist/*.bundle.json` for deterministic seeding.

To regenerate scaffolding from curated metadata, run:

`npx tsx scripts/templates/materialize-enterprise-instructions.ts`
