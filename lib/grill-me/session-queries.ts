import { getDb } from "@/db/index";
import { grillMeSessions } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type GrillMeMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/** Ordered Grill-Me turns for a business (server-only import paths). */
export async function loadGrillMeSessionsForBusiness(
  businessId: string,
): Promise<GrillMeMessage[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: grillMeSessions.id,
      role: grillMeSessions.role,
      content: grillMeSessions.content,
    })
    .from(grillMeSessions)
    .where(eq(grillMeSessions.businessId, businessId))
    .orderBy(asc(grillMeSessions.seq));

  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
  }));
}
