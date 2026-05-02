# Settings (dashboard)

Settings uses **`?businessId=`** and **`&section=`** query params:

| Section (`section`) | Content |
|---------------------|---------|
| `account` | Cursor API key (encrypted user settings). |
| `business` | Local path, GitHub URL, description for the selected business. |
| `mcp` | MCP Library (credentials + agent access). |
| `webhooks` | Inbound webhook URL + delivery log table. |
| `notion` | Notion MCP panel + recent sync events. |

`BusinessSelector` preserves non-`businessId` params when switching tenants (e.g. stays on the same section).

Legacy routes `/dashboard/webhooks` and `/dashboard/notion` **redirect** into the matching settings section.
