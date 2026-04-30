# Agent UI components

- **`agent-card.tsx`** — Roster card linking to edit; wraps live status in `Suspense` for `AgentStatusBadge`.
- **`agent-status-badge.tsx`** — Async server component; reads `getAgentStatus(agentId)` and renders a color-coded badge.
