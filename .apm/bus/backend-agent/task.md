# Task 1.1 — Schema Migrations + Data Migration

**Phase:** 2  
**Stage:** 1  
**Worker:** Backend Agent  
**Branch:** `phase2/stage1-backend`  
**Task Log:** `.apm/memory/stage-01/task-01-01.log.md`  
**Report:** `.apm/bus/backend-agent/report.md`

---

## Context

You are a Backend Agent Worker in an APM (Agentic Project Management) session for the **AI Business Platform** — a Next.js 15 orchestration cockpit for AI-driven businesses.

**Phase 1 is complete and merged to `main`.** The existing codebase has:
- `db/schema.ts` with tables: `businesses`, `user_businesses`, `memory`, `agents` (with `instructions` column), `grill_me_sessions`, `skills` (with `markdown` column), `agent_skills`, `teams`, `team_members`, `mcp_credentials` (with `agent_id` FK), `orchestration_events`, `webhook_deliveries`, `approvals`
- Drizzle ORM + `@neondatabase/serverless`
- Migrations in `drizzle/` directory
- `lib/mcp/actions.ts` with `encryptCredential`/`decryptCredential` using AES-256-GCM

**Your task** is to implement all Phase 2 database schema changes via Drizzle migrations and perform data migrations to populate the new structures from existing data.

---

## Objective

Apply all 11 schema changes for Phase 2 with zero data loss. Safely migrate:
1. `agents.instructions` → `agent_documents` (slug=`soul`)
2. `skills.markdown` → `skill_files` (path=`SKILL.md`)  
3. `mcp_credentials.agent_id` → `mcp_credentials.business_id` + `agent_mcp_access` junction

---

## Schema Changes Required

Read `docs/phase-2-architecture-spec.md` §2 for the authoritative SQL. Summary:

### New/Modified Tables

1. **`businesses`** — add nullable columns: `description text`, `github_repo_url text`, `local_path text`

2. **`user_settings`** (new):
   ```
   id uuid PK DEFAULT gen_random_uuid()
   user_id text NOT NULL UNIQUE
   cursor_api_key_encrypted jsonb
   cursor_api_key_iv text
   created_at timestamptz NOT NULL DEFAULT now()
   updated_at timestamptz NOT NULL DEFAULT now()
   ```

3. **`agent_documents`** (new):
   ```
   id uuid PK DEFAULT gen_random_uuid()
   agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE
   slug text NOT NULL   -- 'soul', 'tools', 'heartbeat', or custom
   filename text NOT NULL  -- 'soul.md', 'tools.md', 'heartbeat.md'
   content text NOT NULL DEFAULT ''
   created_at timestamptz NOT NULL DEFAULT now()
   updated_at timestamptz NOT NULL DEFAULT now()
   UNIQUE(agent_id, slug)
   ```

4. **`agent_archetypes`** (new):
   ```
   id uuid PK DEFAULT gen_random_uuid()
   slug text NOT NULL UNIQUE   -- 'vertical-fullstack', 'harness-engineer'
   name text NOT NULL
   description text NOT NULL
   soul_addendum text NOT NULL DEFAULT ''
   tools_addendum text NOT NULL DEFAULT ''
   heartbeat_addendum text NOT NULL DEFAULT ''
   created_at timestamptz NOT NULL DEFAULT now()
   ```

5. **`agents`** — add column: `archetype_id uuid REFERENCES agent_archetypes(id) ON DELETE SET NULL`

6. **`tasks`** (new) with enum `task_status` (`backlog`, `in_progress`, `blocked`, `in_review`, `done`):
   ```
   id uuid PK DEFAULT gen_random_uuid()
   business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
   team_id uuid REFERENCES teams(id) ON DELETE SET NULL
   agent_id uuid REFERENCES agents(id) ON DELETE SET NULL
   parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL
   title text NOT NULL
   description text NOT NULL DEFAULT ''
   status task_status NOT NULL DEFAULT 'backlog'
   blocked_reason text
   approval_id uuid REFERENCES approvals(id) ON DELETE SET NULL
   created_at timestamptz NOT NULL DEFAULT now()
   updated_at timestamptz NOT NULL DEFAULT now()
   ```
   Indexes on: `business_id`, `agent_id`, `team_id`, `parent_task_id`, `status`

