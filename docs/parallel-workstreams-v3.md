# Parallel workstreams — Enterprise template v3

**Purpose:** Three workers can progress independently in **separate git worktrees**. None of the three streams has runtime dependencies on the others during the MVP phase. Integration happens at **merge time**, not mid-stream.

---

## Dependency map (why they are independent)

```text
Stream A: Template infrastructure + DB schema
  ↓ ships: migrations, seed loader, hash validator
  ↓ no dependency on B or C

Stream B: RunPod lifecycle + queue orchestrator
  ↓ ships: state machine worker, LiteLLM proxy config, wake/sleep logic
  ↓ no dependency on A or C for local work (environment variables only, not A's migrations)

Stream C: Communication graph API + canvas foundation
  ↓ ships: edge CRUD API, policy enforcement middleware, basic canvas
  ↓ no dependency on B (uses DB schema from A — A's migrations are small enough
     that C can stub them with a minimal local schema while developing in parallel)
```

**Integration:** Merge all three into `main` in this order:

1. Stream A (schema + loader — foundation)
2. Stream C (graph API — uses tables from A)
3. Stream B (orchestrator — uses org/agent rows seeded from A)

---

## Stream A — Template infrastructure + DB schema

**Branch:** `feat/template-infrastructure`  
**Worktree:** `../ai-business-worktree-a`

### Goal

Versioned template-bundle system with DB migrations, seed loader, and hash validator.

### Task list

#### A1 — DB migrations

- Add `template_id`, `template_version`, `derived_from_template_id`, `derived_from_template_version` to `businesses` (Drizzle migration).
- Add `execution_adapter` (`hermes_agent_cli` | `claude_code_cli` | `cursor_agent_cli`), `model_routing`, `tier` to `agents`.
- Create `gate_kinds` table (slug, label, description, `default_mode`).
- Create `communication_edges` table (from_role, to_role, direction, allowed_intents[], allowed_artifacts[], requires_human_ack, quota_per_hour, quota_mode, org_id, template_version, derived_from_*).
- Run `npm run db:generate` and `npm run db:migrate`; verify a clean run.

#### A2 — Template build pipeline

- Add `scripts/templates/build.ts`:
  - Read all shards under `templates/conduro/enterprise/v3/`.
  - Validate with Zod schemas.
  - Emit `dist/conduro.enterprise.3.0.0.bundle.json`.
  - Compute and write per-shard `sha256` into `manifest.json`.
- Add `npm run templates:build` in `package.json`.
- Add Zod schemas for agent, team, gate kind, communication policy, and error-registry shards.

#### A3 — Seed loader (Server Action / script)

- Add `scripts/templates/seed-org.ts`:
  - Args: `org_id` + bundle path.
  - Runtime hash verification of the bundle against `manifest`.
  - Write teams, agents, gates, and communication_edges with `template_id`, `template_version`, and lineage columns.
  - Idempotent (safe to re-run without duplicate inserts).
- Unit tests: hash mismatch → `TEMPLATE_HASH_MISMATCH`; invalid schema → `BUNDLE_SCHEMA_INVALID`.

#### A4 — Error registry loader

- Add `lib/templates/error-registry.ts`: load `errors/registry.json` and export a type-safe `getError(code)`.
- Unit tests: every registry code resolves; unknown code throws.

#### A5 — README

- Add `templates/README.md`: shard layout, build pipeline, semver rules, how to add an agent role or `gate_kind`.

**Acceptance criteria (green gate)**

- `npm run templates:build` succeeds.
- `npm run db:migrate` is clean.
- Unit tests pass.
- `seed-org.ts` seeds a test org and can be verified with a `getDb()` query.

---

## Stream B — RunPod lifecycle + queue orchestrator

**Branch:** `feat/runpod-lifecycle`  
**Worktree:** `../ai-business-worktree-b`

### Goal

RunPod wake/sleep state machine, job queue with `fair_share`, LiteLLM proxy config, and correlation metadata.

### Task list

#### B1 — RunPod state machine

- Add `runner/runpod/state-machine.ts`:
  - States: `cold` → `warming` → `warm` → `draining` → `idle` → `cold`.
  - Wake trigger: job enqueued while server is cold.
  - Shutdown: `queue_empty ∧ in_flight_empty ∧ elapsed_since_last_activity ≥ 7min`.
  - Persist state (new `runpod_instances` table: state, last_activity_at, endpoint_url).
- Add `runner/runpod/client.ts`: RunPod API wrapper (start/stop/status) using env secrets (`RUNPOD_API_KEY`, `RUNPOD_ENDPOINT`).
- Unit tests: shutdown fires correctly (mock clock); premature shutdown blocked.

#### B2 — Job queue

- Add `runner/queue/job-queue.ts`:
  - `enqueue(job)` — persist to `agent_jobs` (org_id, agent_slug, adapter, payload, status, correlation_id, enqueued_at, started_at, completed_at).
  - `fair_share_next()` — next job with fair-share selection across `org_id`.
  - `mark_inflight` / `mark_done` / `mark_failed`.
- DB migration: `agent_jobs` table.
- Unit tests: fair share rotates across two orgs; no org starves the other.

#### B3 — LiteLLM proxy config + correlation metadata

- Add `runner/litellm/config-template.yaml`:
  - `model_list` with RunPod endpoint.
  - `general_settings` with `LITELLM_MASTER_KEY` from env.
  - `headers_to_pass` including `x-correlation-id`, `x-tenant-id`, `x-agent-id`, `x-job-id`.
