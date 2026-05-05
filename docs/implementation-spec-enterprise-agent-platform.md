# Implementation Spec — Enterprise Agent Platform

**Status:** Ready for implementation  
**Date:** 2026-05-06  
**Scope:** Agent instructions, Communication Canvas, GitHub App, Template seeding, Routines, Task triggers  
**Based on:** Grill-Me session 2026-05-05/06 + ADR enterprise-agent-template.md

---

## 1. What exists today (baseline)

| Area | Status |
|------|--------|
| `agents` table — name, role, slug, tier, execution_adapter, model_routing | ✅ exists |
| `tasks` table — agentId, status (backlog/todo/in_progress/blocked/in_review/done), blockedReason, parentTaskId | ✅ exists |
| `agentDocuments` table — filename, content, slug per agent | ✅ exists |
| `orchestrationEvents` + `webhookDeliveries` tables | ✅ exists |
| `communication_edges` table + policy enforcer + hard_block | ✅ exists |
| `runner/orchestrator/server.ts` — `POST /agent/spawn` | ✅ exists |
| Template bundle `templates/conduro/enterprise/v3/` — agents, teams, gates, communication | ✅ exists |
| Dashboard: agents, teams, tasks, approvals, projects, webhooks, settings, grill-me | ✅ exists |
| Communication V1 — form/list-based edge management | ✅ exists |
| Agent settings form — icon picker + file upload (UI only, no DB column yet) | ⚠️ UI exists, DB missing |
| `avatar_url` / `icon_key` on agents table | ❌ missing |
| Agent instruction files in template bundle | ❌ missing |
| Template seeding UI + dashboard setup banner | ❌ missing |
| Communication Canvas V2 — org-chart + edge wizard | ❌ missing |
| GitHub App integration | ❌ missing |
| Routines — scheduled recurring agent actions | ❌ missing |
| Task → agent trigger dispatcher | ❌ missing |
| `routines` table | ❌ missing |

---

## 2. Architecture decisions (locked)

### 2.1 Agent instruction files
- **4 files per agent:** `AGENTS.md`, `SOUL.md`, `HEARTBEAT.md`, `TOOLS.md`
- Modelled after Paperclip's proven structure + IBM watsonx Orchestrate best practices
- Lives in `templates/conduro/enterprise/v3/agents/instructions/<slug>/`
- Seeded to `agentDocuments` table at org provisioning
- Editable by founder in UI post-provisioning

**IBM instruction principles applied:**
- Natural language, conversational directives
- Explicit «DO NOT» section (prevents scope creep + context noise)
- Tool usage rules: when and how to use each MCP/tool
- Error handling: «If blocked, set task status = blocked and report blocker via communication edge»
- Max ~10 tools/collaborators per agent for stable reasoning
- Bounded output format per role

### 2.2 GitHub identity
- **GitHub App** registered on platform level (not per-org PAT)
- Customers install Conduro GitHub App on their repository via OAuth flow
- Commits attributed as: `{agent.name} ({agent.role})` using existing DB columns
- Avatar: agent's `avatar_url` (uploaded) or `icon_key` (platform icon) — same field shown on GitHub
- Installation flow lives in `/dashboard/settings/integrations`
- Shortcut banner shown on dashboard/agents when GitHub not connected

### 2.3 Agent avatar
- `avatar_url` (text, nullable) + `icon_key` (text, nullable) added to `agents` table via migration
- UI already has icon picker + file upload — now backed by DB
- Template seeds a default `icon_key` per role (e.g. `robot`, `brain`, `code`, `shield`)
- `avatar_url` takes priority over `icon_key` if both set

### 2.4 Communication Canvas V2
- **Org-chart visualisation** showing agents as nodes in two streams (Product / Build)
- Edges rendered as directional lines between nodes
- **Edge wizard dialog:** clicking «connect» between two nodes opens a guided dialog:
  - Step 1: Direction (one-way / bidirectional)
  - Step 2: Allowed intents (multi-select from managed enum)
  - Step 3: Allowed artifact kinds (multi-select from managed enum)
  - Step 4: Quota + requires_human_ack toggle
  - Step 5: Confirm → saves to DB via existing Server Actions
- Matrix view available as secondary toggle
- DB-authoritative: canvas reads/writes via API, no shadow state

### 2.5 Dashboard setup banner + template seeding
- New org dashboard shows **all sections** (B) but with a **prominent setup banner** at top of main view
- Banner displays when `org.templateSeeded = false`
- Banner CTA: «Set up your AI team» → opens **preview modal**
- Preview modal shows:
  - Org-chart of all 10 agents in 2 streams
  - List of communication edges
  - Gate types that will be active
  - «Activate» button → seeds DB from bundle (teams, agents, agentDocuments, communication_edges, gate_kinds)
