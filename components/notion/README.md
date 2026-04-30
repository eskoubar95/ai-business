# Notion dashboard UI

- **`notion-connection-panel.tsx`** — Client form: pick agent, enter Notion MCP fields (`token`, `workspaceId`, `tasksDatabaseId`), save via `saveMcpCredential`, trigger `runNotionSyncForBusiness`.
- **`notion-sync-table.tsx`** — Server-rendered table of recent `notion.sync.tasks` orchestration payloads.
