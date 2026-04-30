---

## title: AI Business Platform

modified: Spec creation by the Planner.

# APM Spec

## Overview

AI Business Platform is a browser-based Next.js 15 cockpit application that orchestrates AI-driven businesses: humans define, configure, and approve; Cursor agents (via `@cursor/sdk`) execute autonomously. The platform solves the "manual prompting all day" problem by providing structured onboarding (Grill-Me), a configurable agent roster with persistent memory and skillsets, team hierarchy with org chart, webhook-driven orchestration, a human approval dashboard, and bidirectional Notion integration. Success is defined by a working onboarding vertical slice (login → create business → Grill-Me chat → saved soul file) and a platform that can run MercFlow — a real shopping business with an "AI kodefabrik" agent and a product team — without any hardcoded logic.

## Workspace

- **Repository:** `c:\Users\Nicklas\Github\ai-business` — single repo, `main` branch, one initial commit (Next.js 15 + Drizzle + Neon skeleton)
- **Working target:** this repository — all Workers write here
- **Authoritative product brief:** `docs/ai-business-platform-spec.md`
- **Existing application code:** `app/layout.tsx`, `app/page.tsx` (skeleton only), `db/schema.ts` (businesses table only), `db/index.ts` (Neon HTTP + Drizzle factory), one migration in `drizzle/`
- **Existing AGENTS.md:** present at root with Worker dispatch section — the APM_RULES block is appended during Rules creation; existing content is preserved unchanged
- **No API routes, no UI library, no auth installed yet**

---