- Banner disappears when seeding complete (`org.templateSeeded = true`)

### 2.6 Heartbeat + Routines
- **Heartbeat:** `HEARTBEAT.md` per agent — checklist that runs at every activation (event-triggered or scheduled)
- **Routines:** separate entity — scheduled recurring actions per agent, configured in UI
  - Name, schedule (human-readable + cron expression), prompt/instruction, active toggle
  - Stored in new `routines` table (not in HEARTBEAT.md)
  - Example: «Engineering Manager — Daily standup — Every day at 08:00 — Check Linear assignments and send status update»
- **Triggers:** event-driven (task assigned, webhook) + scheduled (routines)

### 2.7 Task → agent trigger
- When `tasks.status` transitions to `todo` AND `tasks.agentId` is set → dispatcher fires
- Dispatcher logic:
  1. Check if agent has any task currently `in_progress`
  2. If yes → enqueue (job waits)
  3. If no → check for `blocked` tasks with no `blockedReason` that can be unblocked
  4. Dispatch to `POST /agent/spawn` with task context + agent documents
- Agent can self-update task status: `in_progress` → `in_review` → `done`
- If blocker discovered: sets `blocked` + `blockedReason` + sends consult via communication edge

---

## 3. Parallel workstreams

Three streams can run independently in separate git worktrees. Merge order: A → B and C in parallel.

---

### Stream A — Agent Instructions + Avatar + DB migrations

**Branch:** `feat/agent-instructions-avatar`  
**Worktree:** `../ai-business-worktree-a`

**Goal:** Write all 10 agent instruction files, add avatar fields to DB, update template bundle.

#### A1 — DB migration: avatar fields on agents
- Add `avatar_url text` (nullable) to `agents` table
- Add `icon_key text` (nullable) to `agents` table
- Run `npm run db:generate` + `npm run db:migrate`
- Update Drizzle schema + Zod types

#### A2 — Agent instruction files (4 files × 10 agents)
Create `templates/conduro/enterprise/v3/agents/instructions/<slug>/` for each agent:

**File structure per agent:**
```
AGENTS.md   — role definition, responsibilities, delegation rules, DO NOT list, error handling
SOUL.md     — persona, voice, tone, values, decision-making style
HEARTBEAT.md — activation checklist (identity check, task retrieval, priority logic, status update)
TOOLS.md    — available MCP tools, when and how to use each, tool error handling
```

**IBM principles applied to each file:**
- Natural language directives (no bullet-point overload)
- Explicit «MUST NOT» constraints before «MUST» responsibilities
- Tool usage: name tool + trigger condition + fallback if unavailable
- Bounded output format specified per role
- Max reasoning steps capped in HEARTBEAT.md (≤3 steps before acting)

**Agents to write instructions for:**
1. `product_owner` — Strategic, delegates to analyst/UX, signs off on requirements
2. `market_intelligence_analyst` — Researches, produces intelligence cards, never implements
3. `ux_designer` — UX flows + wireframes, consumes requirements, produces design briefs
4. `requirements_analyst` — Decomposes PRDs into tickets, never designs or codes
5. `engineering_manager` — Distributes work, resolves blockers, coordinates with PO
6. `software_engineer` — Implements from tickets, produces PRs, consults UX for components
7. `tech_lead` — Architecture decisions, reviews design, sets standards, never implements directly
8. `qa_engineer` — Test plans + regression suites, produces quality reports
9. `security_reviewer` — OWASP review, blocks release on critical findings, reports to EM
10. `devops_engineer` — CI/CD, infra configs, deploys, requires infra_change + release_deploy gates

#### A3 — Update agents.json
- Update `model_routing` from `litellm_runpod` → `cursor_cli` for all non-Cursor adapters
- Add `icon_key` default per agent (platform icon slug)
- Add `instructions_path` pointing to correct shard subfolder

#### A4 — Update seed-org.ts
- Seed `agentDocuments` (AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md) per agent from bundle
- Seed `avatar_url: null` + `icon_key` from template default
- Idempotent upsert on (agentId, slug)

#### A5 — Update agent settings form
- Wire existing «Choose icon» + file upload to `avatar_url` / `icon_key` DB columns
- Server Action: `updateAgentAvatar(agentId, { avatarUrl?, iconKey? })`
- Display avatar in agent roster and agent detail page

