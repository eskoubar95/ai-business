# Task 3.2 — Tasks UI + log feed + dashboard integration

**Phase:** 2  
**Stage:** 3  
**Worker:** Frontend Agent  
**Branch:** `phase2/stage3-frontend`  
**Task Log:** `.apm/memory/stage-03/task-03-02.log.md`  
**Report:** `.apm/bus/frontend-agent/report.md`

**Canonical task copy:** [`.apm/plan.md`](../../plan.md) — Stage **3**, **Task 3.2**.  
**Backend handoff:** [`.apm/bus/backend-agent/handoff.md`](../../bus/backend-agent/handoff.md) (merged **PR #6** til `main`).

---

### Task 3.2: Tasks UI + log feed + dashboard integration — Frontend Agent

- **Objective:** Build the tasks management UI: task list per business, task detail with log feed, new task form, status column board, and tasks summary on the dashboard.

- **Branch:** `phase2/stage3-frontend`

- **Output:**
  - `app/dashboard/tasks/page.tsx` — task list with status columns
  - `app/dashboard/tasks/new/page.tsx` — create task form
  - `app/dashboard/tasks/[taskId]/page.tsx` — task detail + log feed + comment input
  - `components/tasks/task-card.tsx`, `task-log-feed.tsx`, `task-comment-input.tsx`
  - Dashboard updated to show task summary (pending/in-progress counts)
  - Tasks link in nav

- **Validation:**
  - Create a task → it appears in the task list under "Backlog"
  - Open task detail → log feed shows entries in chronological order
  - Submit comment with `@agentName` → comment appears in feed; `orchestration_events` row is written
  - Dashboard shows "X tasks in progress" count

- **Implementation:**
  1. Add "Tasks" to nav-shell links.
  2. Create `app/dashboard/tasks/page.tsx`: fetches tasks by business (from `searchParams.businessId`), groups by status, renders status columns (Backlog / In Progress / Blocked / In Review / Done). Each task as a card with title, assigned agent, link to detail.
  3. Create `app/dashboard/tasks/new/page.tsx`: form with title, description (textarea), agent selector (dropdown from business agents), team selector, parent task selector.
  4. Create `components/tasks/task-log-feed.tsx`: chronological list of log entries. Agent entries show agent name + content (markdown rendered). Human entries show "You" + content.
  5. Create `components/tasks/task-comment-input.tsx` (`"use client"`): textarea with submit, calls `appendTaskLog` Server Action.
  6. Create `app/dashboard/tasks/[taskId]/page.tsx`: shows task title, status, description, assigned agent/team. Below: `<TaskLogFeed>` + `<TaskCommentInput>`.
  7. Update `app/dashboard/page.tsx` business cards to show task counts (in_progress count, blocked count).
  8. Write/update Playwright E2E.

- **Dependencies:** Task 2.2, **Task 3.1 by Backend Agent** (Server Actions: all tasks + log actions).
