# UI/UX Redesign Specification — AI Business Platform

> **Status:** Approved and ready for implementation  
> **Date:** April 30, 2026  
> **Stack:** Next.js 15 · React 19 · Tailwind CSS v4 · shadcn/ui · Geist font

---

## 1. Design Principles

- **Dark mode by default**, light mode available via toggle
- **Linear-inspired**: fast, minimal, intuitive — productive without being decorative
- **Motion-first**: every state change has a visual cue — nothing pops, everything transitions
- **Information density**: show more in less space, like Linear's list views
- **Desktop-first**, responsive down to tablet (mobile as overlay/drawer patterns)

---

## 2. Color System

### Primary Palette


| Token                  | Dark Mode                 | Light Mode              | Usage                               |
| ---------------------- | ------------------------- | ----------------------- | ----------------------------------- |
| `--background`         | `#051937` (deep navy)     | `#F8FAFC` (off-white)   | App shell, page background          |
| `--foreground`         | `#F1F5F9`                 | `#0F172A`               | Primary text                        |
| `--sidebar`            | `#030F1F` (darker navy)   | `#EFF2F5`               | Sidebar background                  |
| `--card`               | `#0A2240`                 | `#FFFFFF`               | Card backgrounds                    |
| `--border`             | `rgba(255,255,255,0.08)`  | `#E2E8F0`               | Borders, dividers                   |
| `--input`              | `rgba(255,255,255,0.06)`  | `#E2E8F0`               | Input backgrounds                   |
| `--primary`            | `#A8EB12` (electric lime) | `#6BB800` (darker lime) | CTA buttons, active states, accents |
| `--primary-foreground` | `#051937` (navy)          | `#FFFFFF`               | Text on primary buttons             |
| `--accent`             | `rgba(168,235,18,0.12)`   | `rgba(168,235,18,0.15)` | Hover states, subtle highlights     |
| `--muted`              | `#0D2D4F`                 | `#F1F5F9`               | Muted backgrounds                   |
| `--muted-foreground`   | `#64748B`                 | `#64748B`               | Secondary text                      |
| `--ring`               | `#A8EB12`                 | `#6BB800`               | Focus rings                         |


### Status Colors


| Token              | Value     | Usage                                |
| ------------------ | --------- | ------------------------------------ |
| `--status-active`  | `#A8EB12` | Agent active/working, success states |
| `--status-idle`    | `#64748B` | Agent idle                           |
| `--status-paused`  | `#F59E0B` | Agent paused/warning                 |
| `--status-failed`  | `#EF4444` | Agent failed/error                   |
| `--status-offline` | `#374151` | Agent off/disabled                   |
| `--destructive`    | `#EF4444` | Delete, reject actions               |
| `--success`        | `#22C55E` | Approve, confirm actions             |
| `--warning`        | `#F59E0B` | Warnings, blocked states             |


### Gradient Usage

The `#051937` → `#A8EB12` gradient is used **only** on:

- Active sidebar item left-border glow
- Navigation progress bar
- Agent status pulse animation
- Dashboard hero/header section (subtle)
- Loading bar / skeleton shimmer accent

Never as a full page background.

### Button Variants


| Variant       | Background  | Text           | Border     | Usage                            |
| ------------- | ----------- | -------------- | ---------- | -------------------------------- |
| `primary`     | `#A8EB12`   | `#051937`      | none       | Main CTAs: Create, Save, Approve |
| `secondary`   | `--muted`   | `--foreground` | `--border` | Secondary actions                |
| `ghost`       | transparent | `--foreground` | none       | Nav links, icon buttons          |
| `destructive` | `#EF4444`   | white          | none       | Delete, Reject                   |
| `outline`     | transparent | `--foreground` | `--border` | Tertiary actions                 |


---

## 3. Typography

**Font:** Geist (existing, no change)


| Role               | Size               | Weight | Letter-spacing     |
| ------------------ | ------------------ | ------ | ------------------ |
| Page title (h1)    | `1.5rem` (24px)    | 600    | `-0.02em`          |
| Section title (h2) | `1.125rem` (18px)  | 600    | `-0.01em`          |
| Card title (h3)    | `0.875rem` (14px)  | 500    | `0`                |
| Body               | `0.875rem` (14px)  | 400    | `0`                |
| Small / meta       | `0.75rem` (12px)   | 400    | `0.01em`           |
| Badge / label      | `0.6875rem` (11px) | 500    | `0.04em` uppercase |


---

## 4. Layout Shell

### Structure