> **Notes:**
>
> - The repo is a clean skeleton — all application layers are greenfield. Workers should expect to install several new dependencies (auth, UI, SDK) before implementing features.
> - `DATABASE_URL` is documented in `.env.example`; Workers must add `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `ENCRYPTION_KEY`, and Notion API token to `.env.example` as they implement the relevant features.
> - Single `main` branch currently; the Manager should establish feature-branch conventions at the start of the Implementation Phase.
> - MercFlow is the acceptance-test business — the Manager should seed it as a `businesses` row and use it to validate end-to-end flows.

## Authentication Architecture

**Decision:** Neon Auth (`@neondatabase/auth`) with email/password for MVP.

Auth state lives directly in the Neon database (branching includes auth state). Pre-built UI components (`AuthView`, `AccountView`, `UserButton`, `SignedIn`/`SignedOut`) reduce custom UI work. Native Next.js App Router integration via `createNeonAuth()`, `auth.handler()`, and middleware.

**Multi-tenancy model:** A `user_businesses` join table links `auth_user.id` to `businesses.id`. One user can own or administrate multiple businesses. All platform data is scoped through `business_id`. This structure allows future SaaS migration without redesigning the auth layer.

**Environment variables required:**

- `NEON_AUTH_BASE_URL` — from Neon Console → Project → Branch → Auth → Configuration
- `NEON_AUTH_COOKIE_SECRET` — minimum 32 characters (`openssl rand -base64 32`)

**Key implementation references:** `lib/auth/server.ts` (server instance), `lib/auth/client.ts` (client instance), `app/api/auth/[...path]/route.ts` (handler), `middleware.ts` (route protection), `app/auth/[path]/page.tsx` (AuthView), `app/account/[path]/page.tsx` (AccountView).

## Execution Engine

**Decision:** `@cursor/sdk` called directly from Next.js Server Actions and API Routes — not a CLI subprocess.

```typescript
const run = await Agent.create({ model: "composer-2", runtime: { type: "local", cwd: process.cwd() } });
await run.send(promptWithContext);
for await (const event of run.stream()) { /* stream to browser via SSE */ }
```

**Local runtime (MVP):** `cwd` points to the workspace. **Cloud runtime (post-MVP):** Coolify/Hetzner VM — same SDK, different runtime config.

This gives programmatic lifecycle control (status, cancellation, archiving), native SSE streaming, and structured error handling — not available with shell subprocess.

**Context injection pattern:** Before each `agent.send()`, the platform assembles the prompt by combining: task instructions, relevant memory segments (retrieved, not dumped), agent instructions markdown, attached skill documents, and MCP credential metadata. The agent never reads the DB directly — context is assembled server-side and injected.

## Grill-Me Onboarding Architecture

**Decision:** Server-driven, turn-based chat via Cursor SDK with SSE streaming to browser.

**Flow:**

1. User submits an answer in the browser chat UI
2. Server Action stores the turn in `grill_me_sessions` table (conversation history)
3. Server Action calls `Agent.create()` + `agent.send(fullConversationHistory + businessContext)`
4. `run.stream()` SSE streamed to browser — next question appears incrementally
5. When the Cursor agent signals completion, platform extracts the soul file markdown
6. Soul file stored as a `memory` row (`scope: 'business'`) linked to the new `businesses` row

**UX constraint:** One question at a time. The first user prompt may be long (describing their business broadly); the agent then asks focused single questions to build the soul file systematically.

**Soul file format:** Markdown document capturing business identity, mission, target market, product/service description, team structure vision, technical environment, and operational principles. Stored verbatim in the `memory` table — not structured JSON.

## Persistent Memory Architecture

**Decision:** Two-tier memory (business + agent level) in a single `memory` table, with retrieval and filtering before injection.


| Scope      | `business_id` | `agent_id` | Content                                               |
| ---------- | ------------- | ---------- | ----------------------------------------------------- |
| `business` | required      | null       | Soul file, accumulated business knowledge             |
| `agent`    | required      | required   | Learned patterns, domain expertise, past run outcomes |


**Retrieval model:** Platform selects relevant memory segments based on task type and agent domain before assembling the agent prompt — it does not inject all memory. Filtering logic starts simple (most-recent + task-type tag match) and is designed to be replaced with semantic retrieval post-MVP.

**Fresh session logic:** Platform tracks approximate token usage per run. When accumulated context approaches a threshold, a new clean agent session is started with a compressed memory summary injected instead of the full history. The threshold and compression strategy are Worker-configurable parameters stored in the `businesses` config.

**Memory versioning:** `memory` rows carry `updated_at` (UTC timestamptz) and an optional `version` integer for optimistic concurrency on updates.

## Agent Model

**Decision:** Agents have three definition layers: instructions, skills, and org hierarchy.

### Instructions

`agents.instructions` — markdown text edited in a UI markdown editor. Defines the agent's role, personality, constraints, and operating principles. Injected into every agent run as the system-level context.

### Skillsets

`agent_skills` join table links agents to `skills` rows. A `skill` is a named markdown document (similar to Cursor's SKILL.md system and Paperclip's document model). Skills are reusable across agents. At run time, the platform injects the agent's attached skills after the instructions.

### Org Hierarchy

`agents.reports_to_agent_id` — self-referential FK (`agents.id`, nullable). The agent with `reports_to_agent_id = null` in a team is the lead (root of the org chart). The team's `lead_agent_id` must match the root of the reporting tree.

**Visual org chart:** Dashboard renders a tree diagram (per team) showing the reporting hierarchy. Built with a React tree/graph component (e.g., shadcn-compatible). The UI guides team construction: "who is the lead?" establishes the root; subsequent agents are placed in the tree via "reports to" selection, constrained to agents already in the team.

### Agent Status

Derived field: `idle` | `working` | `awaiting_approval` — sourced consistently from the `orchestration` events table, not a separate column.

## MCP Credential Management

**Decision:** Encrypted in Postgres (AES-256-GCM), managed entirely from the dashboard UI.

**Schema:** `mcp_credentials` table — `id`, `agent_id`, `mcp_name` (e.g. `"github"`, `"notion"`, `"context7"`), `encrypted_payload` (jsonb), `iv` (bytea), `created_at`.

**Encryption:** Server-side only. `ENCRYPTION_KEY` env var (32-byte key). Encrypt on write, decrypt on read in Server Actions. Workers must never expose decrypted credentials to client components.

**MVP MCPs:** GitHub (repository attachment per agent), Notion (bidirectional sync), Context7 (documentation lookup). Additional MCPs are addable via the dashboard without code changes.

**Dashboard UX:** Users install an MCP (select from a list), enter credentials in a form, save. The form fields are MCP-specific (GitHub: personal access token + repo URL; Notion: integration token; Context7: API key). Saved credentials appear as installed MCPs on the agent card with edit/remove actions.

## UI Framework

**Decision:** Tailwind v4 + shadcn/ui with preset `b3YQiewWyG`.

Initialize shadcn with: `npx shadcn@latest init --preset b3YQiewWyG`

Neon Auth UI components integrate with Tailwind v4 using: `@import "@neondatabase/auth/ui/tailwind"` in the global CSS (not `ui/css` — never both).

A markdown editor component is required for agent instructions and skill editing. Use a shadcn-compatible markdown editor (e.g., `@uiw/react-md-editor` or `novel`) — Worker selects the best available option that respects Tailwind v4 theming.

## Notion Integration

**Decision:** Bidirectional server-side Notion API integration built on the platform's webhook engine.

**Read (platform ← Notion):** Sync Tasks, Projects, Milestones, Change Log, Sprint databases into platform orchestration context. Agents read Notion data as part of their injected context.

**Write (platform → Notion):** Status updates, sub-task creation, comments, done-marking. Platform writes back on agent run completion or approval events.

**Agent-mention protocol:** In Notion comments, `!agentname` signals intent to communicate with a specific agent. Platform polls or receives Notion webhooks, parses comments for `!agentname`, and routes the message to the relevant agent's next run context.

**Notion API credentials:** Stored as an MCP credential (`mcp_name: "notion"`) per business — not a global platform secret. Each business has its own Notion integration token.

## Webhook Orchestration Engine

**Decision:** Platform's own webhook engine — not relying solely on external webhook providers.

`**webhook_deliveries` table:** `id`, `business_id`, `type` (e.g. `"agent_run"`, `"notion_sync"`, `"approval_gate"`), `payload` (jsonb), `status` (`pending` | `delivered` | `failed`), `idempotency_key`, `attempts`, `last_error`, `created_at`.

**Idempotency:** Every delivery carries an `idempotency_key`. Duplicate deliveries are detected and no-op'd.

**Signature verification:** Outgoing webhooks are HMAC-SHA256 signed. Incoming webhooks (from Notion or external) are verified before processing.

**Trigger sources (MVP):** Manual (user action in dashboard), Notion comment parse, approval events, agent run completion.

## Database Schema Decisions

**All tables use UUID primary keys and UTC `timestamptz` for all timestamps.**

Core tables required beyond the existing `businesses` table:


| Table                | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `user_businesses`    | Many-to-many: auth users ↔ businesses                                    |
| `memory`             | Business + agent level markdown memory                                   |
| `grill_me_sessions`  | Grill-Me conversation turns (business_id, role, content, seq)            |
| `agents`             | Agent roster: name, role, instructions, reports_to_agent_id, business_id |
| `skills`             | Reusable skill documents (name, markdown content, business_id)           |
| `agent_skills`       | Join: agents ↔ skills                                                    |
| `teams`              | Team with lead_agent_id, business_id                                     |
| `team_members`       | Join: teams ↔ agents, sort order                                         |
| `mcp_credentials`    | Encrypted MCP credentials per agent                                      |
| `orchestration`      | Events/triggers with type, payload, status, correlation                  |
| `webhook_deliveries` | Audit + retry: idempotency, attempts, errors                             |
| `approvals`          | Human gate: artifact_ref, status, comment, timestamps                    |


**Migration rule:** All schema changes via `drizzle-kit generate` + `drizzle-kit migrate`. Never `db:push` as primary workflow.

## Deployment Architecture

**Target:** Coolify on Hetzner VM (Docker/containers, Node.js runtime).

**Dockerfile:** Multi-stage build (builder + runner). Node.js base image. `.env` injected at runtime by Coolify — not baked into image.

**Runtime:** Node.js (not Edge). Neon HTTP driver (`@neondatabase/serverless`) works identically in Node.js and serverless — no driver change needed for deployment.

**Local development:** `npm run dev` (Turbopack), `.env.local` for secrets.

## Testing Strategy

**Unit + Integration:** Vitest — covers Server Actions, utility functions, memory retrieval logic, encryption/decryption, webhook signature verification.

**E2E:** Playwright — covers the critical user flows: auth (sign up, sign in, sign out), Grill-Me onboarding (full conversation → soul file saved), agent creation, MCP credential management.

**Agent-runnable:** Test commands (`npm test`, `npm run test:e2e`) must be executable autonomously by Workers to validate their own deliverables.