# Settings actions

| File | Role |
|------|------|
| `actions.ts` | Account Cursor API key + business workspace fields (`saveUserSettings`, `saveBusinessSettings`, `getSettingsPageState`). |
| `cursor-api-key.ts` | Encrypt/decrypt helpers for the per-user Cursor API key blob in `user_settings`. |
| `integrations-panel.ts` | `loadSettingsIntegrationsPanel` — webhook endpoint URL + delivery count + `getMcpLibraryBoard` for Settings MCP section. |
