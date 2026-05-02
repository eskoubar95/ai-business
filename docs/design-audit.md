# Design System Audit — AI Business Platform

> Audit date: 2026-05-02  
> Scope: dark-mode dashboard, kanban/task UI, onboarding flow, sidebar

---

## 1. Token Inventory

### CSS Variables (dark mode — `.dark` block in `globals.css`)


| Token                | Value                    | Status               |
| -------------------- | ------------------------ | -------------------- |
| `--background`       | `#111111`                | ✅ In use             |
| `--foreground`       | `#ededed`                | ✅ In use             |
| `--card`             | `#1a1a1a`                | ✅ In use             |
| `--popover`          | `#1c1c1c`                | ✅ In use             |
| `--primary`          | `#a8eb12`                | ✅ In use             |
| `--muted-foreground` | `#8c8c8c`                | ✅ In use             |
| `--border`           | `rgba(255,255,255,0.08)` | ✅ In use (`border-border` in components) |
| `--input`            | `rgba(255,255,255,0.06)` | ✅ In use             |
| `--sidebar`          | `#0c0c0c`                | ✅ In use             |
| `--status-active`    | `#a8eb12`                | ✅ In use             |
| `--status-idle`      | `#555555`                | ✅ In use             |


### Missing / Added Tokens

These tokens were documented as a reference comment block in `globals.css` to guide consistent usage:


| Token                 | Intended value       | Purpose                                  |
| --------------------- | -------------------- | ---------------------------------------- |
| `border-border` class | resolves to `--border` | Use for standard panels/cards/lists (historically written as raw `rgba` or legacy `border-white/[0.08]`) |
| border-white/[0.06]   | Subtle inner divider | Section separators inside cards          |
| border-white/[0.14]   | Raised hover border  | Hover state for interactive cards        |
| hover:bg-white/[0.02] | Large card hover     | Lift on large card hover                 |
| hover:bg-white/[0.04] | Nav/row hover        | Hover on nav items and list rows         |


### Added Utility Classes


| Class            | Purpose                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `.section-label` | 10px mono uppercase caps — panel/section headers (pre-existing, unchanged) |
| `.label-upper`   | 11px mono uppercase — field labels inside forms/cards (new)                |
| `.text-muted-tier-secondary` | alias for secondary body copy on `muted-foreground` (`app/globals.css`, Wave 6) |
| `.text-muted-tier-label` | `muted-foreground` ~55% — captions / subdued nav chrome |
| `.text-muted-tier-faint` | `muted-foreground` ~35% — helper lines / tertiary meta |


---

## 2. Inconsistency Table


| File                                      | Issue                                                                                                                   | Fix Applied                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `components/tasks/tasks-kanban-board.tsx` | `bg-[#191919]` hardcoded — bypassed `--card` token                                                                      | Replaced with `bg-card`               |
| `components/tasks/tasks-kanban-board.tsx` | `bg-[#1f1f1f]` hardcoded on drag overlay                                                                                | Replaced with `bg-card`               |
| `components/tasks/tasks-kanban-board.tsx` | `rounded-[5px]` hardcoded — inconsistent with `rounded-md` used everywhere                                              | Replaced with `rounded-md`            |
| `components/tasks/tasks-kanban-board.tsx` | `border-white/[0.07]` on KanbanCard and ListView — drift from `--border` (0.08)                                         | Standardized to `border-white/[0.08]` |
| `components/tasks/tasks-kanban-board.tsx` | `border-white/[0.10]` on New task button — inconsistent                                                                 | Standardized to `border-white/[0.08]` |
| `components/tasks/tasks-kanban-board.tsx` | `hover:border-white/[0.12]` on KanbanCard — inconsistent with agent-card reference (0.14)                               | Raised to `hover:border-white/[0.14]` |
| `components/tasks/task-card.tsx`          | `border-white/[0.06]` — drift from standard (0.08)                                                                      | Standardized to `border-white/[0.08]` |
| `components/tasks/task-card.tsx`          | `hover:border-white/[0.11]` — drift from agent-card reference (0.14)                                                    | Raised to `hover:border-white/[0.14]` |
| `components/ui/stat-card.tsx`             | `rounded-lg` — inconsistent with `rounded-md` used for cards everywhere                                                 | Changed to `rounded-md`               |
| `components/ui/stat-card.tsx`             | `border-white/[0.07]` — drift from standard (0.08)                                                                      | Standardized to `border-white/[0.08]` |
| `components/ui/stat-card.tsx`             | `hover:border-white/[0.12]` — inconsistent with reference (0.14)                                                        | Raised to `hover:border-white/[0.14]` |
| `components/ui/stat-card.tsx`             | Inline label style (`text-[11px] font-medium tracking-wide text-muted-foreground uppercase`) not using `.section-label` | Replaced with `section-label` class   |
| `app/onboarding/onboarding-client.tsx`    | `bg-[#1e1e24]` hardcoded on floating selection badge                                                                    | Replaced with `bg-popover`            |
| `app/onboarding/onboarding-client.tsx`    | `border-white/10` on selection badge                                                                                    | Standardized to `border-white/[0.08]` |
| `app/globals.css`                         | `#111116` hardcoded in `.comment-rendered pre` background                                                               | Replaced with `var(--background)`     |
| `app/globals.css`                         | `border: 1px solid rgba(255,255,255,0.07)` in `.comment-rendered pre`                                                   | Raised to `rgba(255,255,255,0.08)`    |


