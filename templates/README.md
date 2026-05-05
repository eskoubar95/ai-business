# Enterprise templates (`templates/`)

Versioned JSON **shards** describe default agent rosters, teams, gate kinds, communication policy, and error codes for organisation provisioning (see [`docs/adr-enterprise-agent-template.md`](../docs/adr-enterprise-agent-template.md)).

## Layout

Canonical source lives under:

```
templates/conduro/enterprise/v3/
  manifest.json              # Bundle identity + shard paths + sha256 (computed by build)
  agents/agents.json         # Agent roster (adapter, routing, tier, MCP hints)
  teams/teams.json         # Teams + lead agent slugs
  gates/gate_kinds.json    # Human gate kinds + default_mode metadata
  communication/policy.json # Directed edges + quotas + intents / artifact kinds
  errors/registry.json      # Structured error codes + remediation hints
```

PDF / Notebook exports are human companions only; **JSON + DB state are authoritative**.

## Build pipeline

From the repo root:

```bash
npm run templates:build
```

This script:

1. Reads every shard listed in `manifest.json`
2. Validates each shard with Zod (`lib/templates/zod-schemas.ts`)
3. Computes **deterministic SHA-256** over canonical JSON (`lib/templates/canonical-json.ts`)
4. Writes updated hashes back into `manifest.json`
5. Emits `dist/<template_id>.<semver>.bundle.json` (e.g. `dist/conduro.enterprise.3.0.0.bundle.json`)

Commit updated `manifest.json` whenever shard content changes so hashes stay reproducible.

## Semver rules (`template_version`)

| Bump | When |
|------|------|
| **MAJOR** | Breaking schema changes, removed roles/edges, incompatible adapter/routing enums |
| **MINOR** | New agents, gate kinds, intents, or edges; additive policy |
| **PATCH** | Copy tweaks, remediation text, descriptions, non-breaking metadata |

Keep `registry_version` aligned with breaking/error-surface changes per ADR guidance.

## Seeding an organisation

Requires `DATABASE_URL` (see `.env.example`):

```bash
npm run templates:seed-org -- --org-id <business_uuid> [--bundle dist/conduro.enterprise.3.0.0.bundle.json]
```

The loader verifies shard hashes against `manifest.sha256`, validates the bundle schema, then **idempotently upserts** rows (agents by `(business_id, slug)`, teams by `(business_id, slug)`, edges by `(business_id, from_role, to_role)`, etc.).

## Adding a new agent role

1. Append an entry to `agents/agents.json` (`agent_slug`, `team_slug`, `tier`, `execution_adapter`, `model_routing`, …).
2. Wire communication edges in `communication/policy.json` if the role should participate in consult routing.
3. Bump `template_version` in `manifest.json` according to semver rules.
4. Run `npm run templates:build` and commit refreshed `manifest.json` + bundle output if you version bundles in CI.

## Adding a gate kind

1. Add `{ slug, label, description }` to `gates/gate_kinds.json`
2. Reference the slug from agents’ `required_gates_before_output` where applicable.
3. Bump semver + rebuild hashes (`npm run templates:build`).
4. Ship a Drizzle migration if platform enums/UI require first-class recognition beyond seeded rows.
