# Notion integration

Business-scoped Notion API access via MCP credentials (integration token + optional task DB id).

## Files

- **`client.ts`** — `getNotionClient(businessId)` and `resolveNotionForBusiness(businessId)` (returns `{ client, tasksDatabaseId? }`). Resolves the first `mcp_credentials` row for `mcp_name = 'notion'` joined to an agent in the business; requires an authenticated user with membership in that business.
- **`parser.ts`** — `parseAgentMentions(commentText)` extracts `!agent-slug` mentions and trailing message text.
- **`sync.ts`** — `syncNotionTasks(businessId)` uses credential payload key `tasksDatabaseId` as the Notion **`data_source_id`** for `client.dataSources.query` (Notion API version shipped with `@notionhq/client`), then logs one `notion.sync.tasks` orchestration event with page summaries. `writeBackToNotion(businessId, pageId, properties)` calls `pages.update` and logs `notion.writeback`.

## MCP credential shape

Encrypted payload should include at least `token` (see `lib/mcp/config.ts`). Optional `tasksDatabaseId` identifies the task list **data source** to query during sync.