**Acceptance criteria:**
- All 10 × 4 = 40 instruction files exist and pass Zod schema validation
- `npm run templates:build` succeeds with updated bundle
- Migration clean on fresh DB
- Avatar upload → persisted → shown in roster

---

### Stream B — Template Seeding UI + Dashboard Setup Banner

**Branch:** `feat/template-seeding-ui`  
**Worktree:** `../ai-business-worktree-b`

**Goal:** Dashboard setup banner + preview modal + one-click template seeding.

#### B1 — DB migration: templateSeeded flag
- Add `template_seeded boolean default false` to `businesses` table
- Add `template_version text` (nullable) — records which version was seeded
- Migration + Drizzle schema update

#### B2 — Template seeding Server Action
- Extend `scripts/templates/seed-org.ts` into a callable Server Action:
  `seedEnterpriseTemplate(businessId: string): Promise<SeedResult>`
- Verifies bundle hash before seeding
- Transactional: seeds teams → agents → agentDocuments → communication_edges → gate_kinds
- Sets `template_seeded = true` + `template_version` on business row
- Returns `{ teams: n, agents: n, edges: n, gates: n }` summary

#### B3 — Setup banner component
- `components/dashboard/setup-banner.tsx` (Client Component):
  - Shown when `business.templateSeeded === false`
  - Prominent card at top of dashboard main view
  - Title: «Set up your AI team»
  - Description: «Deploy your enterprise agent team in one click — Product and Build streams ready to go»
  - CTA button: «Preview & Activate» → opens preview modal
  - Dismissible (sets local storage flag, not DB — banner returns on reload until seeded)

#### B4 — Template preview modal
- `components/dashboard/template-preview-modal.tsx`:
  - Shows org-chart preview (static SVG or simple node layout — no interactive canvas yet)
  - Lists: 2 teams, 10 agents with roles and tiers, communication edge count, gate types
  - «Activate» button → calls `seedEnterpriseTemplate` Server Action
  - Loading state during seed
  - Success state: «Your AI team is ready» + links to `/dashboard/agents` and `/dashboard/communication`
  - Error state with retry

#### B5 — GitHub shortcut banner
- `components/dashboard/github-banner.tsx`:
  - Shown on `/dashboard/agents` when GitHub App not installed for org
  - Compact info banner: «Connect GitHub so your agents can commit, open PRs and review code»
  - CTA: «Connect GitHub» → links to `/dashboard/settings/integrations`
  - Disappears when GitHub integration active

#### B6 — Routines table + basic UI
- DB migration: `routines` table:
  ```
  id uuid PK
  business_id uuid FK businesses
  agent_id uuid FK agents
  name text
  description text
  cron_expression text        -- e.g. "0 8 * * *"
  human_schedule text         -- e.g. "Every day at 08:00"
  prompt text                 -- instruction sent to agent on trigger
  is_active boolean default true
  last_run_at timestamptz
  next_run_at timestamptz
  created_at timestamptz
  updated_at timestamptz
  ```
- Basic CRUD Server Actions: `createRoutine`, `updateRoutine`, `deleteRoutine`, `listRoutines`
- Basic UI on agent detail page: «Routines» tab with list + add/edit form
- Scheduler integration (cron runner): stub — fires `POST /agent/spawn` at `next_run_at` (full scheduler post-MVP)

**Acceptance criteria:**
- New org sees setup banner immediately
- Preview modal shows correct template content
- Seeding completes in < 5 seconds, `template_seeded = true`
- Routines can be created/edited/deleted per agent
- GitHub banner shown when no GitHub integration

---

### Stream C — Communication Canvas V2 + GitHub App

**Branch:** `feat/canvas-v2-github-app`  
**Worktree:** `../ai-business-worktree-c`

**Goal:** Org-chart canvas with edge wizard dialog + GitHub App OAuth integration.

#### C1 — Communication Canvas V2 component
- `components/communication/canvas-v2.tsx` (Client Component):
  - Renders agents as nodes grouped in two stream columns (Product / Build)
  - Each node shows: avatar/icon, name, role, tier badge, status indicator
  - Edges rendered as SVG directional arrows between nodes
  - Click on edge → opens edge detail panel (existing edge-form.tsx adapted)
  - «Connect» mode: click agent A → click agent B → opens edge wizard dialog
  - Toggle: «Graph view» ↔ «List view» (existing edge-list.tsx)