7. **`task_logs`** (new) with enum `task_log_author_type` (`agent`, `human`):
   ```
   id uuid PK DEFAULT gen_random_uuid()
   task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
   author_type task_log_author_type NOT NULL
   author_id text NOT NULL  -- agentId (uuid as text) or userId
   content text NOT NULL    -- markdown
   created_at timestamptz NOT NULL DEFAULT now()
   ```
   Index on: `task_id`

8. **`skill_files`** (new):
   ```
   id uuid PK DEFAULT gen_random_uuid()
   skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE
   path text NOT NULL  -- 'SKILL.md', 'reference/adapt.md', etc.
   content text NOT NULL
   created_at timestamptz NOT NULL DEFAULT now()
   UNIQUE(skill_id, path)
   ```
   Index on: `skill_id`

9. **`mcp_credentials`** — migrate FK: add `business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE`, drop `agent_id`

10. **`agent_mcp_access`** (new junction):
    ```
    id uuid PK DEFAULT gen_random_uuid()
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE
    mcp_credential_id uuid NOT NULL REFERENCES mcp_credentials(id) ON DELETE CASCADE
    created_at timestamptz NOT NULL DEFAULT now()
    UNIQUE(agent_id, mcp_credential_id)
    ```

11. **`skills`** — drop `markdown` column (after data migration)

---

## Implementation Steps

> Work on branch `phase2/stage1-backend` checked out from `main`.

### Step 1: Edit `db/schema.ts`

Add all new tables and modify existing ones. Use Drizzle `pgTable` + `pgEnum`. Keep all existing exports intact — other code imports them.

Key Drizzle patterns:
```typescript
// New enum
export const taskStatusEnum = pgEnum("task_status", ["backlog", "in_progress", "blocked", "in_review", "done"]);

// New table with FK to self (tasks)
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  parentTaskId: uuid("parent_task_id"),
  // ...
}, (t) => [
  foreignKey({ columns: [t.parentTaskId], foreignColumns: [t.id] }).onDelete("set null"),
  index("tasks_business_id_idx").on(t.businessId),
  // ... more indexes
]);
```

For `mcp_credentials`: Add `businessId` column. Remove `agentId` column. Update unique index.

**IMPORTANT:** Do NOT delete `agents.instructions` or `skills.markdown` in `db/schema.ts` yet — data migrations must run first. You will add a separate migration step after data is copied.

### Step 2: Update `relations()` in `db/schema.ts`

Add relations for all new tables. Update existing relations:
- `agentsRelations`: add `documents: many(agentDocuments)`, `archetype: one(agentArchetypes)`, `mcpAccess: many(agentMcpAccess)`
- `skillsRelations`: add `files: many(skillFiles)` 
- `mcpCredentialsRelations`: change `agent → business`, add junction

### Step 3: Generate DDL migration

```bash
npm run db:generate
```

Review the output SQL. Check it covers all new tables and column additions. Commit the generated migration.

### Step 4: Data migration scripts

Drizzle Kit only generates DDL — you must write data migrations manually. Create migration files in `drizzle/` with the next sequence number:

