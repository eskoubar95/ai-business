"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";

import { syncNotionTasks } from "./sync";

export async function runNotionSyncForBusiness(businessId: string): Promise<{
  count: number;
  skippedReason?: string;
}> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
  return syncNotionTasks(businessId);
}