---

## 3. Remaining Work (Too Risky / Structural)

These are noted but **not changed**:

### 3a. Muted text opacity fragmentation

Files across the codebase use `text-white/50`, `text-white/40`, `text-white/25`, `text-white/22`, `text-white/20`, `text-white/35` alongside `text-muted-foreground` and its opacity modifiers. A full pass to consolidate these would require semantic decisions (what level = label, what level = caption) and touching 30+ files.  
**Recommendation**: Define 3 tiers (`text-muted-foreground`, `text-muted-foreground/50`, `text-muted-foreground/35`) and run a codemod.

### 3b. Label style fragmentation across kanban/list headers

Column headers use:

- `text-[10px] font-semibold uppercase tracking-[0.08em]` (list view)
- `text-[11px] font-semibold uppercase tracking-[0.06em]` (board view)

These are close but not identical. Safe to unify but requires visual QA.

### 3c. Hover background level inconsistency on list rows

`tasks-kanban-board.tsx` list rows use `hover:bg-white/[0.03]` while dashboard activity rows use `hover:bg-white/[0.02]`. Both are within acceptable range but a single standard should be chosen.

### 3d. Onboarding `PrimaryBtn` inline styles

The `PrimaryBtn` component in `onboarding-client.tsx` uses inline `style={}` gradient backgrounds — this is intentional (gradient-border technique) and **should not be converted to Tailwind classes**. It is visually distinct by design.

### 3e. Onboarding `LetterGlitch` background and card animation

The `fixed inset-0` backdrop + `rounded-2xl` onboarding card with directional fly animations is a deliberate aesthetic departure from the dashboard. **Not changed** as instructed.

### 3f. Tiptap editor CSS — hardcoded rgba values

`globals.css` contains ~300 lines of editor-specific styles using hardcoded `rgba(255,255,255,X)` values. These are scoped to `.tiptap-editor` and `.comment-editor` classes and isolated from the design system. Low-risk to leave as-is.

---

## 5. Componentization

> Completed: 2026-05-02

### Components created


| File                              | Purpose                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `components/ui/card.tsx`          | `<Card>` base — `rounded-md border border-border bg-card` with `padding`, `interactive`, and `as` props |
| `components/ui/section-label.tsx` | `<SectionLabel>` React wrapper for the `.section-label` CSS class                                             |
| `components/ui/status-badge.tsx`  | `<StatusBadge>` unified pill badge (color, dot, pulse) — covers agent lifecycle and task status labels        |


### Components extended


