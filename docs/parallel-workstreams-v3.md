# Parallel Workstreams — Enterprise Template v3

**Formål:** Tre agenter (Workers) kan arbejde fuldstændig uafhængigt i **separate git worktrees**.
Ingen af de tre streams har runtime-afhængigheder af hinanden i MVP-fasen.
Integration sker ved merge — ikke undervejs.

---

## Dependency map (hvorfor de er uafhængige)

```
Stream A: Template infrastructure + DB schema
  ↓ producerer: migrations, seed-loader, hash-validator
  ↓ ingen afhængighed af B eller C

Stream B: RunPod lifecycle + queue orchestrator
  ↓ producerer: state machine worker, LiteLLM proxy config, wake/sleep logic
  ↓ ingen afhængighed af A eller C (bruger environment vars, ikke A's migrations)

Stream C: Communication graph API + UI canvas foundation
  ↓ producerer: edge CRUD API, policy enforcement middleware, basic canvas
  ↓ ingen afhængighed af B (bruger DB schema fra A — men A's migrations er simple
     enough at C kan stub dem med en minimal local schema for parallel dev)
```

**Integration point:** Alle tre streams merges ind i `main` i denne rækkefølge:

1. Stream A (schema + loader — fundament)
2. Stream C (graph API — bruger tabeller fra A)
3. Stream B (orchestrator — bruger org/agent rows fra A)

---

## Stream A — Template Infrastructure + DB Schema

**Branch:** `feat/template-infrastructure`
**Worktree:** `../ai-business-worktree-a`

### Mål

Versioneret template-bundle system med DB-migrationer, seed-loader og hash-validator.

### Opgaveliste

#### A1 — DB migrationer

- Tilføj `template_id`, `template_version`, `derived_from_template_id`, `derived_from_template_version` til `businesses`-tabellen (Drizzle migration)
- Tilføj `execution_adapter` (`hermes_agent_cli` | `claude_code_cli` | `cursor_agent_cli`), `model_routing`, `tier` til `agents`-tabellen
- Opret `gate_kinds`-tabel (slug, label, description, `default_mode`)
- Opret `communication_edges`-tabel (from_role, to_role, direction, allowed_intents[], allowed_artifacts[], requires_human_ack, quota_per_hour, quota_mode, org_id, template_version, derived_from_*)
- Kør `npm run db:generate` + `npm run db:migrate` — verificer clean run

#### A2 — Template build pipeline

- Opret `scripts/templates/build.ts`:
  - Læser alle shards fra `templates/conduro/enterprise/v3/`
  - Validerer mod Zod-skema
  - Producerer `dist/conduro.enterprise.3.0.0.bundle.json`
  - Beregner og skriver `sha256` per shard i `manifest.json`
- Opret `npm run templates:build` script i `package.json`
- Opret Zod-skema for `AgentShard`, `TeamShard`, `GateKindShard`, `CommunicationPolicyShard`, `ErrorRegistry`

#### A3 — Seed loader (Server Action / script)

- Opret `scripts/templates/seed-org.ts`:
  - Tager `org_id` + bundle path
  - Runtime hash-verificerer bundle mod manifest
  - Skriver teams, agents, gates, communication_edges til DB med `template_id` + `template_version` + lineage felter
  - Idempotent (kan køres igen uden duplikat-insert)
- Opret unit tests: hash mismatch afvises med `TEMPLATE_HASH_MISMATCH`, schema invalid afvises med `BUNDLE_SCHEMA_INVALID`

#### A4 — Error registry loader

- Opret `lib/templates/error-registry.ts`: loader der læser `errors/registry.json` + eksporterer typesikker `getError(code)` funktion
- Enhedstest: alle koder i registry returneres korrekt; ukendt kode kaster

#### A5 — README

- Opret `templates/README.md`: forklarer shard-struktur, build-pipeline, semver-regler og hvordan man tilføjer ny agent-rolle eller gate_kind

**Acceptance criteria (Green gate):**

- `npm run templates:build` kører uden fejl
- `npm run db:migrate` er clean
- Unit tests grønne
- `seed-org.ts` seeder en test-org korrekt og kan verificeres via `getDb()` query