- Add `runner/litellm/metadata.ts`: build standard metadata for LiteLLM request headers.
- Document the Cursor gap in `runner/litellm/README.md`: «Cursor adapter uses Cursor-managed model; correlation_id is best-effort».

#### B4 — Orchestrator HTTP server

- Add `runner/orchestrator/server.ts`:
  - `POST /agent/spawn` — validate payload, enqueue job, return `{ job_id, status: "queued" }`.
  - `GET /agent/:job_id` — job status + output.
  - `GET /health` — `{ status, runpod_state, queue_depth }`.
  - Spawn Claude Code / Hermes subprocesses with correct env (`HOME`, `HERMES_HOME`, `ANTHROPIC_BASE_URL`).
- Dockerfile: include Hermes CLI install step (TODO stub if install path is still unclear).

#### B5 — Quota warn logger

- Add `runner/queue/quota-checker.ts`:
  - Check `quota_per_hour` per edge pair at dispatch (read `communication_edges`).
  - `warn_only`: log + attach warning to job metadata — do not block.
- Unit test: quota warning fires; `warn_only` does not block jobs.

**Acceptance criteria (green gate)**

- State machine tests pass (mock RunPod API).
- Fair-share tests pass.
- `GET /health` returns expected state.
- Correlation metadata flows into LiteLLM request headers (integration test with mock LiteLLM).

---

## Stream C — Communication graph API + canvas foundation

**Branch:** `feat/communication-graph`  
**Worktree:** `../ai-business-worktree-c`

### Goal

Server-side edge CRUD, policy enforcement middleware (`hard_block` + structured errors), and first canvas/list UI.

### Task list

#### C1 — Edge CRUD Server Actions

- Add `app/actions/communication-edges.ts` (`"use server"`):
  - `createEdge(orgId, edge)` — Zod validate, persist, return edge.
  - `updateEdge(orgId, edgeId, patch)` — `merge_smart`: only patch non-drifted fields.
  - `deleteEdge(orgId, edgeId)`.
  - `listEdges(orgId)` — all edges with policy fields.
- Zod schema for edge input (`direction`, `allowed_intents`, `allowed_artifacts`, `requires_human_ack`, `quota_per_hour`, `quota_mode`).
- Unit tests for `createEdge` and `updateEdge`.

#### C2 — Policy enforcement middleware

- Add `lib/communication/policy-enforcer.ts`:
  - `checkConsult({ from_role, to_role, intent, artifacts, org_id })` → `{ allowed: boolean, error?: PolicyError }`.
  - `PolicyError`: `{ error_code, correlation_id, remediation_key, detail }`.
  - Use `getError(code)` from the error registry (stub in tests).
  - `hard_block`: return error — **never** forward on violation.
  - Return `correlation_id` for LiteLLM metadata downstream.
- Unit tests:
  - Disallowed edge → `CONSULT_EDGE_DISALLOWED`.
  - Wrong artifact → `ARTIFACT_KIND_NOT_ALLOWED`.
  - Missing artifact ref → `MISSING_ARTIFACT_REF`.
  - `requires_human_ack: true` → `HUMAN_ACK_REQUIRED`.
  - Allowed edge → `{ allowed: true }`.

#### C3 — Communication graph API routes

- `app/api/communication/edges/route.ts` (GET + POST).
- `app/api/communication/edges/[edgeId]/route.ts` (PATCH + DELETE).
- `app/api/communication/check/route.ts` (POST — policy check for orchestrator).
- All routes return structured errors from the registry including `correlation_id`.

#### C4 — Canvas/list UI (v1 — forms)

- `app/dashboard/communication/page.tsx`:
  - Server Component loading edges for active org.
  - List: from_role → to_role, direction, intents, artifacts, quota, status.
- `components/communication/edge-form.tsx` (Client):
  - Create/edit edge: from_role, to_role, direction, intents, artifacts, requires_human_ack, quota_per_hour.
  - Submit calls `createEdge` / `updateEdge`.
- `components/communication/edge-list.tsx`:
  - Table with edit/delete; violation badge when policy would `hard_block`.

#### C5 — Seed from bundle (C consumes A's shard types)

- Add `lib/communication/seed-from-bundle.ts`:
  - Input: parsed `CommunicationPolicyShard` from A.
  - Call `createEdge` per edge (or equivalent).
  - Idempotent upsert on `(org_id, from_role, to_role)`.
- Integration test: seed `policy.json` and assert rows in DB.

**Acceptance criteria (green gate)**

- Policy enforcer unit tests all pass.
- Edge CRUD smoke (Playwright): create → listed → delete.
- `POST /api/communication/check` returns `CONSULT_EDGE_DISALLOWED` for unknown edge.
- No shadow state: canvas reflects DB exactly.

---

## Merge order

```text
main
  ← Stream A (schema + loader)        ← no deps
  ← Stream C (graph API + UI)          ← after A (uses communication_edges)
  ← Stream B (orchestrator)            ← after A (uses org/agent rows; job schema from B’s migration)
```

Streams **B** and **C** can be developed in parallel once **A** is on `main`. **Merge sequence** to `main` is still **A → C → B** as above (or rebase feature branches onto latest `main` in that order).

## Git worktree setup (for the manager)

```bash
git worktree add ../ai-business-worktree-a -b feat/template-infrastructure
git worktree add ../ai-business-worktree-b -b feat/runpod-lifecycle
git worktree add ../ai-business-worktree-c -b feat/communication-graph
```

Each worktree runs `npm install` and `npm run db:migrate` independently.