**Migration A — populate new structures:**
```sql
-- Copy agents.instructions → agent_documents (soul)
INSERT INTO agent_documents (agent_id, slug, filename, content, created_at, updated_at)
SELECT id, 'soul', 'soul.md', instructions, created_at, now()
FROM agents
WHERE instructions IS NOT NULL AND instructions != ''
ON CONFLICT (agent_id, slug) DO NOTHING;

-- Create empty tools + heartbeat docs for all agents
INSERT INTO agent_documents (agent_id, slug, filename, content, created_at, updated_at)
SELECT id, 'tools', 'tools.md', '', created_at, now()
FROM agents
ON CONFLICT (agent_id, slug) DO NOTHING;

INSERT INTO agent_documents (agent_id, slug, filename, content, created_at, updated_at)
SELECT id, 'heartbeat', 'heartbeat.md', '', created_at, now()
FROM agents
ON CONFLICT (agent_id, slug) DO NOTHING;

-- Copy skills.markdown → skill_files
INSERT INTO skill_files (skill_id, path, content, created_at)
SELECT id, 'SKILL.md', markdown, created_at
FROM skills
WHERE markdown IS NOT NULL AND markdown != ''
ON CONFLICT (skill_id, path) DO NOTHING;

-- Populate mcp_credentials.business_id from agents.business_id (before dropping agent_id)
UPDATE mcp_credentials mc
SET business_id = a.business_id
FROM agents a
WHERE mc.agent_id = a.id;

-- Create agent_mcp_access records preserving existing agent-credential relationships
INSERT INTO agent_mcp_access (agent_id, mcp_credential_id, created_at)
SELECT mc.agent_id, mc.id, now()
FROM mcp_credentials mc
WHERE mc.agent_id IS NOT NULL
ON CONFLICT (agent_id, mcp_credential_id) DO NOTHING;
```

**Migration B — drop deprecated columns** (after confirming Migration A ran successfully):
```sql
ALTER TABLE agents DROP COLUMN IF EXISTS instructions;
ALTER TABLE skills DROP COLUMN IF EXISTS markdown;
ALTER TABLE mcp_credentials DROP COLUMN IF EXISTS agent_id;
-- Drop old unique index if it wasn't auto-dropped
DROP INDEX IF EXISTS mcp_credentials_agent_id_mcp_name_unique;
-- Add new unique index on (business_id, mcp_name)
CREATE UNIQUE INDEX IF NOT EXISTS mcp_credentials_business_id_mcp_name_unique 
  ON mcp_credentials(business_id, mcp_name);
```

### Step 5: Run migrations

```bash
npm run db:migrate
```

If using Neon pooler and it fails, set `DATABASE_DIRECT_URL` to the direct (non-pooler) Neon URL and retry.

### Step 6: Fix TypeScript errors from removed columns

Search for any remaining references to `agents.instructions`, `skills.markdown`, `mcpCredentials.agentId`:
```bash
grep -r "\.instructions" lib/ app/ --include="*.ts" --include="*.tsx"
grep -r "\.markdown" lib/ app/ --include="*.ts" --include="*.tsx"
grep -r "agentId.*mcp" lib/ app/ --include="*.ts" --include="*.tsx"
```

Update each reference:
- `agent.instructions` → query `agent_documents WHERE slug='soul'` for the content
- `skill.markdown` → query `skill_files WHERE path='SKILL.md'` for the content
- `mcp_credentials` queries: update to use `business_id`

### Step 7: Update `db/README.md`

Document all new tables, Phase 2 changes, and data migration notes.

### Step 8: Verify

```bash
npm run build        # must exit 0
npm test             # all green
npm run db:studio    # optional: visually verify tables in Drizzle Studio
```

---

## Deliverables

1. Updated `db/schema.ts`
2. New migration files in `drizzle/` (DDL + data migrations + drop deprecated columns)
3. All TypeScript errors from column removal fixed
4. `db/README.md` updated
5. `npm run build` and `npm test` green
6. Task Log at `.apm/memory/stage-01/task-01-01.log.md`
7. Report at `.apm/bus/backend-agent/report.md`

---

## Task Log Format

Write `.apm/memory/stage-01/task-01-01.log.md` with:
```markdown
# Task 1.1 Log — Schema Migrations + Data Migration

**Status:** Done  
**Branch:** phase2/stage1-backend  

## What was done
[summary of changes]

## Files changed
[list]

## Decisions made
[any deviations from spec, rationale]

## Issues encountered
[any blockers and how resolved]

## Validation results
[output of npm run build, npm test, db:migrate]
```

## Report Format

Write `.apm/bus/backend-agent/report.md` with a 3-5 sentence summary for the Manager. Include: what was completed, branch name, any notable deviations or issues, and whether the Frontend Agent can proceed with T1.2 in parallel.