---

## Stream B — RunPod Lifecycle + Queue Orchestrator

**Branch:** `feat/runpod-lifecycle`
**Worktree:** `../ai-business-worktree-b`

### Mål

State machine for RunPod wake/sleep, job queue med fair_share, LiteLLM proxy config og token/correlation metadata.

### Opgaveliste

#### B1 — RunPod state machine

- Opret `runner/runpod/state-machine.ts`:
  - States: `cold` → `warming` → `warm` → `draining` → `idle` → `cold`
  - Wake-trigger: job enqueued på cold server
  - Shutdown-condition: `queue_empty ∧ in_flight_empty ∧ elapsed_since_last_activity ≥ 7min`
  - Gem state i DB (ny tabel `runpod_instances`: state, last_activity_at, endpoint_url)
- Opret `runner/runpod/client.ts`: wrapper til RunPod API (start/stop/status) med secrets fra env (`RUNPOD_API_KEY`, `RUNPOD_ENDPOINT`)
- Unit tests: shutdown triggers korrekt (mock clock), for-tidlig shutdown blokeres

#### B2 — Job queue

- Opret `runner/queue/job-queue.ts`:
  - `enqueue(job)` — persisterer til DB tabel `agent_jobs` (org_id, agent_slug, adapter, payload, status, correlation_id, enqueued_at, started_at, completed_at)
  - `fair_share_next()` — henter næste job med fair-share selektion på tværs af org_id
  - `mark_inflight(job_id)` / `mark_done(job_id, result)` / `mark_failed(job_id, error)`
- DB migration: `agent_jobs`-tabel
- Unit tests: fair_share roterer korrekt mellem to orgs; ingen org stjæler al throughput

#### B3 — LiteLLM proxy config + correlation metadata

- Opret `runner/litellm/config-template.yaml`:
  - `model_list` med RunPod endpoint
  - `general_settings` med `LITELLM_MASTER_KEY` fra env
  - `headers_to_pass` inkl. `x-correlation-id`, `x-tenant-id`, `x-agent-id`, `x-job-id`
- Opret `runner/litellm/metadata.ts`: bygger standard metadata object til LiteLLM request headers
- Dokumenter Cursor-gap eksplicit i `runner/litellm/README.md`: «Cursor adapter uses Cursor-managed model; correlation_id is best-effort»

#### B4 — Orchestrator HTTP server (agent-orchestrator.js)

- Opret `runner/orchestrator/server.ts`:
  - `POST /agent/spawn` — validerer payload, enqueuer job, returnerer `{ job_id, status: "queued" }`
  - `GET /agent/:job_id` — returnerer job status + output
  - `GET /health` — returnerer `{ status, runpod_state, queue_depth }`
  - Spawner Claude Code / Hermes subprocesses med korrekte env vars (HOME, HERMES_HOME, ANTHROPIC_BASE_URL)
- Dockerfile opdatering: inkl. Hermes CLI install step (TODO-stub hvis Hermes install er uafklaret)

#### B5 — Quota warn logger

- Opret `runner/queue/quota-checker.ts`:
  - Checker `quota_per_hour` per edge-par ved job-dispatch (læser `communication_edges` fra DB)
  - `warn_only`: logger + returnerer warning i job metadata — blokerer ikke
- Unit test: quota warning trigges korrekt; `warn_only` blokerer ikke job

**Acceptance criteria (Green gate):**

- State machine tests grønne (mock RunPod API)
- Fair-share tests grønne
- `GET /health` returnerer korrekt state
- Correlation metadata propageres i LiteLLM request headers (integration test mod mock LiteLLM)

---

## Stream C — Communication Graph API + Canvas Foundation

**Branch:** `feat/communication-graph`
**Worktree:** `../ai-business-worktree-c`

### Mål

Server-side edge CRUD API, policy enforcement middleware (hard_block + structured errors), og første canvas/liste UI.

### Opgaveliste

#### C1 — Edge CRUD Server Actions

