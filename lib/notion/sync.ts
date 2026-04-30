import { getNotionClient, resolveNotionForBusiness } from "@/lib/notion/client";
import { logEvent } from "@/lib/orchestration/events";
import type { PageObjectResponse, UpdatePageParameters } from "@notionhq/client";
import { isFullPage } from "@notionhq/client";

function extractTitle(page: PageObjectResponse): string {
  for (const key of Object.keys(page.properties)) {
    const block = page.properties[key];
    if (block?.type === "title" && Array.isArray(block.title)) {
      return block.title.map((t) => t.plain_text).join("").trim() || "Untitled";
    }
  }
  return "Untitled";
}

/**
 * Reads all pages from the configured Notion tasks database and records one batch event in
 * `orchestration_events` (type `notion.sync.tasks`). Set `tasksDatabaseId` on the encrypted Notion MCP payload to enable sync.
 */
export async function syncNotionTasks(
  businessId: string,
): Promise<{ count: number; skippedReason?: string }> {
  const { client, tasksDatabaseId } = await resolveNotionForBusiness(businessId);
  if (!tasksDatabaseId) {
    return {
      count: 0,
      skippedReason: "tasksDatabaseId not set on Notion MCP credential",
    };
  }

  const summaries: Array<{
    notionPageId: string;
    title: string;
    last_edited_time?: string;
  }> = [];

  let cursor: string | undefined;
  do {
    const res = await client.dataSources.query({
      data_source_id: tasksDatabaseId,
      start_cursor: cursor,
    });

    for (const page of res.results) {
      if (!isFullPage(page)) continue;
      summaries.push({
        notionPageId: page.id,
        title: extractTitle(page),
        last_edited_time:
          typeof page.last_edited_time === "string" ? page.last_edited_time : undefined,
      });
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  await logEvent({
    type: "notion.sync.tasks",
    businessId,
    payload: { pages: summaries, syncedAt: new Date().toISOString() },
    status: "succeeded",
    correlationKey: `notion-sync-${businessId}-${summaries.length}`,
  });

  return { count: summaries.length };
}

/**
 * PATCHes a Notion page with the given `properties` object (Notion rich-text / select shapes).
 */
export async function writeBackToNotion(
  businessId: string,
  pageId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const client = await getNotionClient(businessId);
  await client.pages.update({
    page_id: pageId,
    properties: properties as UpdatePageParameters["properties"],
  });

  await logEvent({
    type: "notion.writeback",
    businessId,
    payload: { notionPageId: pageId, keys: Object.keys(properties) },
    status: "succeeded",
    correlationKey: pageId,
  });
}
