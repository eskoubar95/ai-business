# Agent helpers (`lib/agents`)

Shared guardrails for roster UI and server actions:

- `agent-platform-icon-ids.ts` — allowlist of `icon_key` slugs used by the picker and `agents.icon_key`.
- `avatar-validation.ts` — validates stored `avatar_url` (https or `data:image/*`, size limit).

Server actions remain in [`actions.ts`](./actions.ts); avatar persistence uses `updateAgentAvatar`.
