import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/index";
import { orchestrationEvents } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";

export async function listOrchestrationEventsByBusiness(businessId: string, limit = 120) {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
  const db = getDb();
  return db
    .select()
    .from(orchestrationEvents)
    .where(eq(orchestrationEvents.businessId, businessId))
    .orderBy(desc(orchestrationEvents.createdAt))
    .limit(limit);
}
