# Pull request specification — `approval-notion-ui` → `main`

**Purpose:** Single source of truth for the GitHub PR for branch **`approval-notion-ui`** in the **AI Business Platform** repo. The **title** describes what users get, not APM task numbers. Internal numbering (*Plan Task 4.2*, etc.) stays in the description for traceability only. Copy the **Title** and **Description** blocks into GitHub.

**Not the same as:** A separate PR titled “Approval flow UI” on branch `frontend-ui-task` with dozens of `feat(frontend-ui): implement stage N` commits — that workflow and branch name are **not** defined in this repository. This document describes **`approval-notion-ui`** only.

---

## GitHub PR title (use verbatim)

```text
feat(dashboard): orchestration oversight — approvals queue, Notion connection, webhooks log, live agent status
```

**Naming rationale:** Conventional Commits `feat` + `dashboard`; title names **capabilities** shipped in this PR. Reviewers and history search care *what merged*, not which internal task id it satisfied — put those ids in the PR body under **APM traceability**.

---

## GitHub PR description (copy below the line)

--- PR BODY START ---

### Summary

Adds dashboard routes and UI for **pending approvals** (queue + detail), **Notion MCP connection** with sync/status view, **webhook delivery audit**, and **live agent status** on the roster (badges + nav pending count). Adds guarded **E2E** for approvals (`tests/approvals.spec.ts`, seed API). Includes **build hygiene**: no type re-export from `"use server"` MCP actions, and **Playwright** `webServer` stream types aligned with `next build`.

### APM traceability (internal)

Implemented under **Plan — Task 4.2** (*Approval Dashboard & Notion UI*, Frontend Agent). Tracker / task log: `.apm/tracker.md`, `.apm/memory/stage-04/task-04-02.log.md`. **Do not** mirror task ids in the GitHub PR title — this PR bundles the full vertical slice above.

### Branches

- **Base:** `main` (must be up to date on GitHub; if `origin/main` lags many commits, update `main` first so the PR does not show unrelated history.)
- **Compare:** `approval-notion-ui`

### Commits on this PR (vs current local `main` merge-base)

Exact list — *re-run `git log main..approval-notion-ui` if `main` advances:*

1. `718ef4e` — `test(e2e): agents spec timeouts and team nav waitUntil; inherit dev logs locally`
2. `0397489` — `fix: align MCP server actions and Playwright config with Next build`
3. `bd0ecaf` — `feat(dashboard): approvals queue, Notion sync, webhooks log, agent status`
4. `1db5a1a` — `chore(apm): tracker after Task 4.2 review`
5. `557983f` — `docs(apm): PR title and body for approval-notion-ui (Task 4.2)`
6. `3798313` — `docs(apm): PR title by capability, not task number`

### Scope map

| Plan item | Implementation |
|-----------|----------------|
| Approval queue + empty state | `app/dashboard/approvals/page.tsx`, `components/approvals/approval-card.tsx` (`useOptimistic`, `approveArtifact` / `rejectArtifact`) |
| Approval detail | `app/dashboard/approvals/[approvalId]/page.tsx` |
| Notion connection + sync view | `app/dashboard/notion/page.tsx`, `components/notion/notion-connection-panel.tsx`, `components/notion/notion-sync-table.tsx`, `lib/notion/dashboard-actions.ts`, `lib/orchestration/notion-sync-queries.ts` |
| Webhook delivery log | `app/dashboard/webhooks/page.tsx`, `lib/webhooks/deliveries-queries.ts` |
| Agent status on roster | `components/agents/agent-card.tsx`, `components/agents/agent-status-badge.tsx` (`getAgentStatus`, Suspense) |
| Nav: approvals + pending count | `app/components/nav-shell.tsx` (async server component), `lib/approvals/queries.ts` |
| Business-scoped routes | `lib/dashboard/business-scope.ts` extended for approvals / notion / webhooks paths |
| E2E | `tests/approvals.spec.ts`, `app/api/e2e/seed-approval/route.ts` (non-prod, secret header) |
| Build hygiene | `lib/mcp/actions.ts` — remove `McpEncryptedPayload` re-export from `"use server"` file; `playwright.config.ts` — `webServer.stdout` / `stderr`: `pipe` |

### Stats (vs `main` at last export)

- **Files / lines:** run `git diff --stat main..approval-notion-ui` before merge (includes doc-only commits after the original dashboard export).

### Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm test -- --run` | Pass (20 tests at last run) |
| `npm run build` | Pass |
| `npx playwright test tests/approvals.spec.ts` | **Confirm in CI or locally:** free port **3000** (`baseURL` / `webServer.url`), `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_SETUP_SECRET` per `.env.example` |

### Environment / secrets (document names only)

- `E2E_SETUP_SECRET` — documented in `.env.example` for seed route.
- Existing Neon / auth vars for authenticated dashboard flows unchanged.

### Reviewer focus

- Server/client boundaries: no secrets to client; MCP decrypt usage server-only.
- E2E seed route must remain **non-production** and header-guarded.
- Merge only after `main` on remote reflects expected baseline (avoid a PR that lists tens of commits because `main` was never pushed).

--- PR BODY END ---

---

## Task log and tracker

- **Worker Task log:** `.apm/memory/stage-04/task-04-02.log.md`
- **APM tracker:** `.apm/tracker.md` — Stage 4 Task 4.2 marked Done after Manager review

---

## Maintenance

When commits are added or rebased, update the **Commits** and **Stats** sections in the GitHub description or refresh this file and paste again.
