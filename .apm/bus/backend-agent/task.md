---
stage: 3
task: 1
agent: backend-agent
log_path: ".apm/memory/stage-03/task-03-01.log.md"
has_dependencies: true
---

# Agents, skills, MCP credentials, teams, memory retrieval

## Task Reference

Implement the full backend layer for agent roster CRUD, skills, encrypted MCP credentials per agent, teams and membership, and memory retrieval plus `assembleAgentContext` for Cursor prompt injection.

## Context from Dependencies

This Task builds on **Grill-Me / foundation** work already on `main`:

- **Database:** Open `db/schema.ts` for exact table and enum names — including `agents`, `skills`, `agent_skills`, `teams`, `team_members`, `mcp_credentials` (`encryptedPayload` jsonb, **`iv` as base64 text**), `memory` (`memory_scope` `business` | `agent`), `user_businesses`, `businesses`. The orchestration table is named **`orchestration_events`** in schema.
- **Patterns:** Use `getDb()` from `db/index.ts`, `assertUserBusinessAccess` / membership checks in `lib/grill-me/access.ts` as reference for **authorizing business-scoped Server Actions** — extend or mirror for all mutations (only members of a business may manage its agents/skills/teams).
- **Server Actions:** Each `lib/*/actions.ts` file must start with **`"use server"`** as first line. Never return decrypted MCP secrets to the client.

## Objective

Deliver `lib/agents/actions.ts`, `lib/skills/actions.ts`, `lib/mcp/actions.ts`, `lib/teams/actions.ts`, `lib/memory/retrieval.ts`, **`lib/mcp/config.ts`** (static MCP type → form field metadata for the frontend), Vitest tests, and READMEs per module.

## Detailed Instructions

1. **`lib/agents/actions.ts`:** `createAgent`, `updateAgent`, `deleteAgent`, `getAgentsByBusiness` (or equivalent list for current business). Fields must include **instructions** (markdown text) and optional **`reports_to_agent_id`**. Before setting `reports_to_agent_id`, verify the target agent row exists, belongs to the **same `businessId`**, and is not creating a cycle if you add extra guards. Validate non-empty name where the schema requires it.

2. **`lib/skills/actions.ts`:** `createSkill`, `updateSkill`, `deleteSkill`, `attachSkillToAgent`, `detachSkillFromAgent`, `getSkillsByAgent` — all scoped to the same business as the agent/skill rows.

3. **`lib/mcp/actions.ts`:**  
   - **`encryptCredential`** / **`decryptCredential`** using **AES-256-GCM** in Node (`crypto`).  
   - **`ENCRYPTION_KEY`:** interpret as **32-byte key from hex** — `Buffer.from(process.env.ENCRYPTION_KEY!, "hex")`; document in `.env.example`. **Fail fast** with a clear error if missing or not 64 hex chars.  
   - Store **IV/nonce** as **base64** in `mcp_credentials.iv`; store **ciphertext + auth tag** inside **`encryptedPayload` jsonb** in a shape you document (e.g. `{ ciphertext, tag }` as base64 strings).  
   - **`saveMcpCredential(agentId, mcpName, payloadObject)`** — encrypt, upsert or insert per your uniqueness rule (`agentId` + `mcpName` unique).  
   - **`getMcpCredentialsMeta(agentId)`** — returns **id, mcpName, createdAt** only (no secrets).  
   - **`deleteMcpCredential(id)`** — authorized delete.  
   - **`getMcpCredentialDecrypted(id)`** — **server-only** helper for downstream orchestration (e.g. Notion); never import from client components.

4. **`lib/mcp/config.ts`:** Export a **static config** describing MVP MCP types **`github`**, **`notion`**, **`context7`** with display labels and **field definitions** (name + type) the frontend can render — no secrets.

5. **`lib/teams/actions.ts`:** `createTeam`, `addTeamMember`, `removeTeamMember`, `setTeamLead`, `getTeamWithMembers`. **`lead_agent_id`** must reference an agent who is (or will be) a **member** of the team — enforce on set/create.

6. **`lib/memory/retrieval.ts`:**  
   - **`retrieveMemory(businessId, agentId?, limit?)`** — query `memory`, filter by `businessId`, optionally **`agentId`** (and scope as appropriate: business-wide rows may use `scope = 'business'` and null `agentId`; agent rows `scope = 'agent'` with matching `agentId`). Order by **`updated_at` descending**, **default limit 5**, return **single concatenated markdown string** (e.g. blocks separated by double newlines).  
   - **`assembleAgentContext(agentId, taskType)`** — load agent **instructions**, load **attached skills** markdown, call **`retrieveMemory`** for that agent’s business (and agent when relevant); concatenate into one **prompt prefix** string. `taskType` may influence filtering later — for MVP you may ignore it but must accept the parameter.

7. **Tests:**  
   - `lib/mcp/__tests__/encryption.test.ts` — round-trip JSON payload.  
   - `lib/memory/__tests__/retrieval.test.ts` — mock `getDb` or use minimal fixtures; assert ordering/recency.  
   - At least one test (mocked DB or integration-style) proving **agent** create + **`reports_to_agent_id`** validation path.

8. **READMEs:** `lib/agents/README.md`, `lib/skills/README.md`, `lib/mcp/README.md`, `lib/teams/README.md`, `lib/memory/README.md` — purpose, main exports, encryption notes, env vars.

## Workspace

- Branch **`agent-roster-backend`** (create from latest `main` if needed). All implementation commits on this branch.

## Expected Output

Listed modules, `lib/mcp/config.ts`, tests, READMEs; **`npm test`** and **`npm run build`** pass.

## Validation Criteria

- Vitest green; encryption round-trip; retrieval test passes; agent/team logic covered as above.  
- No decrypted MCP data in any type intended for client consumption.

## Instruction Accuracy

If hex key vs `.env.example` wording conflicts, align implementation with **64 hex characters** for 32 bytes and update `.env.example` comment in the same change.

## Task Logging

Write **`log_path`** per `.cursor/apm-guides/task-logging.md`.

## Task Report

After logging, clear incoming Task Bus; write **`.apm/bus/backend-agent/report.md`**; user runs **`/apm-5-check-reports backend-agent`** in Manager chat.
