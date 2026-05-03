"use server";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/index";
import { orchestrationEvents } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";

export async function retriggerOrchestrationEvent(
  eventId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const row = await db.query.orchestrationEvents.findFirst({
    where: eq(orchestrationEvents.id, eventId),
  });
  if (!row?.businessId) return { ok: false, error: "Event not found" };
  await assertUserBusinessAccess(userId, row.businessId);
  if (row.status !== "failed") {
    return { ok: false, error: "Only failed events can be re-queued" };
  }
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? { ...(row.payload as Record<string, unknown>) }
      : {};
  delete payload.runnerError;
  await db
    .update(orchestrationEvents)
    .set({
      status: "pending",
      payload,
      updatedAt: new Date(),
    })
    .where(eq(orchestrationEvents.id, eventId));
  return { ok: true };
}
