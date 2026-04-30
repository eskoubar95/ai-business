import { getDb } from "@/db/index";
import { webhookDeliveries } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";
import { count, desc, eq } from "drizzle-orm";

export async function listWebhookDeliveriesByBusiness(
  businessId: string,
  limit = 100,
): Promise<(typeof webhookDeliveries.$inferSelect)[]> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  return db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.businessId, businessId))
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit);
}

export async function countWebhookDeliveriesByBusiness(businessId: string): Promise<number> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.businessId, businessId));
  return Number(row?.n ?? 0);
}
