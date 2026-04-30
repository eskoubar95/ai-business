import { getDb } from "@/db/index";
import { agents, tasks, userBusinesses } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { count, eq, max } from "drizzle-orm";

export type TaskBusinessCounts = {
  inProgress: number;
  blocked: number;
};

/**
 * Aggregated task counts for businesses the current user can access (join on `user_businesses`).
 * Businesses with no tasks are omitted from the map — callers should default to zeros.
 */
export async function getTaskCountsForUserBusinesses(): Promise<Map<string, TaskBusinessCounts>> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const rows = await db
    .select({
      businessId: tasks.businessId,
      status: tasks.status,
      n: count(),
    })
    .from(tasks)
    .innerJoin(userBusinesses, eq(tasks.businessId, userBusinesses.businessId))
    .where(eq(userBusinesses.userId, userId))
    .groupBy(tasks.businessId, tasks.status);

  const map = new Map<string, TaskBusinessCounts>();
  for (const r of rows) {
    const cur = map.get(r.businessId) ?? { inProgress: 0, blocked: 0 };
    if (r.status === "in_progress") cur.inProgress += Number(r.n);
    if (r.status === "blocked") cur.blocked += Number(r.n);
    map.set(r.businessId, cur);
  }
  return map;
}

export type BusinessAgentDashboardStats = {
  agentCount: number;
  /** Latest `agents.updated_at` for this business, if any agents exist. */
  lastAgentActivityAt: Date | null;
};

/**
 * Per-business agent counts and last roster activity (max agent `updated_at`).
 * Businesses with no agents are omitted — callers default to zero agents / no activity.
 */
export async function getAgentDashboardStatsForUserBusinesses(): Promise<
  Map<string, BusinessAgentDashboardStats>
> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const rows = await db
    .select({
      businessId: agents.businessId,
      agentCount: count(),
      lastAgentActivityAt: max(agents.updatedAt),
    })
    .from(agents)
    .innerJoin(userBusinesses, eq(agents.businessId, userBusinesses.businessId))
    .where(eq(userBusinesses.userId, userId))
    .groupBy(agents.businessId);

  const map = new Map<string, BusinessAgentDashboardStats>();
  for (const r of rows) {
    map.set(r.businessId, {
      agentCount: Number(r.agentCount),
      lastAgentActivityAt: r.lastAgentActivityAt,
    });
  }
  return map;
}
