# UI components (`components/ui`)

Shared primitives for the AI Business dashboard. Prefer these over one-off styles so the Linear-inspired redesign stays consistent (see `docs/ui-redesign-spec.md`).

| File | Purpose |
|------|---------|
| `button.tsx` | shadcn-style `Button` + variants |
| `loading-button.tsx` | `Button` with `loading` spinner + disabled |
| `status-dot.tsx` | Agent / workflow status indicator (pulse on active) |
| `agent-avatar.tsx` | Avatar circle + status dot overlay |
| `page-header.tsx` | Breadcrumb slot + actions row |
| `right-panel.tsx` | In-layout slide-over from the right |
| `stat-card.tsx` | Dashboard metric tile |
| `empty-state.tsx` | Icon + title + optional CTA |
| `priority-badge.tsx` | Priority dot (urgent → low) |
| `file-tree.tsx` | Collapsible tree for instruction/skill files |
| `novel-editor.tsx` | Dynamic wrapper; loads TipTap “novel” editor client-only |
| `novel-editor-client.tsx` | Novel editor + code/JSON view toggle |
| `tiptap-editor.tsx` | Rich text / markdown-ish editor with slash commands and shared code blocks |
| `comment-editor-parts.tsx` | Slash-command list + popup, mention list/`MentionChip` + suggestion wiring; see `comment-editor.tsx` shell |
| `comment-editor.tsx` | Compact TipTap editor with mentions and shared code blocks |
| `tiptap-code-block-view.tsx` | Shared TipTap React node view for syntax-highlighted code blocks |
| `kanban-board.tsx` | Generic `@dnd-kit` multi-column board |
| `page-wrapper.tsx` | Page enter animation (`animate-in`) |
| `select.tsx`, `tabs.tsx`, `sonner.tsx` | Existing shadcn-style widgets |

**Usage**

- Import from `@/components/ui/...`.
- For `NovelEditor`, keep it in Client boundaries or inside pages that already use client children; the wrapper uses `next/dynamic` with `ssr: false`.
- For `KanbanBoard`, pass stable `columnItemIds` and update them in `onColumnItemIdsChange` (persist via your Server Action in feature code).
