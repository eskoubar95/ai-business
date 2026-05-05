import { getDb } from "@/db/index";
import { agentJobs, communicationEdges } from "@/db/schema";
import { and, count, eq, gte } from "drizzle-orm";

export function isQuotaExceeded(used: number, limit: number | null | undefined): boolean {
  return limit != null && used >= limit;
}

export function mergeQuotaWarning(
  metadata: Record<string, unknown> | null | undefined,
  message: string,
): Record<string, unknown> {
  const m: Record<string, unknown> = { ...(metadata ?? {}) };
  const prev = m.quotaWarnings;
  const list = Array.isArray(prev) ? [...(prev as unknown[])] : [];
  list.push(message);
  m.quotaWarnings = list;
  return m;
}

export type QuotaCheckParams = {
  fromRole: string;
  toRole: string;
  /** Tenant / org — maps to `businesses.id` in this codebase. */
  businessId: string;
};

/**
 * Look up communication edge quotas; if over `quota_per_hour` in warn_only mode, log and return a warning.
 * Never blocks — enforce mode is handled by policy elsewhere (Stream C).
 */
export async function checkQuotaAtDispatch(
  params: QuotaCheckParams,
  options: {
    db?: ReturnType<typeof getDb>;
    log?: Pick<Console, "warn">;
    now?: Date;
  } = {},
): Promise<{ warning?: string }> {
  const db = options.db ?? getDb();
  const log = options.log ?? console;
  const now = options.now ?? new Date();
  const since = new Date(now.getTime() - 60 * 60 * 1000);

  const edges = await db
    .select()
    .from(communicationEdges)
    .where(
      and(
        eq(communicationEdges.businessId, params.businessId),
        eq(communicationEdges.fromRole, params.fromRole),
        eq(communicationEdges.toRole, params.toRole),
      ),
    )
    .limit(1);

  const edge = edges[0];
  if (!edge || edge.quotaPerHour == null) {
    return {};
  }

  const [row] = await db
    .select({ n: count() })
    .from(agentJobs)
    .where(
      and(
        eq(agentJobs.businessId, params.businessId),
        eq(agentJobs.fromRole, params.fromRole),
        eq(agentJobs.toRole, params.toRole),
        gte(agentJobs.enqueuedAt, since),
      ),
    );

  const used = Number(row?.n ?? 0);
  if (isQuotaExceeded(used, edge.quotaPerHour)) {
    const msg = `quota_per_hour exceeded for edge ${edge.fromRole}->${edge.toRole} (used ${used}, limit ${edge.quotaPerHour}, mode ${edge.quotaMode})`;
    log.warn(`[quota-checker] ${msg}`);
    return { warning: msg };
  }

  return {};
}