- Opret `app/actions/communication-edges.ts` (`"use server"`):
  - `createEdge(orgId, edge)` — validerer mod Zod, persisterer, returnerer ny edge
  - `updateEdge(orgId, edgeId, patch)` — `merge_smart`: patcher kun ikke-driftede felter
  - `deleteEdge(orgId, edgeId)`
  - `listEdges(orgId)` — returnerer alle edges for org med policy attributter
- Zod-skema for edge input (inkl. `direction`, `allowed_intents`, `allowed_artifacts`, `requires_human_ack`, `quota_per_hour`, `quota_mode`)
- Unit tests for `createEdge` og `updateEdge`

#### C2 — Policy enforcement middleware

- Opret `lib/communication/policy-enforcer.ts`:
  - `checkConsult({ from_role, to_role, intent, artifacts, org_id })` → `{ allowed: boolean, error?: PolicyError }`
  - `PolicyError` shape: `{ error_code, correlation_id, remediation_key, detail }`
  - Bruger `getError(code)` fra error-registry (kan stub registry i tests)
  - `hard_block`: returnerer fejl — kalder **aldrig** videre ved violation
  - Propagerer `correlation_id` i returværdi (til brug i LiteLLM metadata downstream)
- Unit tests:
  - Disallowed edge → `CONSULT_EDGE_DISALLOWED`
  - Wrong artifact → `ARTIFACT_KIND_NOT_ALLOWED`
  - Missing artifact ref → `MISSING_ARTIFACT_REF`
  - `requires_human_ack: true` → `HUMAN_ACK_REQUIRED`
  - Allowed edge → `{ allowed: true }`

#### C3 — Communication graph API routes

- Opret `app/api/communication/edges/route.ts` (GET + POST)
- Opret `app/api/communication/edges/[edgeId]/route.ts` (PATCH + DELETE)
- Opret `app/api/communication/check/route.ts` (POST — policy check endpoint til orchestrator)
- Alle routes returnerer strukturerede fejl fra error-registry inkl. `correlation_id`

#### C4 — Canvas/liste UI (V1 — form-baseret)

- Opret `app/dashboard/communication/page.tsx`:
  - Server Component der henter edges for aktiv org
  - Viser edges i liste (from_role → to_role, direction, intents, artifacts, quota, status)
- Opret `components/communication/edge-form.tsx` (Client Component):
  - Formular til opret/rediger edge
  - Felter: from_role (select fra org agents), to_role (select), direction, allowed_intents (multi-select managed enum), allowed_artifacts (multi-select managed enum), requires_human_ack, quota_per_hour
  - Submit kalder `createEdge`/`updateEdge` Server Actions
- Opret `components/communication/edge-list.tsx`:
  - Tabel med delete-knap og rediger-knap per edge
  - Violation badge hvis edge er `hard_block`-kandidat (ingen matching policy)

#### C5 — Seed fra bundle (C bruger A's seed-loader stub)

- Opret `lib/communication/seed-from-bundle.ts`:
  - Tager parsed `CommunicationPolicyShard` (fra A's Zod-type — kan importeres direkte)
  - Kalder `createEdge` for hver edge i bundle
  - Idempotent via upsert på (org_id, from_role, to_role)
- Integration test: seed `policy.json` → verificer edges i DB

**Acceptance criteria (Green gate):**

- Policy enforcer unit tests 100% grønne
- Edge CRUD fungerer end-to-end (Playwright smoke: opret edge → vises i liste → slet)
- `POST /api/communication/check` returnerer `CONSULT_EDGE_DISALLOWED` for ukendt edge
- Ingen `shadow state`: canvas viser præcis hvad DB indeholder

---

## Merge-rækkefølge

```
main
  ← Stream A (schema + loader)    ← ingen deps
  ← Stream B (orchestrator)       ← efter A (bruger agent_jobs schema)
  ← Stream C (graph API + UI)     ← efter A (bruger communication_edges schema)
```

Stream B og C kan begge merges parallelt **efter** A er merget.

## Git worktree setup (til Manager)

```bash
git worktree add ../ai-business-worktree-a -b feat/template-infrastructure
git worktree add ../ai-business-worktree-b -b feat/runpod-lifecycle
git worktree add ../ai-business-worktree-c -b feat/communication-graph
```

Hvert worktree kører `npm install` og `npm run db:migrate` uafhængigt.