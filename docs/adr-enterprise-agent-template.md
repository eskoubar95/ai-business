# ADR: Enterprise Agent Organisation Template

**Status:** Accepted  
**Date:** 2026-05-05  
**Authors:** Nicklas (Founder) + AI Architecture Session  
**Scope:** Conduro / AI Business Platform — default agent roster, communication governance, RunPod orchestration, recipe packs

---

## Context

When a new organisation is created on the platform, it must be provisioned with a
**default enterprise agent team** covering product discovery through engineering delivery.
The template must be usable out of the box, fully customisable, and
governable at enterprise scale (audit trails, human gates, tenant isolation).

The architecture is informed by:

- Conduro infrastructure brief (Hetzner + RunPod + LiteLLM + Hermes/Claude Code CLI)
- Vertically specialised agent design (smart-zone context reduction)
- IBM-style bounded instruction sets per agent
- The `template.enterprise.v3` PDF/Notebook authoring artefact

---

## Decisions

### 1. Template format and canonical source

**Decision:** JSON is the canonical machine-readable source of truth for the enterprise template.
The PDF/Notebook export is a human companion spec — not the authoritative runtime definition.

**Rationale:** JSON is deterministic, hashable, versionable, and directly seedable into the database.
Prose documents diverge from implementation; JSON stays in sync via migrations.

**Fields required on every provisioned organisation:**

- `template_id` — identifier of the master template used at signup
- `template_version` — semver of the bundle at the time of provisioning
- `derived_from_template_id` / `derived_from_template_version` — lineage for drift detection

---

### 2. Versioning strategy

**Decision:** Template bundles are versioned using **semver** (`MAJOR.MINOR.PATCH`).

**Rationale:** Semver provides deterministic upgrade paths, reproducible hashes, and clear
changelog semantics. Date-based versions are human-friendly but machine-awkward for
dependency resolution and audit trails.

**Repository layout:**

```
templates/
  conduro/
    enterprise/
      v3/
        manifest.json          ← bundle manifest + sha256 of shards
        agents/                ← one file per agent role
        teams/                 ← team definitions
        gates/                 ← gate_kind enum seeds
        communication/
          policy.yaml          ← canonical graph edges + quotas
          communication.md     ← auto-generated human summary (do not hand-edit)
        errors/
          registry.json        ← error_code + remediation_key registry
```

**Build step:** `npm run templates:build` validates all shards, bundles them into
a single artefact, and produces `manifest.json` with `sha256` per shard.

---

### 3. Org provisioning lifecycle

**Decision:** Master template is **never modified on a live org**. At signup:

1. Latest compatible semver bundle is fetched.
2. A **per-org copy** is written to the database (agents, teams, gates, communication_edges).
3. `template_id`, `template_version`, and `derived_from_`* are stored on the org row.

Existing orgs are **not auto-upgraded**. Upgrades are **manual opt-in** with
`merge_smart` semantics and diff preview.

**Future:** Official recipe packs deliver improvements as **A+B** (importable structured
packs + unstructured guidance). No silent mutations to production rosters.

---

### 4. Agent structure — two teams, explicit mapping

**Decision:** The default enterprise template defines **two teams**:


| Team               | Lead                      | Purpose                                                          |
| ------------------ | ------------------------- | ---------------------------------------------------------------- |
| `product_team`     | Product Owner agent       | Discovery → requirements → design intelligence → market review   |
| `engineering_team` | Engineering Manager agent | Architecture → implementation → review → DevOps → security gates |


**Founder-facing language:** «Product stream» and «Build stream» (avoids enterprise IT connotations of «Teams»).

**Every agent** in the JSON has explicit fields:

- `execution_adapter`: `hermes_agent_cli` | `claude_code_cli` | `cursor_agent_cli`
- `model_routing`: `litellm_runpod` | `cursor_managed` | `cursor_allowlist`
- `tier`: integer (1 = lead, 2 = senior specialist, 3 = specialist)
- `team_id`: foreign key to team

No role-name heuristics. Adapter and model routing are explicit and auditable.

---

### 5. Model routing and adapters

**Decision:**

- **Hermes Agent CLI** and **Claude Code CLI** route exclusively through **LiteLLM → RunPod** (Qwen 3.6 27B or configured model).
- **Cursor CLI** agents use Cursor-managed model selection within a **tenant allowlist** (locked in MVP; allowlist-choice post-MVP).
- **LiteLLM is the mandatory chokepoint** for GPU-track calls. Cursor is documented as a best-effort gap until a supported instrumentation API is available.
- All LiteLLM calls include standardised metadata: `tenant_id`, `business_id`, `agent_id`, `job_id`, `template_version`.

---

### 6. RunPod lifecycle (cost control)

**Decision:** RunPod server starts and stops dynamically. Platform orchestrator controls wake/stop — no direct tenant access to RunPod credentials.

**Shutdown condition (conservative):**

