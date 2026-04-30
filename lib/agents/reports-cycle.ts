import { getDb } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

type DbClient = ReturnType<typeof getDb>;

/** Walk `reports_to` from `candidateManagerId` upward; if we hit `forAgentId`, the link would introduce a cycle. */
export async function wouldIntroduceReportsCycle(
  db: DbClient,
  forAgentId: string | null,
  candidateManagerId: string | null,
): Promise<boolean> {
  if (!candidateManagerId) return false;
  if (forAgentId && candidateManagerId === forAgentId) return true;

  let current: string | null = candidateManagerId;
  const visited = new Set<string>();
  while (current) {
    if (forAgentId !== null && current === forAgentId) return true;
    const stepId: string = current;
    if (visited.has(stepId)) return true;
    visited.add(stepId);

    const row: { reportsToAgentId: string | null } | undefined =
      await db.query.agents.findFirst({
        where: eq(agents.id, stepId),
        columns: { reportsToAgentId: true },
      });
    if (!row) break;
    current = row.reportsToAgentId;
  }
  return false;
}

export async function validateReportsToForBusiness(
  businessId: string,
  owningAgentId: string | null,
  reportsToAgentId: string | null | undefined,
): Promise<string | null> {
  const db = getDb();
  if (reportsToAgentId === undefined || reportsToAgentId === null || reportsToAgentId === "") {
    return null;
  }

  const target = await db.query.agents.findFirst({
    where: eq(agents.id, reportsToAgentId),
    columns: { businessId: true },
  });
  if (!target || target.businessId !== businessId) {
    throw new Error("reports_to agent must belong to the same business");
  }

  if (await wouldIntroduceReportsCycle(db, owningAgentId, reportsToAgentId)) {
    throw new Error("reports_to assignment would create a cycle");
  }
  return reportsToAgentId;
}
