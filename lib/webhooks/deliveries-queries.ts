import { getDb } from "@/db/index";
import { webhookDeliveries } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";
import { desc, eq } from "drizzle-orm";

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
