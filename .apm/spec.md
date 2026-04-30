---
phase: 2
date: 2026-04-30
sources:
  - docs/phase-2-architecture-spec.md
  - docs/phase-2-ui-ux-review.md
---

# Phase 2 Specification — AI Business Platform

This spec is derived from two source documents produced on 2026-04-30:

- **Architecture Spec** (`docs/phase-2-architecture-spec.md`): 17-question Grill-Me session covering Cursor SDK integration, database schema changes, heartbeat system, tasks, skills, webhooks, and UX flow. The canonical technical reference.
- **UI/UX Review** (`docs/phase-2-ui-ux-review.md`): Full design audit of all dashboard pages — P0 blockers, P1 flow issues, P2 visual quality gaps. The canonical UX reference.

## Phase 1 Baseline

Phase 1 delivered (all merged to `main`):

| Area | Key files |
|------|-----------|
| Schema | `db/schema.ts` — businesses, user_businesses, memory, agents, skills, agent_skills, teams, team_members, mcp_credentials, orchestration_events, webhook_deliveries, approvals, grill_me_sessions |
| Auth | `lib/auth/server.ts`, `middleware.ts`, Neon Auth |
| Grill-Me | `lib/grill-me/`, `app/api/grill-me/ui/route.ts`, `app/dashboard/grill-me/` |
| Agents/MCP/Teams | `lib/agents/`, `lib/skills/`, `lib/mcp/`, `lib/teams/`, `app/dashboard/agents/`, `app/dashboard/teams/` |
| Orchestration | `lib/webhooks/`, `lib/notion/`, `lib/approvals/`, `lib/orchestration/`, `app/dashboard/approvals/` |
| E2E | `tests/*.spec.ts`, `.github/workflows/e2e.yml` |

**Known gaps from Phase 1 review:**
- `agents.instructions` column exists and is used — Phase 2 migrates this to `agent_documents` table.
- `skills.markdown` column exists — Phase 2 migrates to `skill_files` table.
- `mcp_credentials.agent_id` FK — Phase 2 moves to `business_id` with agent opt-in junction.
- Business-selector rendered as inline links — Phase 2 replaces with `<select>` dropdown.
- No `user_settings` table, no `tasks`/`task_logs`, no `agent_documents`, no `agent_archetypes`, no `agent_mcp_access`, no `skill_files`.

## Phase 2 Scope

### Database Changes (11 tables)

| Table | Action | Key change |
|-------|--------|------------|
| `businesses` | Add columns | `description`, `github_repo_url`, `local_path` |
| `user_settings` | New | Cursor API key (AES-encrypted) per user |
| `agents` | Add + remove column | Add `archetype_id`, remove `instructions` |
| `agent_documents` | New | File tree: soul/tools/heartbeat per agent |
| `agent_archetypes` | New | Platform presets with soul/tools/heartbeat addenda |
| `tasks` | New | Business-level with hierarchy + status enum |
| `task_logs` | New | Activity feed per task (agent + human) |
| `skill_files` | New | File tree per skill (replaces `skills.markdown`) |
| `skills` | Remove column | Remove `markdown` |
| `mcp_credentials` | Change FK | From `agent_id` to `business_id` |
| `agent_mcp_access` | New | Junction: agent ↔ mcp opt-in |

### Functional Areas

1. **Cursor SDK Heartbeat** — `runHeartbeat(agentId)` assembles prompt and calls `@cursor/sdk`, logs tokens.
2. **Agent Configuration** — three-document model (soul/tools/heartbeat) with tab UI.
3. **Tasks System** — full CRUD, hierarchy, status flow, log feed, `@mention` soft trigger.
4. **Skills File Tree** — upload zip or GitHub-link, multi-file per skill.
5. **Incoming Webhooks** — HMAC-verified `POST /api/webhooks/[businessId]/receive` → heartbeat trigger.
6. **MCP Library** — per-business credentials, agent opt-in.
7. **Settings Page** — Cursor API key + business local path.
8. **Agent Archetypes** — two launch presets: `vertical-fullstack` + `harness-engineer`.
9. **Grill-Me Two-Path** — existing vs. new business onboarding paths.
10. **UI/UX Fixes** — P0 through P2 items from the UI/UX review.

## Key Architectural Decisions

- `@cursor/sdk` runs locally; `Agent.create()` uses `{ model: { id: "composer-2" }, local: { cwd: business.localPath } }`.
- `user_settings.cursor_api_key_encrypted` uses same AES-256-GCM pattern as `mcp_credentials`.
- Heartbeat prompt = `soul.md` + `heartbeat.md` + archetype addendum + runtime context (tasks, logs, approvals).
- `@mention` in task log → soft heartbeat trigger: writes `orchestration_events` row with `type: 'mention_trigger'`.
- Webhooks: HTTP 202, async processing, idempotency key in header, event-type filtering.
- Skills install: upload (zip/files) or GitHub-link (GitHub API, inherits local `gh` auth).

## Out of Scope for Phase 2

- Cloud execution target (Fase 3)
- GitHub PAT per business (Fase 3)
- NPX install from skills.sh (Fase 3)
- Cron-based heartbeat (Fase 5 / Sprint 5)
- Outgoing webhook notifications (handled by MCP servers)
- Webhook config table (`webhook_configs`) — endpoint uses business-level secret in settings
