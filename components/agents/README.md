# Agent UI components

- **`agent-card.tsx`** — Roster card linking to edit; wraps live status in `Suspense` for `AgentStatusBadge`.
- **`agent-status-badge.tsx`** — Async server component; reads `getAgentStatus(agentId)` and renders a color-coded badge.
- **`agent-settings-form.tsx`** — Client form for agent identity, adapter stubs, run policy, permissions, save/delete; exports `AgentSettingsForm`.
- **`agent-settings-form-fields-part.tsx`** — Shared form primitives: `FieldInput`, `FieldSelect`, `SectionDivider` (used by the main form and permissions section).
- **`agent-settings-form-permissions-part.tsx`** — Permissions block: `AgentSettingsPermissionsSection`, `AgentSettingsPermissionsState`.
- **`agent-settings-form-adapter-run-policy-part.tsx`** — Adapter type toggle, model / thinking-effort fields, heartbeat interval UI: `AgentSettingsAdapterRunPolicySections`, type `AgentAdapterId`.