#### C2 — Edge wizard dialog
- `components/communication/edge-wizard-dialog.tsx`:
  - Step 1: Direction — «One-way» / «Bidirectional» radio
  - Step 2: Allowed intents — multi-select from `allowed_intents` managed enum (fetched from registry)
  - Step 3: Allowed artifact kinds — multi-select from `allowed_artifact_kinds` managed enum
  - Step 4: Quota (number input, warn-only toggle) + `requires_human_ack` toggle
  - Step 5: Summary + «Save» → calls `createEdge` / `updateEdge` Server Actions
  - Inline validation with error messages from error registry
  - Cancel clears draft without persisting

#### C3 — Canvas page update
- Replace `/dashboard/communication/page.tsx` content with Canvas V2 as primary view
- Preserve list view as secondary tab
- Add «+ Connect agents» button to header (activates connect mode)
- Show edge count + violation count in header stats

#### C4 — GitHub App registration (platform setup)
- Register Conduro GitHub App in GitHub (docs + setup script):
  - Permissions: `contents: write`, `pull_requests: write`, `issues: write`, `metadata: read`
  - Webhook events: `push`, `pull_request`, `issues`
  - Callback URL: `{BASE_URL}/api/github/callback`
- Environment variables: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`
- Add to `.env.example` with descriptions

#### C5 — GitHub App OAuth + installation flow
- `app/api/github/callback/route.ts` — handles OAuth callback, exchanges code for installation token
- `app/api/github/install/route.ts` — initiates GitHub App installation flow
- DB: `github_installations` table:
  ```
  id uuid PK
  business_id uuid FK businesses
  installation_id text (GitHub installation ID)
  account_login text (GitHub org/user)
  account_type text ("User" | "Organization")
  repos jsonb (list of installed repos)
  access_token text (encrypted)
  token_expires_at timestamptz
  created_at timestamptz
  updated_at timestamptz
  ```
- Server-side token refresh logic (JWT → installation token, expires 1h)
- `lib/github/client.ts`: `getInstallationToken(businessId)` → decrypts + refreshes as needed

#### C6 — GitHub integration settings page
- `app/dashboard/settings/integrations/page.tsx`:
  - «GitHub» card: shows connection status, connected account, installed repos
  - «Connect GitHub» button → initiates install flow
  - «Disconnect» option with confirmation
  - List of repos the app is installed on with ability to add/remove

#### C7 — Agent git config helper
- `lib/github/agent-git-config.ts`:
  - `getAgentGitConfig(agent: Agent)` → returns `{ name: "{agent.name} ({agent.role})", email: "{agent.slug}@agents.conduro.ai" }`
  - Used by runner when spawning Cursor CLI jobs: sets `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` env vars on subprocess

**Acceptance criteria:**
- Canvas renders 10 agents in correct streams with existing edges
- Edge wizard creates valid edge end-to-end (create → policy check passes → shown in canvas)
- GitHub App OAuth flow completes (test with real GitHub account)
- `getAgentGitConfig` returns correct strings for all 10 agent slugs
- Settings page shows connected/disconnected state

---

## 4. Merge order

```
main
  ← Stream A (instructions + avatar + DB)    ← no deps, merge first
  ← Stream B (seeding UI + routines)         ← after A (uses agentDocuments + templateSeeded)
  ← Stream C (canvas V2 + GitHub App)        ← after A (uses avatar_url), independent of B
```

Stream B and C can be reviewed/developed in parallel but B should merge before C to avoid
`templateSeeded` migration conflict (both touch `businesses` table in different ways — coordinate
if running simultaneously).

---

## 5. Git worktree setup

```bash
git worktree add ../ai-business-worktree-a -b feat/agent-instructions-avatar
git worktree add ../ai-business-worktree-b -b feat/template-seeding-ui
git worktree add ../ai-business-worktree-c -b feat/canvas-v2-github-app
```

Each worktree: `npm install` + `npm run db:migrate` independently.

---

## 6. Out of scope for this round

- Cursor CLI headless server deployment on Hetzner (separate spec)
- Full routine scheduler (cron runner) — stub only in B6
- Recipe pack importer with merge_smart UI
- Communication Canvas drag-and-drop V3
- GitHub App webhook processing (push/PR events → task updates)
- i18n for remediation copy
- SOC2 compliance audit trail

---

## 7. Quality gates

| Gate | Requirement |
|------|-------------|
| **Green** | All migrations clean, `npm test` green, `npm run typecheck` clean, manual smoke on happy path |
| **Yellow** | Ship if: GitHub App not yet registered (stub flow OK for MVP demo), routine scheduler is stub |
| **Red** | Do not merge if: avatar stored in client-only state, GitHub token in browser, canvas shadow state |