```
shutdown_ready = queue_empty
              ∧ in_flight_empty
              ∧ gpu_idle_signals_ok
              ∧ elapsed_since_last_activity ≥ 7 minutes
```

**Queue strategy:** `queue + auto_wake`. Jobs enqueue on cold server; platform triggers wake. UI shows `cold / warming / running` status. No prewarm in MVP.

**Fairness:** `fair_share` per tenant (no noisy-neighbour monopoly). Global caps on parallel jobs per tenant. `tiered` priority only after billing/SLA layer exists.

---

### 7. Human-in-the-loop gates

**Decision:** Critical workflow checkpoints are **persisted `approval` events in the database** that can block/resume webhook flows. Prompt-only reminders are insufficient for compliance-bearing gates.

**Initial gate_kind enum (grows via migrations):**

```
security_review
architecture_review
code_review
release_deploy
infra_change
secrets_access
ux_design_approval
product_sign_off
```

---

### 8. Communication graph (peer-to-peer between agents)

**Decision:** Cross-agent communication is governed by an **explicit, DB-persisted directed graph** (edges between agent roles with policy attributes). Canvas UI reads/writes via API only — DB is authoritative, no shadow state.

**Edge attributes:**

```
from_role        string
to_role          string
direction        "one_way" | "bidirectional"
allowed_intents  string[]   ← managed enum, grows via releases
allowed_artifacts artifact_kind[]  ← managed enum
requires_human_ack  boolean (default: false)
quota_per_hour   integer | null
quota_mode       "warn_only" | "enforce"  ← initially "warn_only"
```

**Violation policy:** `hard_block` — disallowed consult attempts are rejected with a
structured error response. No silent pass-through.

**Error response shape:**

```json
{
  "error_code": "CONSULT_EDGE_DISALLOWED",
  "correlation_id": "...",
  "remediation_key": "ACTIVATE_APPROVED_EDGE",
  "detail": "Human-readable fallback (English first)"
}
```

`correlation_id` is propagated to LiteLLM metadata tags on downstream calls for full
trace join across DB + inference logs + agent eval.

**Seeding:** The official `v3` bundle includes default communication graph shards
(`communication/policy.yaml`). At org provisioning, the graph is seeded 1:1 from
the bundle (deterministic, hash-verified). Customers customise via canvas/forms
post-provisioning.

**Recipe pack graph updates:** `merge_smart` — additive/safe merges; drifted
(customised) fields are preserved, with diff preview before apply.

---

### 9. Recipe packs and catalog

**Decision:**

- Official recipe packs ship from **platform catalog only** in MVP (no tenant-uploaded JSON).
- Every imported pack is **runtime hash-verified** against `manifest.json` before apply.
- Pack imports use `merge_smart` semantics on agents, teams, gates, and communication shards.
- Packs are versioned with semver; registry of `error_code`/`remediation` keys is co-versioned.

---

### 10. Error and remediation registry

**Decision:** All structured error codes and remediation hint keys live in a **central versioned registry** (`errors/registry.json`, co-versioned with template semver). No free-floating strings in application code.

**Initial error codes:**

```
CONSULT_EDGE_DISALLOWED
ARTIFACT_KIND_NOT_ALLOWED
MISSING_ARTIFACT_REF
HUMAN_ACK_REQUIRED
QUOTA_EXCEEDED
EDGE_NOT_FOUND
INTENT_NOT_ALLOWED
TEMPLATE_HASH_MISMATCH
BUNDLE_SCHEMA_INVALID
```

**Remediation keys (mapped per error):**

```
ACTIVATE_APPROVED_EDGE
ADD_ARTIFACT_REF
PICK_ALLOWED_INTENT
COMPLETE_HUMAN_ACK
WAIT_QUOTA_RESET
CONTACT_ADMIN
```

**Localisation:** English first. i18n extension via registry without schema changes.

---

## Consequences

- Schema requires `template_id`, `template_version`, `derived_from_`* on the `businesses` (or orgs) table.
- `agents` table requires `execution_adapter`, `model_routing`, `tier`, `team_id`.
- New tables: `communication_edges`, `communication_policies`, `gate_kinds` (enum seed).
- New infra module: `templates/conduro/enterprise/v3/` with build/validate/bundle pipeline.
- LiteLLM proxy configuration must accept and forward `x-correlation-id` + custom metadata tags.
- RunPod lifecycle requires a state-machine worker (queue, wake, drain, shutdown).

---

## Not decided here (out of scope / deferred)

- Kubernetes-style dynamic tenant spawning (post-MVP, after static 2-tenant MVP validates).
- Cursor model allowlist UI (post-MVP, after token budget and RBAC are stable).
- Tenant-uploaded recipe packs (post-MVP, requires schema validation + signing pipeline).
- Graph canvas V2 (interactive drag-and-drop; V1 is table/form-based).
- `prewarm` / peak scheduling for RunPod (post-MVP, opt-in tuning for paid tiers).
- i18n for remediation copy (post-English-MVP).
- SOC2 / formal compliance audit trail (follow-up after first enterprise customer).