| File                            | Change                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/page-header.tsx` | Added `title` + `description` + `action` props for the `h-14` flush dashboard page header pattern; existing `breadcrumb`/`actions` API preserved for detail pages |


### Globals utility classes added (`app/globals.css`)


| Class             | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `.divider-subtle` | `border-t border-white/[0.06]` — inner section dividers |
| `.icon-btn`       | 28×28 rounded icon button with hover states             |
| `.chip`           | Base inline pill label                                  |
| `.chip-neutral`   | Dimmed neutral tag chip                                 |
| `.chip-primary`   | Lime-accented primary chip                              |


### Files updated to use shared components


| File                               | Components used                            |
| ---------------------------------- | ------------------------------------------ |
| `components/agents/agent-card.tsx` | `<Card as="li" interactive>`               |
| `components/ui/stat-card.tsx`      | `<Card interactive>`                       |
| `app/dashboard/page.tsx`           | `<PageHeader title="Command Center" />`    |
| `app/dashboard/agents/page.tsx`    | `<PageHeader title="Agents" action={…} />` |


### Wave 2 migration (2026-05-02)

#### Files updated


| File                                         | Changes                                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/tasks/task-card.tsx`             | Fixed chip border token drift: `border-white/[0.07]` → `border-white/[0.08]` (3 chip `<span>` elements). Root `<Link>` element intentionally left as inline classes — see "intentionally unchanged" below.                                                                                 |
| `components/tasks/tasks-kanban-board.tsx`    | Added `<Card>` import. Fixed chip border token drift in `KanbanCard` (`border-white/[0.07]` → `border-white/[0.08]`, 3 instances). Replaced `ListView` outer container `div` with `<Card padding="" className="overflow-hidden">` and empty-state `div` with `<Card padding="py-16" ...>`. |
| `app/dashboard/tasks/page.tsx`               | Added `<PageHeader>` import. Replaced inline `<header>` flush pattern with `<PageHeader title="Tasks" action={…} />`. Task count moved to `action` slot (right-aligned); acceptable visual delta from original inline placement.                                                           |
| `components/agents/agents-roster-client.tsx` | Added `<Card>` import. Replaced list-view wrapper `div` with `<Card padding="" className="mt-4 overflow-hidden">`. Fixed `border-white/[0.07]` → `border-white/[0.08]` on table header. Replaced inline `border-t border-white/[0.06]` divider with `.divider-subtle` utility class.       |


#### Intentionally unchanged (with rationale)