```
┌─────────────────────────────────────────────────┐
│ SIDEBAR (240px)  │  CONTENT AREA                │
│                  │  ┌─────────────────────────┐  │
│ [Workspace]  ▾   │  │ Breadcrumbs   [Actions] │  │
│                  │  ├─────────────────────────┤  │
│ ● Dashboard      │  │                         │  │
│   Agents         │  │    Page content         │  │
│   Teams          │  │                         │  │
│   Tasks          │  │                         │  │
│   Skills         │  └─────────────────────────┘  │
│   Approvals   3  │                               │
│                  │                               │
│ ─────────────    │                               │
│   Settings       │                               │
│                  │                               │
│ [User Avatar]    │                               │
└─────────────────────────────────────────────────┘
```

### Sidebar Specifications

- **Width:** 240px expanded, 56px collapsed (icon-only)
- **Collapse trigger:** Arrow button at bottom of sidebar, state saved in `localStorage`
- **Background:** `--sidebar` color (darker than main background)
- **Top section:** Workspace name + avatar icon → dropdown with:
  - Signed in as [email]
  - Switch workspace
  - Profile settings
  - Sign out
- **Nav items:** Icon (Lucide, 16px) + label, `gap-3`
- **Active state:** Lime left-border (3px) + `--accent` background + `--primary` text
- **Hover state:** `--accent` background, 150ms transition
- **Approvals badge:** Red count badge on "Approvals" item when pending > 0
- **Bottom section:** Settings link + user avatar (click → profile dropdown)
- **Mobile:** Hidden by default, opens as overlay drawer on hamburger click

### Sidebar Navigation Items

```
Dashboard      (LayoutDashboard icon)
Agents         (Bot icon)
Teams          (Users icon)
Tasks          (CheckSquare icon)
Skills         (BookOpen icon)
Approvals      (ShieldCheck icon)  ← badge if pending
───────────────
Settings       (Settings icon)
```

*Notion and Webhooks are subsections under Settings — not top-level nav items.*

### Content Area

- **No top navbar** — replaced by in-content header per page
- **Page header pattern:** `flex justify-between items-center` — breadcrumbs left, primary action button right
- **Breadcrumbs:** Always present where applicable (e.g., `Agents / E2E Lead / Instructions`)
- **Max content width:** `max-w-screen-2xl` with `px-6 py-6` padding
- **Background:** `--background`

### Progress Bar

- **Package:** `next-nprogress-bar`
- **Color:** `#A8EB12` (lime)
- **Height:** 2px
- **Position:** Top of viewport, above everything (z-50+)
- Triggers on every Next.js route change

---

## 5. Animation & Motion System

### Page Transitions

Every page wrapper gets:

```tsx
<div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
```

### Loading States

#### Skeleton Screens (`loading.tsx`)

- Every route segment has a `loading.tsx` with a skeleton matching the page layout
- Skeleton uses `animate-pulse` with `--muted` background blocks
- Skeleton blocks match approximate dimensions of real content

#### Button Loading State (`<LoadingButton>`)

- Wrapper component around shadcn `<Button>`
- When `loading={true}`: shows `<Loader2 className="animate-spin" />` + disabled
- Used on all form submit buttons and async action buttons

#### Inline Spinners

- Small async operations (status updates, etc.): `<Loader2 size={14} className="animate-spin" />`

### Micro-interactions


| Element                           | Animation                        | Duration   |
| --------------------------------- | -------------------------------- | ---------- |
| Sidebar collapse/expand           | `width` transition               | 200ms ease |
| Right panel open                  | `translateX` slide from right    | 200ms ease |
| Card hover                        | `translateY(-1px)` + shadow lift | 150ms ease |
| Button hover                      | background color shift           | 150ms ease |
| Kanban card drag                  | lifted shadow + slight scale     | immediate  |
| Kanban card drop                  | spring back                      | 200ms      |
| Status badge pulse (active agent) | `animate-pulse` lime glow        | 2s loop    |
| Toast/notification enter          | slide + fade from bottom-right   | 200ms      |
| Modal/sheet open                  | fade + scale from 95%            | 150ms      |
| Dropdown open                     | fade + slide from top            | 100ms      |


### Agent Status Indicator

```
● (lime pulse)    = active / working
● (grey static)   = idle
● (amber static)  = paused
● (red static)    = failed
○ (grey hollow)   = offline / disabled
```

Polling interval: **5 seconds** via `setInterval` + Server Action fetch.

### `prefers-reduced-motion`

