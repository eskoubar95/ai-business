import { getDb } from "@/db/index";
import { userBusinesses } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function assertUserBusinessAccess(
  userId: string,
  businessId: string,
): Promise<void> {
  const db = getDb();
  const row = await db.query.userBusinesses.findFirst({
    where: and(
      eq(userBusinesses.userId, userId),
      eq(userBusinesses.businessId, businessId),
    ),
  });
  if (!row) throw new Error("Forbidden");
}
