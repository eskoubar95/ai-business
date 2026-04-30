"use server";

import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { memory } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { and, eq, isNull } from "drizzle-orm";

/** Latest business-scoped soul markdown for Grill-Me, or null if none stored yet. */
export async function getBusinessSoulMemory(
  businessId: string,
): Promise<string | null> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized");
  }

  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const row = await db.query.memory.findFirst({
    where: and(
      eq(memory.businessId, businessId),
      eq(memory.scope, "business"),
      isNull(memory.agentId),
    ),
  });

  return row?.content ?? null;
}
