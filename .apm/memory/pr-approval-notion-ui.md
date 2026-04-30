# Pull request specification — `approval-notion-ui` → `main`

**Purpose:** Single source of truth for the GitHub PR that delivers **APM Stage 4, Task 4.2** (*Approval Dashboard & Notion UI*) in the **AI Business Platform** repo. Copy the **Title** and **Description** blocks into GitHub when opening or editing the PR.

**Not the same as:** A separate PR titled “Approval flow UI” on branch `frontend-ui-task` with dozens of `feat(frontend-ui): implement stage N` commits — that workflow and branch name are **not** defined in this repository. This document describes **`approval-notion-ui`** only.

---

## GitHub PR title (use verbatim)

```text
feat(dashboard): Task 4.2 — approvals queue, Notion connection, webhooks log, agent status
```

**Naming rationale:** Uses Conventional Commits `feat`, scopes to `dashboard`, and names the four user-facing surfaces plus APM traceability (*Task 4.2*) so the PR list matches `.apm/plan.md` and `.apm/tracker.md`.

---

## GitHub PR description (copy below the line)

--- PR BODY START ---

### Summary

Implements **APM Plan — Task 4.2: Approval Dashboard & Notion UI** (Frontend Agent): dashboard routes and components for **pending approvals**, **Notion MCP connection and sync/status**, **webhook delivery audit**, and **live agent status** on the roster. Adds guarded **E2E** support for approvals (`tests/approvals.spec.ts`, seed API). Includes a small **build fix** for Server Actions (no type re-export from `"use server"` modules) and **Playwright** `webServer` typings so `next build` typecheck passes.

### Branches

- **Base:** `main` (must be up to date on GitHub; if `origin/main` lags many commits, update `main` first so the PR does not show unrelated history.)
- **Compare:** `approval-notion-ui`

### Commits on this PR (vs current local `main` merge-base)

Exact list — *re-run `git log main..approval-notion-ui` if `main` advances:*

1. `718ef4e` — `test(e2e): agents spec timeouts and team nav waitUntil; inherit dev logs locally`
2. `0397489` — `fix: align MCP server actions and Playwright config with Next build`
3. `bd0ecaf` — `feat(dashboard): approvals queue, Notion sync, webhooks log, agent status`
4. `1db5a1a` — `chore(apm): tracker after Task 4.2 review`

### Scope map (Plan Task 4.2)

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

- **Files:** 36 changed (`git diff --stat main..approval-notion-ui`)
- **Approximate:** +1267 / −68 lines (including APM log/report/tracker and `.env.example`)

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
