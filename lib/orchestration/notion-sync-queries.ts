import { getDb } from "@/db/index";
import { orchestrationEvents } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";
import { and, desc, eq } from "drizzle-orm";

export type NotionSyncTaskSummary = {
  notionPageId: string;
  title: string;
  last_edited_time?: string;
};

export type NotionSyncEventRow = {
  id: string;
  createdAt: Date;
  status: string;
  syncedAt: string | null;
  pages: NotionSyncTaskSummary[];
};

export async function listRecentNotionSyncEventsForBusiness(
  businessId: string,
  limit = 10,
): Promise<NotionSyncEventRow[]> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const rows = await db
    .select({
      id: orchestrationEvents.id,
      createdAt: orchestrationEvents.createdAt,
      status: orchestrationEvents.status,
      payload: orchestrationEvents.payload,
    })
    .from(orchestrationEvents)
    .where(
      and(eq(orchestrationEvents.businessId, businessId), eq(orchestrationEvents.type, "notion.sync.tasks")),
    )
    .orderBy(desc(orchestrationEvents.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const p = r.payload as Record<string, unknown>;
    const syncedAt = typeof p.syncedAt === "string" ? p.syncedAt : null;
    const rawPages = p.pages;
    const pages: NotionSyncTaskSummary[] = Array.isArray(rawPages)
      ? rawPages.filter((item): item is NotionSyncTaskSummary => {
          if (!item || typeof item !== "object") return false;
          const o = item as Record<string, unknown>;
          return typeof o.notionPageId === "string" && typeof o.title === "string";
        })
      : [];

    return {
      id: r.id,
      createdAt: r.createdAt,
      status: r.status,
      syncedAt,
      pages,
    };
  });
}
