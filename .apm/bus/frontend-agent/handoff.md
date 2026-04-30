---

## worker: frontend-agent
task: "2.2 — Agent Config Tabs + Run Heartbeat UI + Settings Page"
phase: 2
stage: 2
branch: phase2/stage2-frontend
status: pr_open
handoff_version: 2

# Worker Handoff — Frontend Agent → Manager / downstream

## Summary

Task **2.2** is complete on **`phase2/stage2-frontend`** and submitted as **PR #5** (`feat: Task 2.2 — agent document tabs, heartbeat button, settings state`). Agent edit replaces the monolithic instructions field with **Soul / Tools / Heartbeat** tabs backed by `agent_documents`; **Run Heartbeat** is available on the edit page; Settings shows whether a Cursor API key is stored and pre-fills business workspace fields from the database.

## Authoritative artifacts

| Artifact        | Path                                     |
| --------------- | ---------------------------------------- |
| Task definition | `.apm/tasks/from-plan/2.2-agent-config-tabs-run-heartbeat-ui-settings-page-frontend.md` |
| Task log        | `.apm/memory/stage-02/task-02-02.log.md` |
| Worker report   | `.apm/bus/frontend-agent/report.md`      |
| Pull request    | https://github.com/eskoubar95/ai-business/pull/5 |

## Deliverables checklist (Worker-verified)

- **Document Server Actions:** `lib/agents/document-actions.ts`, `lib/agents/document-model.ts`
- **Tabs UI:** `components/agents/document-editor.tsx`, `components/ui/tabs.tsx`, `@radix-ui/react-tabs`
- **Heartbeat button:** `components/agents/run-heartbeat-button.tsx` → `lib/heartbeat/actions.ts`
- **Edit page:** `app/dashboard/agents/[agentId]/edit/page.tsx` — `getAgentDocuments`, `DocumentEditor`, `RunHeartbeatButton`, `AgentForm` with `showInstructions={false}`
- **Agent form:** `components/agents/agent-form.tsx` — optional `showInstructions` for edit vs create
- **Settings:** `getSettingsPageState` in `lib/settings/actions.ts`; `app/dashboard/settings/page.tsx`, `settings-forms.tsx` — `settings-api-key-saved` test id
- **Tests:** `lib/agents/__tests__/document-actions.test.ts`; `tests/agents.spec.ts` (soul tab)

## Validation gate (Worker-reported — re-run before merge)

`npm test -- --run`, `npm run build`, `npm run lint` — **Green** on **2026-04-30** (branch tip).

Authenticated E2E (`tests/agents.spec.ts`) still requires `E2E_EMAIL` / `E2E_PASSWORD` in the environment.

## Manager actions

1. Review and merge **PR #5** to `main` when satisfied.
2. After merge: update `.apm/tracker.md` merge truth; optional: set `merge_commit` in `task-02-02.log.md`.
3. Run **`/apm-5-check-reports frontend-agent`**; replace `.apm/bus/frontend-agent/task.md` with the idle stub (see `backend-agent/task.md` pattern) until the next dispatch.

## Downstream notes

1. **Task 3.2** (Tasks UI) depends on **3.1** backend — align branches after **3.1** lands.
2. No change to **Notion** or **webhook** contracts in this task.

## Integration

If `main` moves before merge, rebase or merge `main` into `phase2/stage2-frontend` and re-run the validation gate.
