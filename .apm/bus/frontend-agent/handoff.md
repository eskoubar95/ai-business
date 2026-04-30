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

Task **2.2** is on **`phase2/stage2-frontend`** and submitted as **PR #5** against `main` (**OPEN** as of 2026-04-30 Manager check). Merge når review er godkendt.

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

1. **`/apm-5-check-reports`** (2026-04-30): PR #5 stadig åben — tracker og memory index realigneret.
2. Review og **merge PR #5** til `main` når tilfredsstillende.
3. Efter merge: opdatér `.apm/tracker.md` merge-sandhed; sæt `merge_commit` i `task-02-02.log.md`.
4. Kør evt. **`/apm-5-check-reports frontend-agent`** igen efter merge; hold `task.md` som idle-stub indtil næste dispatch.

## Downstream notes

1. **Task 3.2** (Tasks UI) depends on **3.1** backend — align branches after **3.1** lands.
2. No change to **Notion** or **webhook** contracts in this task.

## Integration

If `main` moves before merge, rebase or merge `main` into `phase2/stage2-frontend` and re-run the validation gate.
