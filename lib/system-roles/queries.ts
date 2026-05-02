import { asc } from "drizzle-orm";

import { getDb } from "@/db/index";
import { systemRoles } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";

/** Read-only list for agent settings (session required). */
export async function listSystemRoles() {
  await requireSessionUserId();
  const db = getDb();
  return db.select().from(systemRoles).orderBy(asc(systemRoles.name));
}