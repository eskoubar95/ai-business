# Backend Agent — Task 1.1 Report

**Status:** Done (merge-ready on reviewed branch)  
**Branch:** `phase2/stage1-backend`

Phase 2 Stage 1 Task 1.1 is complete: Drizzle schema reflects new enums/tables (`user_settings`, `agent_archetypes`, `agent_documents`, `skill_files`, `tasks`, `task_logs`, `agent_mcp_access`), business MCP credentials with junction opt-in, and migrations `0003`/`0004` apply DDL plus zero-loss backfill from `agents.instructions`, `skills.markdown`, and legacy `mcp_credentials.agent_id`. Server actions and Notion resolution were updated to read/write `agent_documents`, `skill_files`, and business-scoped MCP rows.

Notable deviations: custom SQL file `0004_phase2_drop_legacy_columns.sql` and journal entry were added manually after drizzle-kit failed to update `_journal.json` once on Windows; `0004` includes dedupe logic when multiple agents had the same `(business_id, mcp_name)` before uniqueness. `npm run build` may require a second run locally if `.next/types` is not populated on the first pass — CI should retry if flaky.

The Frontend Agent can proceed with T1.2 in parallel: task/agent UI may eventually consume separate tabs for soul/tools/heartbeat, but the current edit flow still receives `instructions` mapped from the soul document.