| File                                          | Pattern                    | Reason                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/tasks/task-card.tsx`              | Root `<Link>` card wrapper | `<Card>` renders as `div/li/article/section` — cannot render as `<a>`. Converting would require restructuring the interactive element (e.g. adding absolute-positioned Link inside a Card), which is a behavioral change. Inline tokens are already correct.                                                                                                |
| `components/tasks/tasks-kanban-board.tsx`     | `KanbanCard` inner `div`   | Carries `role`, `tabIndex`, `onClick`, `onKeyDown` handlers required by dnd-kit drag interaction. `<Card>` does not accept event-handler props. Replacing it would drop keyboard/click interactivity.                                                                                                                                                       |
| `app/dashboard/page.tsx`                      | Local `Stat` component     | Layout differs from `<StatCard>`: local `Stat` places the icon top-right at 14px with the value below; `StatCard` places a 36×36 icon-container on the right side of a vertically-centered value. Replacing would change visual appearance. Also `StatCard` is `interactive` (hover states); local `Stat` is not. Not semantically equivalent — left as-is. |
| `app/dashboard/agents/[agentId]/page.tsx`     | Panel containers           | Out of scope for this wave (not listed in Step 2). To be addressed in a future pass.                                                                                                                                                                                                                                                                        |
| Any page using `border-t border-white/[0.06]` | Remaining inline dividers  | Only `agents-roster-client.tsx` was in scope. Other occurrences require a broader audit pass.                                                                                                                                                                                                                                                               |


---

---

## 6. Interaction Polish Pass (2026-05-02)

### Cursor pointer audit — fixes applied


| File                                         | Fix                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `components/agents/agents-roster-client.tsx` | Added `cursor-pointer` + `focus-visible:ring-1 focus-visible:ring-primary/50` to both ViewToggle buttons                            |
| `components/tasks/tasks-kanban-board.tsx`    | Added `cursor-pointer` + `focus-visible` ring to ViewToggle buttons, "New task" toolbar button, and "Add task" column footer button |
| `components/tasks/task-status-select.tsx`    | Added `cursor-pointer` to the non-`hideLabel` `<select>` variant                                                                    |
| `app/globals.css`                            | Added `cursor-pointer` + `focus-visible:ring-1 focus-visible:ring-primary/50` to `.icon-btn` utility class                          |


### Hover state standardization — fixes applied


| File                                         | Fix                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `components/agents/agents-roster-client.tsx` | List view rows: `hover:bg-white/[0.03]` → `hover:bg-white/[0.04]` (standard row hover)                                 |
| `components/tasks/tasks-kanban-board.tsx`    | List view task rows: `hover:bg-white/[0.03]` → `hover:bg-white/[0.04]`; added `duration-150` to transitions missing it |
| `components/agents/skill-manager.tsx`        | `SkillRow` hover: `hover:bg-white/[0.02]` (too faint) → `hover:bg-white/[0.04]` (standard row hover)                   |


### Focus rings — fixes applied


| File                                         | Fix                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `components/agents/agent-detail-tabs.tsx`    | Tab buttons: added `focus-visible:ring-1 focus-visible:ring-primary/50` (was only `outline-none`)        |
| `components/agents/agents-roster-client.tsx` | ViewToggle buttons: added `focus-visible:ring-1 focus-visible:ring-primary/50`                           |
| `components/tasks/tasks-kanban-board.tsx`    | ViewToggle + "New task" + "Add task" buttons: added `focus-visible:ring-1 focus-visible:ring-primary/50` |
| `app/globals.css`                            | `.icon-btn`: added `focus-visible:ring-1 focus-visible:ring-primary/50`                                  |


### Already correct (no change needed)


| File                                         | Status                                                 |
| -------------------------------------------- | ------------------------------------------------------ |
| `components/agents/agent-card.tsx`           | `<Card interactive>` provides `cursor-pointer`         |
| `components/ui/card.tsx`                     | `interactive` prop correctly adds `cursor-pointer`     |
| `components/ui/stat-card.tsx`                | Uses `<Card interactive>`                              |
| `components/agents/document-editor.tsx`      | All buttons already have `cursor-pointer`              |
| `components/agents/skill-manager.tsx`        | Checkbox/submit buttons already have `cursor-pointer`  |
| `components/agents/run-heartbeat-button.tsx` | Button already has `cursor-pointer`                    |
| `components/tasks/task-card.tsx`             | `<Link>` wrapper already has `cursor-pointer`          |
| `app/components/sidebar.tsx`                 | All interactive elements already have `cursor-pointer` |
| `app/components/nav-new-business-button.tsx` | `<Button asChild>` wrapper handles cursor              |
| `app/dashboard/page.tsx`                     | No interactive elements missing cursor                 |


---

---

## 7. Wave 4 — Button standardization + hardcoded color sweep (2026-05-02)

### New components


| File                               | Purpose                                                                                                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/primary-button.tsx` | `<PrimaryButton>` — the definitive primary CTA. Gradient border + subtle lime wash fill, brightens on hover. Exact replica of the "Run Sprint" button pattern. Props: `children`, `onClick`, `disabled`, `loading`, `icon`, `size` (`"sm" |


### Primary button migrations (`bg-primary text-black` → `<PrimaryButton>`)


| File                                                           | Change                                                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `components/teams/team-detail-tabs.tsx`                        | "Save changes" — replaced `bg-primary text-black hover:bg-primary/90` with `<PrimaryButton icon={Save}>` |
| `components/agents/agent-settings-form.tsx`                    | "Save changes" — was a subdued border/ghost button, upgraded to `<PrimaryButton>` as the primary action  |
| `app/dashboard/settings/settings-account-section.tsx`          | "Save account settings" — upgraded to `<PrimaryButton>`                                                  |
| `app/dashboard/settings/settings-business-section.tsx`         | "Save workspace settings" — upgraded to `<PrimaryButton>`                                                |
| `app/dashboard/settings/settings-business-profile-section.tsx` | "Save profile" — upgraded to `<PrimaryButton>`                                                           |


### Ghost button analysis

No `GhostButton` component created — there are not 3+ secondary buttons with *inconsistent* styling. Cancel/Back secondary actions either use the existing shadcn `<Button variant="ghost">` / `<Button variant="outline">`, or are text-only inline actions. Not enough inconsistency to warrant extraction at this wave.

### Hardcoded color sweep


| File                                              | From                                              | To                    | Rationale                                    |
| ------------------------------------------------- | ------------------------------------------------- | --------------------- | -------------------------------------------- |
| `components/approvals/approvals-board-client.tsx` | `bg-[#111111]`                                    | `bg-background`       | Exact token match                            |
| `components/approvals/approvals-board-client.tsx` | `border-white/[0.07]`                             | `border-white/[0.08]` | Border standard                              |
| `components/ui/kanban-board.tsx`                  | `bg-[#111111]`                                    | `bg-background`       | Column background = page background          |
| `components/ui/kanban-board.tsx`                  | `border-white/[0.07]` (×2)                        | `border-white/[0.08]` | Border standard                              |
| `components/teams/team-org-chart.tsx`             | `bg-[#1c1c1c]`                                    | `bg-popover`          | Exact token match                            |
| `components/teams/team-org-chart.tsx`             | `bg-[#111111]/80` (zoom badge)                    | `bg-background/80`    | Exact token match                            |
| `components/ui/custom-select.tsx`                 | `bg-[#1c1c1c]`                                    | `bg-popover`          | Dropdown overlay = popover                   |
| `components/tasks/task-detail-client.tsx`         | `bg-[#111111]` (×2, layout root + mobile sidebar) | `bg-background`       | Exact token match                            |
| `components/skills/skills-dashboard.tsx`          | `bg-[#111111]` (left sidebar)                     | `bg-background`       | Exact token match                            |
| `components/skills/skills-dashboard.tsx`          | `bg-[#161616]` (right panel + modal)              | `bg-card`             | Closest token; minor visual delta acceptable |
| `components/skills/skills-dashboard.tsx`          | `border-white/[0.07]`                             | `border-white/[0.08]` | Border standard                              |
| `components/tasks/task-create-modal.tsx`          | `bg-[#1c1c1c]` (dropdowns)                        | `bg-popover`          | Exact token match                            |
| `components/tasks/task-create-modal.tsx`          | `bg-[#161616]` (modal body)                       | `bg-card`             | Closest token                                |
| `app/dashboard/agents/[agentId]/page.tsx`         | `border-white/[0.07]` (×2)                        | `border-white/[0.08]` | Border standard                              |
| `app/dashboard/teams/[teamId]/page.tsx`           | `border-white/[0.07]`                             | `border-white/[0.08]` | Border standard                              |


### Intentionally unchanged (with rationale)


| File                                                            | Pattern                                                        | Reason                                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `components/tasks/task-detail-activity.tsx`                     | `bg-[#1c1c22]` (context menu)                                  | Intentional purple-tinted dark; no matching token; visually distinct by design                              |
| `components/ui/tiptap-editor.tsx`                               | `bg-[#141414]`, `bg-[#1c1c1c]`, `bg-[#181818]`                 | Editor-scoped chrome; matches the code-block/slash-menu aesthetic established by the editor; leave isolated |
| `components/ui/comment-editor.tsx` / `comment-editor-parts.tsx` | `bg-[#141414]`, `bg-[#181818]`, `bg-[#191919]`, `bg-[#16161a]` | Same isolation rationale as tiptap-editor                                                                   |


### Page bloat check


| File                                      | Verdict                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `app/dashboard/agents/[agentId]/page.tsx` | `StatusPill` (27 lines) and `TaskStatusTag` (15 lines) — both under the 30-line extraction threshold, page-specific, and safe to leave |
| `app/dashboard/teams/[teamId]/page.tsx`   | No inline component definitions; all UI delegated to `<TeamDetailTabs>` — clean                                                        |


### TypeScript

`npx tsc --noEmit` is **green** (2026-05-02 follow-up). Fixes: `InferInsertModel` optional addendum fields in `archetype-rows.test.ts` use nullish coalescing before `.trim()`; `skill-upload-files.test.ts` wraps JSZip `uint8array` output in `new Uint8Array(raw)` so `File` receives a `BlobPart`-compatible buffer view.

### Vitest (full suite)

`npm test -- --run` is **green** (2026-05-02): 29 test files, 75 tests; **no tests skipped** on this run.

---

## React architecture audit (2026-05-02)

Line-count snapshot (largest `.tsx` under `components/` + `app/` **at audit time**; superseded extracts noted):


| Lines                      | File                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~1420~~ → ~397 post-split | `components/tasks/task-detail-client.tsx` (see splits below)                                                                                                                         |
| ~~1277~~ → ~210 post-split | `app/onboarding/onboarding-client.tsx` (see onboarding split rows below)                                                                                                             |
| ~~817~~ → ~206 post-split  | `components/ui/comment-editor.tsx` (+ ~8 `comment-editor-parts.tsx` re-exports)                                                                                                      |
| 615                        | `components/skills/skills-dashboard.tsx`                                                                                                                                             |
| ~~576~~ → ~350             | `components/agents/agent-settings-form.tsx` (+ `agent-settings-form-fields-part.tsx`, `agent-settings-form-permissions-part.tsx`, `agent-settings-form-adapter-run-policy-part.tsx`) |
| ~~512~~ → ~311 post-split  | `components/tasks/task-create-modal.tsx` (+ meta-bar part below)                                                                                                                     |
| ~268                       | `components/tasks/task-create-modal-meta-bar-part.tsx` (status/assignee/team/footer bar + shared status constants)                                                                   |
| ~89                        | `components/teams/team-detail-tabs.tsx` (tab shell + org-chart tab; overview/members/settings imported)                                                                              |
| ~88                        | `components/teams/team-detail-members-section.tsx` (`TeamMembersSection`)                                                                                                            |
| ~146                       | `components/teams/team-detail-settings-section.tsx` (`TeamSettingsSection`; props type in `team-detail-types.ts`)                                                                    |
| 436                        | `app/components/sidebar.tsx`                                                                                                                                                         |
| 430                        | `components/tasks/tasks-kanban-board.tsx`                                                                                                                                            |
| 412                        | `components/ui/tiptap-editor.tsx`                                                                                                                                                    |
| 378                        | `components/mcp/mcp-library.tsx`                                                                                                                                                     |
| ~221                       | `components/ui/comment-editor-slash.tsx` (slash menu; split 2026-05-02)                                                                                                              |
| ~386                       | `components/ui/comment-editor-mention.tsx` (mentions + chip; split 2026-05-02)                                                                                                       |
| 345                        | `components/ui/kanban-board.tsx`                                                                                                                                                     |
| 334                        | `components/mcp/mcp-installer.tsx`                                                                                                                                                   |
| 294                        | `components/approvals/approvals-board-client.tsx`                                                                                                                                    |
| 289                        | `components/agents/skill-manager.tsx`                                                                                                                                                |
| ~115                       | `app/onboarding/onboarding-steps-ui.tsx` (shared onboarding UI primitives)                                                                                                           |
| ~379                       | `app/onboarding/onboarding-steps-1-6.tsx` (`Step1`–`Step6`)                                                                                                                          |
| ~426                       | `app/onboarding/onboarding-steps-grill.tsx` (`Step7`, `Step8`, grill helpers)                                                                                                        |
| ~31                        | `lib/onboarding/constants.ts` (`ROLES`, `TOTAL_STEPS`, `LOADING_MESSAGES`, `AI_RESPONSES`)                                                                                           |
| ~12                        | `lib/onboarding/types.ts` (`Role`, `BizType`, `KeyStatus`, `ChatMessage`)                                                                                                            |
| ~105                       | `components/teams/team-detail-overview-section.tsx` (`TeamOverviewSection`)                                                                                                          |
| ~30                        | `components/teams/team-detail-types.ts` (`TeamDetailTeam`, member/agent types, `TeamSettingsSectionProps`)                                                                           |


### Splits implemented (this pass)


| Area                             | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task detail modularization       | `task-detail-dropdowns.tsx` (`StatusDropdown`, `PriorityDropdown`, `AssigneeDropdown`, unused-but-colocated `TeamDropdown`). `task-detail-sidebar.tsx` (`SidebarToolbar`, property rows + `LabelsSection` / `ProjectField` / `RelationsSection`, `TaskDetailSidebar`). `task-detail-activity.tsx` (`ActivityFeed`, `CommentBox`, `SystemEventRow`, highlighted `CommentContent`). `lib/tasks/task-detail-types.ts` (`LogEntry`, `TaskRelationItem`). `lib/tasks/task-detail-helpers.ts` (+ tests). Shell: `task-detail-client.tsx`. |
| Comment editor modularization    | `comment-editor-slash.tsx` (`SlashCommand`, `SLASH_COMMANDS`, `createSlashExtension`). `comment-editor-mention.tsx` (`MentionItem`, `createMentionExtension`, mention list + chip node view). `comment-editor-parts.tsx` re-exports both for stable imports. `comment-editor.tsx` unchanged import path.                                                                                                                                                                                                                            |
| Onboarding split (2026-05-02)    | Pure data/types → `lib/onboarding/constants.ts`, `lib/onboarding/types.ts`. Step UI primitives → `onboarding-steps-ui.tsx`. Steps 1–6 → `onboarding-steps-1-6.tsx`. Grill / editor / summary steps → `onboarding-steps-grill.tsx`. Shell (`goTo`, `cardAnim`, effects, state) → `onboarding-client.tsx`.                                                                                                                                                                                                                            |
| Teams detail (2026-05-02)        | `team-detail-types.ts` shared shapes + `TeamSettingsSectionProps`; `team-detail-overview-section.tsx`; `team-detail-members-section.tsx`; `team-detail-settings-section.tsx`; `team-detail-tabs.tsx` thin shell (tabs + org-chart tab only).                                                                                                                                                                                                                                                                                        |
| Task detail (prior)              | `relativeTime`, label/priority/status display constants → `lib/tasks/task-detail-display.ts`; `PriorityIcon` → `task-detail-priority-icon.tsx`; `useOutsideClick` → `hooks/use-outside-click.ts`                                                                                                                                                                                                                                                                                                                                    |
| TipTap editors                   | Shared `lowlight` → `lib/ui/tiptap-lowlight.ts`; shared code-block view → `tiptap-code-block-view.tsx` (used by `tiptap-editor.tsx` + `comment-editor.tsx`).                                                                                                                                                                                                                                                                                                                                                                        |
| Skills dashboard                 | `skills-dashboard-file-tree.tsx` (`MetaField`, `SkillFileTreeRow`, `getSkillFileIcon`)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Task create modal (2026-05-02)   | `task-create-modal-meta-bar-part.tsx` — metadata row (dropdowns, blocked reason, Create). Constants `STATUS_LABEL` / `STATUS_DOT` / `STATUS_OPTIONS` colocated for the modal.                                                                                                                                                                                                                                                                                                                                                       |
| Agent settings form (2026-05-02) | `agent-settings-form-fields-part.tsx` — `FieldInput`, `FieldSelect`, `SectionDivider`. `agent-settings-form-permissions-part.tsx` — `AgentSettingsPermissionsSection` + `AgentSettingsPermissionsState`. `agent-settings-form-adapter-run-policy-part.tsx` — `AgentSettingsAdapterRunPolicySections`, exported `AgentAdapterId`; adapter toggles, model / thinking-effort selects, heartbeat run-policy UI. Shell: `agent-settings-form.tsx`.                                                                                       |


### Hooks added

- `hooks/use-outside-click.ts` — mousedown-outside handler for dropdowns (task detail).

### Recommended future splits (not done here)

- **`components/tasks/task-detail-client.tsx`**: optional extraction of `DescriptionEditor` (~58 LOC — below the usual extract bar); left inline in Wave 6.
- **`components/tasks/task-create-modal.tsx`**: optional extraction of description Write/Preview block if the shell should stay thinner (~55 LOC — same threshold note).

---

## 4. Recommendations

1. ~~**Adopt `border-border`…**~~ **Done — Wave 6 (2026-05-02).** Standard card/list/panel/dropdown surfaces under `app/`, `components/`, onboarding, MCP, dashboards, approvals, sidebar, hooks-only UI imports (`card.tsx`, `stat-card`-related patterns): all former `border-white/[0.08]` → `border-border` (≈102 replacements in TS/TSX/CSS; **`0`** remaining in `.tsx`/`.ts`/`.css` outside audit history prose). Chips and `.divider-subtle` intentionally keep **`border-white/[0.06]`** (nested / subtler than `--border`).
2. **Create a `<Card>` base component** (if not already planned) that encodes `rounded-md border border-border bg-card` as defaults, so individual cards don't repeat tokens. This is the most impactful structural change.
3. ~~**Define three muted text tiers**~~ **Introduced via CSS utilities (Wave 6)** — see “Added Utility Classes” table (`.text-muted-tier-secondary`, `.text-muted-tier-label`, `.text-muted-tier-faint`). Selectively applied in sidebar, PageHeader, and settings; **future:** repo-wide **`text-white/*` codemod** (original idea was normalizing secondary / caption / decorative semantics):
  - Primary secondary: `text-muted-foreground` (#8c8c8c in dark)
  - Label/caption: ~`muted-foreground` partial opacity (tier utilities + selective adoption)
  - Faint/decorative: ~`muted-foreground/35`-class tier
4. **Standardize label patterns** — **partial (Wave 6):** `.label-upper` / `.section-label` now cover obvious settings + sidebar/workspace popover cases; webhook section 9.5px labels untouched.
5. **Visual QA pass on card hover states** — now that `hover:border-white/[0.14]` is the standard for interactive cards, verify in browser that agent cards, task cards, kanban cards, and stat cards all feel consistent on hover. The subtle bg lift (`hover:bg-white/[0.02]`) combined with the border raise creates a clean depth effect.