All animations respect:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 6. New Packages

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install novel
npm install recharts
npm install next-nprogress-bar
```

---

## 7. Page Specifications

---

### 7.1 Dashboard (`/dashboard`)

**Purpose:** Command center — instant overview of everything that needs attention.

**Layout:** 3 sections stacked vertically

#### Section 1 — Stat Cards (top row, 4 cards)


| Card              | Value | Icon          | Color accent |
| ----------------- | ----- | ------------- | ------------ |
| Tasks in progress | count | `PlayCircle`  | lime         |
| Blocked tasks     | count | `AlertCircle` | amber        |
| Pending approvals | count | `ShieldAlert` | red (if > 0) |
| Active agents     | count | `Bot`         | lime         |


Each card: white/card background, icon + large number + label, subtle border, hover lift.

#### Section 2 — Two-column grid (middle)

**Left column: Activity Feed**

- Last 10 activity events across all businesses
- Each item: avatar/icon + description + relative timestamp
- Types: task status change, agent status change, approval submitted, comment added
- "View all" link at bottom

**Right column: Approvals Queue**

- Shows first 5 pending approvals
- Each item: title, business, agent, approve/reject buttons inline
- Badge with total pending count in section header
- "View all approvals" link at bottom
- Empty state: green checkmark + "All caught up"

#### Section 3 — Businesses Grid (bottom)

- Grid: 2-3 columns depending on viewport
- Each card: business name, agent count, task status bar (colored segments: backlog/in-progress/blocked/done), "Open" button
- Replaces current flat list

**Charts:** Simple 7-day task activity bar chart (Recharts) in a card above or integrated into dashboard — optional, can be added in iteration 2.

---

### 7.2 Agents (`/dashboard/agents`)

**Purpose:** Roster overview with live status.

**Layout:** Two sections

#### Section 1 — Active Agents (horizontal scroll row or cards)

- Shows only agents currently `active` or `working`
- Large cards: avatar, name, role, animated lime pulse indicator, current task (if any)
- Polling: refreshes every 5 seconds
- Smooth fade-in when an agent becomes active

#### Section 2 — All Agents (filterable list/grid)

- Toggle: **Card view** / **List view**
- Filter bar: by business, by status, by role
- Card view: avatar, name, role, status badge, business tag, "Edit" button
- List view: compact rows like Linear issues — avatar, name, role, status, business, last active
- Search input
- "New agent" button (top right of page header)

---

### 7.3 Agent Detail (`/dashboard/agents/[agentId]/edit` → becomes `/dashboard/agents/[agentId]`)

**Purpose:** Full agent management — one page, tabbed.

**Page header:**

- Breadcrumb: `Agents / [Agent Name]`
- Agent avatar (left) + name + role + status indicator (live pulse)
- Action buttons: `Run Heartbeat` · `Pause` / `Resume` · `···` menu

**Tabs:**

#### Tab 1: Overview

- Recent task executions (list with status + timestamp)
- Activity log (timeline of actions)
- Token usage / budget (simple stat cards)
- Uptime / run history chart (Recharts, 7 days)

#### Tab 2: Instructions

- Two-column layout:
  - **Left (30%):** File tree — list of attached files, click to open
  - **Right (70%):** Novel editor with "Code view" toggle button (top right of editor)
  - Add file options: "Upload .md / .json" button + "New file" button
  - Files can be `.md`, `.js`, `.mjs`, `.json`

#### Tab 3: Skills

- List of attached skills with checkbox to enable/disable
- "Attach existing skill" dropdown
- "Create new skill" inline form (name + editor)

#### Tab 4: MCP

- List of MCP credentials (type icon + name + status)
- "Add credential" button → modal with type selector (GitHub / Notion / Context7)
- Each credential: edit + remove actions

#### Tab 5: Settings

- **Name** (text input)
- **Role** (text input)
- **System role** (dropdown: Developer / Lead / Reviewer / QA / Manager / Custom)
- **Model** (dropdown: available Cursor models)
- **Reports to** (dropdown: other agents)
- **Avatar** (upload image or choose icon from preset set)
- **Permission toggles** (on/off switches):
  - Can create agents
  - Can create tasks
  - Can assign tasks
  - Can create teams
  - Can approve work
- **Danger zone:** Delete agent (destructive button)

---

### 7.4 New Agent (`/dashboard/agents/new`)

**Flow:** 3-step inline form (no separate pages, wizard-style)

**Step 1 — Identity**

- Avatar: icon picker (grid of Lucide bot/person icons) or upload image
- Name (text input)
- Role (text input)
- System role (dropdown with descriptions)

**Step 2 — Configuration**

- Model selection (dropdown)
- Reports to (dropdown, optional)
- Permission toggles (see above)

**Step 3 — Review + Create**

- Summary of choices
- "Create agent" button → navigates to agent detail page

**After creation:** Onboarding guidance card at top of agent detail:

> "Agent created. Next steps: Add instructions → Attach skills → Configure MCP → Run heartbeat"
> (Dismissible, steps are clickable links to respective tabs)

---

### 7.5 Teams (`/dashboard/teams`)

**Layout:** Page header + view toggle + content

**View toggle:** Card view / List view (top right)

**Card view:**

- Grid of team cards
- Each card: team name, lead agent avatar + name, member avatars (stacked, max 5), task count badge
- Click → opens **right panel** (sheet/drawer within content area, not full-screen overlay)

**List view:**

- Compact rows: team name, lead agent, member count, active task count, last activity
- Click → opens same right panel

**Right panel content (team detail):**

- Team name (editable inline)
- Lead agent (with status indicator)
- Members list (with status indicators + remove button)
- Recent tasks assigned to team
- "Edit team" → navigates to edit page if needed

#### New Team (`/dashboard/teams/new`)

- Team name input
- Lead agent dropdown
- Member selection: **checkbox list** of agents not currently assigned to a team (not separate select dropdowns)
- "Create team" button

---

### 7.6 Tasks (`/dashboard/tasks`)

**Purpose:** Drag-and-drop kanban board.

**Board columns:** Backlog · In Progress · Blocked · In Review · Done

**Column header:** Name + count badge + "+" add task button

**Task cards show:**

- Title (truncated at 2 lines)
- Status chip (color-coded)
- Assigned agent avatar (if any)
- Team tag (if any)
- Priority indicator (dot: urgent=red, high=orange, medium=yellow, low=grey)
- GitHub indicator (if PR/branch linked): small GitHub icon + branch name or PR number
- Due date (if set, red if overdue)

**Drag and drop:** `@dnd-kit` — cards lift with shadow on drag, columns highlight on hover.

**Click on task card:** Opens **right panel**

**Right panel — Task detail:**

- Breadcrumb: `Tasks / [Task Title]`
- Title (editable inline, large)
- Status dropdown (top right)
- **Metadata row:** Assigned agent · Team · Priority · Start date · Due date
- **Description:** Novel editor (block editor, full markdown support)
- **Activity / Comments section:**
  - Timeline of status changes + comments
  - Comment input (plain textarea + submit)
  - Use `@AgentName` to trigger orchestration (existing feature, keep)

#### New Task (`/dashboard/tasks/new`)

Form fields:

- Business selector
- Title
- Short description
- Status (default: Backlog)
- Priority (dropdown: Urgent / High / Medium / Low / None)
- Assigned agent (optional)
- Team (optional)
- Parent task (optional)
- Start date (date picker)
- Due date (date picker)
- Description (Novel editor)

---

### 7.7 Skills (`/dashboard/skills`)

**Layout:** Page header + skills table

**Skills table columns:** Skill name · Files count · Agents (checkboxes) · Actions

**Click on skill name:** Opens **right panel**

**Right panel — Skill detail:**

- Two-column layout:
  - **Left (25%):** File tree — list of files in skill, click to select
  - **Right (75%):** Novel editor with code-view toggle
  - Supports: `.md`, `.js`, `.mjs`, `.json`
- Header: skill name + "Remove" button + source info (GitHub URL if from GitHub)

**Install buttons (page level):**

- "Upload files / ZIP" → modal: skill name input + file picker + folder checkbox
- "Install from GitHub" → modal: skill name + GitHub URL input

---

### 7.8 Approvals (`/dashboard/approvals`)

**Layout:** Kanban board (3 columns)

**Columns:** Pending · Approved · Rejected

**Approval cards show:**

- Title / artifact description
- Business tag
- Agent that submitted
- Submitted timestamp
- Approve (green) + Reject (red) buttons on Pending cards

**Click on approval card:** Opens **right panel**

**Right panel — Approval detail:**

- Full artifact content/description
- Agent info
- Approve / Reject buttons with optional comment field
- History of status changes

---

### 7.9 Settings (`/dashboard/settings`)

**Layout:** Left sub-nav + content area (two-column)

**Sub-sections:**

#### Account

- Cursor API key (masked input + save)

#### Business

- Business selector
- Local path input
  - Helper text: "This is the absolute path to your local repository, e.g. `C:\Users\Name\Github\my-repo`"
  - Onboarding tip card: how to find your local path (Windows/Mac/Linux)
- GitHub repository URL input
- Description textarea
- Save button

#### MCP Library

- Grid of integration cards with logo (like Linear's integrations page)
- Each card: logo + name + description + "Add credential" / "Connected" status
- Supported: GitHub · Notion · Context7 · (extensible)
- Click "Add credential" → modal with token input

#### Webhooks

- Inbound webhook URL (read-only, copy button)
- Delivery log table: timestamp · type · status · attempts
- Replaces current raw `/dashboard/webhooks` page

#### Notion

- Notion connection status
- Configuration options (database mappings etc.)
- Replaces current `/dashboard/notion` page

---

## 8. Shared Components to Build


| Component         | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `<LoadingButton>` | Button with `loading` prop → spinner + disabled               |
| `<StatusDot>`     | Animated status indicator (idle/active/failed/paused/offline) |
| `<PageHeader>`    | Breadcrumbs left + actions right, consistent across all pages |
| `<RightPanel>`    | Sliding right panel/sheet within content area                 |
| `<SkeletonCard>`  | Reusable skeleton block for loading states                    |
| `<AgentAvatar>`   | Avatar with status dot overlay                                |
| `<PriorityBadge>` | Colored priority indicator                                    |
| `<EmptyState>`    | Consistent empty state with icon + text + optional CTA        |
| `<FileTree>`      | Collapsible file tree for instructions/skills panels          |
| `<NovelEditor>`   | Novel editor wrapper with code-view toggle                    |
| `<KanbanBoard>`   | DnD kanban with columns + cards                               |
| `<StatCard>`      | Dashboard metric card with icon + value + label               |


---

## 9. Implementation Order


| Step | Scope                            | Files affected                                                                                                                                                                                       |
| ---- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Design tokens + globals.css      | `app/globals.css`                                                                                                                                                                                    |
| 2    | Sidebar layout shell             | `app/layout.tsx`, `app/components/sidebar.tsx`, replace `nav-shell.tsx`                                                                                                                              |
| 3    | Shared components                | `components/ui/loading-button.tsx`, `components/ui/status-dot.tsx`, `components/ui/page-header.tsx`, `components/ui/right-panel.tsx`, `components/ui/empty-state.tsx`, `components/ui/stat-card.tsx` |
| 4    | Progress bar + loading.tsx files | `app/providers.tsx`, `app/dashboard/loading.tsx` + per-section                                                                                                                                       |
| 5    | Dashboard                        | `app/dashboard/page.tsx`                                                                                                                                                                             |
| 6    | Agents list + agent detail tabs  | `app/dashboard/agents/page.tsx`, `app/dashboard/agents/[agentId]/page.tsx`                                                                                                                           |
| 7    | Tasks kanban                     | `app/dashboard/tasks/page.tsx`, `components/tasks/`                                                                                                                                                  |
| 8    | Teams                            | `app/dashboard/teams/page.tsx`                                                                                                                                                                       |
| 9    | Skills                           | `app/dashboard/skills/page.tsx`                                                                                                                                                                      |
| 10   | Approvals kanban                 | `app/dashboard/approvals/page.tsx`                                                                                                                                                                   |
| 11   | Settings subsections             | `app/dashboard/settings/page.tsx`                                                                                                                                                                    |


### Branch + PR strategy

All stages use **stacked PRs** (not git stash). Each feature branch is based on the previous stage branch until merged into `main`, then child branches rebase onto `main`.

| Stage | Branch                           | Base branch                      | PR target   |
| ----- | -------------------------------- | -------------------------------- | ----------- |
| S1    | `feat/ui-s1-foundation`          | `main`                           | `main`      |
| S2    | `feat/ui-s2-shared-components`   | `feat/ui-s1-foundation`          | S1 branch   |
| S3    | `feat/ui-s3-dashboard-agents`    | `feat/ui-s2-shared-components`   | S2 branch   |
| S4    | `feat/ui-s4-tasks-teams-approvals` | `feat/ui-s3-dashboard-agents`  | S3 branch   |
| S5    | `feat/ui-s5-skills-settings`     | `feat/ui-s4-tasks-teams-approvals` | S4 branch |

**Merge order:** merge S1 → `main`, then rebase S2 on `main`, open/update PR to `main`, repeat.

**Worker references:** Implement against this document and `.agents/skills/vercel-react-best-practices/SKILL.md` (see project plan).

---

## 10. Quality Gates

Before marking any step done:

- Dark mode renders correctly (all text readable, borders visible)
- Light mode renders correctly (contrast ≥ 4.5:1)
- All interactive elements have `cursor-pointer`
- All async buttons use `<LoadingButton>` or `useFormStatus`
- No emojis used as icons (Lucide only)
- Hover states have smooth transitions (150–300ms)
- Focus states visible for keyboard navigation
- `prefers-reduced-motion` respected
- Responsive at 1280px, 1440px, 1920px (desktop-first)
- `npm test` passes (existing tests stay green)

