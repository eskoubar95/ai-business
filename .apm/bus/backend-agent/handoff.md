---

## worker: backend-agent

task: "4.1 — Skills file tree + Webhook endpoint + MCP credential migration"
phase: 2
stage: 4
branch: phase2/stage4-backend
status: ready_for_review
handoff_version: 2

# Worker Handoff — Backend Agent → Manager / downstream

## Summary

Task **4.1** er implementeret på **`phase2/stage4-backend`**: multi-fil skills (`file-actions.ts` + GitHub-install), inkommende webhook-route med HMAC og idempotens, samt MCP-actions på **businessId** med grant/revoke og `getMcpCredentialsByBusiness` / `getMcpCredentialsForAgent`. Mindre UI-tilpasninger (McpInstaller, Notion-panel, dashboard-imports) for at bruge den nye API. Tests og build er kørt grønt i sidste validering — **commit og åbn PR** hvis der stadig er ændringer i working tree.

## Authoritative artifacts

| Artifact        | Path                                       |
| --------------- | ------------------------------------------ |
| Task definition | `.apm/plan.md` — Stage **4**, Task **4.1** |
| Task log        | `.apm/memory/stage-04/task-04-01.log.md`   |
| Worker report   | `.apm/bus/backend-agent/report.md`         |

## Deliverables checklist (Worker-verified)

- **`lib/skills/file-actions.ts`** — `installSkillFromFiles`, `installSkillFromGitHub`, `deleteSkillFiles`; `SKILL.md` påkrævet; valgfri `GITHUB_TOKEN`.
- **`app/api/webhooks/[businessId]/receive/route.ts`** — POST; `X-Idempotency-Key`; `X-Webhook-Signature`; `webhook_deliveries` + `orchestration_events` (`webhook_trigger`).
- **`lib/mcp/actions.ts`** — `saveMcpCredential(businessId, …)` → `{ id }`, grant/revoke, list-by-business / for-agent, `deleteMcpCredential`.
- **Tests:** `lib/skills/__tests__/file-actions.test.ts`, `lib/mcp/__tests__/actions-mcp.test.ts`, `app/api/webhooks/[businessId]/receive/__tests__/route.test.ts`.
- **Docs:** `lib/skills/README.md`, `lib/mcp/README.md`, `lib/webhooks/README.md`, `.env.example` (`GITHUB_TOKEN`).

## Validation gate (re-run before merge)

`npm test -- --run`, `npm run build` — **Green**.

## Manager actions (næste)

1. **PR** fra `phase2/stage4-backend` → `main`; merge når grøn.
2. **Frontend:** Dispatch **Task 4.2** på **`phase2/stage4-frontend`** (Skills UI, MCP library, webhook-info) — se `.apm/bus/frontend-agent/task.md` og `.apm/plan.md`.

## Downstream notes (Frontend Task 4.2)

1. Brug Server Actions fra **`@/lib/skills/file-actions`**: `installSkillFromFiles`, `installSkillFromGitHub`; evt. `deleteSkillFiles` for fil-reset.
2. MCP library: `getMcpCredentialsByBusiness`, `saveMcpCredential`, `grantMcpAccessToAgent`, `revokeMcpAccessFromAgent` — ingen hemmeligheder til klienten (kun meta).
3. Webhook URL til visning: **`POST /api/webhooks/[businessId]/receive`** med headers som i plan/implementation.

## Integration

Næste backend-enhed (**Task 5.1**) efter **4.2** er merged til `main`; branch **`phase2/stage5-backend`**.
