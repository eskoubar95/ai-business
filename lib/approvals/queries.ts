import { getDb } from "@/db/index";
import { agents, approvals, userBusinesses } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";
import { and, count, desc, eq, inArray } from "drizzle-orm";

export type SerializableApprovalCard = {
  id: string;
  artifactRef: Record<string, unknown>;
  createdAt: string;
  agentId: string | null;
  agentName: string | null;
};

export type PendingApprovalRow = {
  id: string;
  artifactRef: Record<string, unknown>;
  createdAt: Date;
  agentId: string | null;
  agentName: string | null;
};

export async function countPendingApprovalsForUser(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: count() })
    .from(approvals)
    .innerJoin(userBusinesses, eq(approvals.businessId, userBusinesses.businessId))
    .where(and(eq(userBusinesses.userId, userId), eq(approvals.approvalStatus, "pending")));

  return Number(row?.count ?? 0);
}

export async function listPendingApprovalsForBusiness(
  businessId: string,
): Promise<PendingApprovalRow[]> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const rows = await db
    .select({
      id: approvals.id,
      artifactRef: approvals.artifactRef,
      createdAt: approvals.createdAt,
      agentId: approvals.agentId,
      agentName: agents.name,
    })
    .from(approvals)
    .leftJoin(agents, eq(approvals.agentId, agents.id))
    .where(and(eq(approvals.businessId, businessId), eq(approvals.approvalStatus, "pending")))
    .orderBy(desc(approvals.createdAt));

  return rows.map((r) => ({
    ...r,
    artifactRef: r.artifactRef as Record<string, unknown>,
  }));
}

export type ApprovalDetailRow = {
  id: string;
  artifactRef: Record<string, unknown>;
  approvalStatus: "pending" | "approved" | "rejected";
  comment: string | null;
  businessId: string | null;
  agentId: string | null;
  agentName: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getApprovalDetailForUser(
  approvalId: string,
): Promise<ApprovalDetailRow | null> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const rows = await db
    .select({
      id: approvals.id,
      artifactRef: approvals.artifactRef,
      approvalStatus: approvals.approvalStatus,
      comment: approvals.comment,
      businessId: approvals.businessId,
      agentId: approvals.agentId,
      agentName: agents.name,
      decidedAt: approvals.decidedAt,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    })
    .from(approvals)
    .leftJoin(agents, eq(approvals.agentId, agents.id))
    .where(eq(approvals.id, approvalId))
    .limit(1);

  const row = rows[0];
  if (!row?.businessId) return null;
  await assertUserBusinessAccess(userId, row.businessId);
  return {
    ...row,
    artifactRef: row.artifactRef as Record<string, unknown>,
    approvalStatus: row.approvalStatus,
  };
}

/** Approvals grouped for a 3-column board (pending / approved / rejected). */
export async function listApprovalsGroupedForBusiness(businessId: string): Promise<{
  pending: SerializableApprovalCard[];
  approved: SerializableApprovalCard[];
  rejected: SerializableApprovalCard[];
}> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const rows = await db
    .select({
      id: approvals.id,
      approvalStatus: approvals.approvalStatus,
      artifactRef: approvals.artifactRef,
      createdAt: approvals.createdAt,
      agentId: approvals.agentId,
      agentName: agents.name,
    })
    .from(approvals)
    .leftJoin(agents, eq(approvals.agentId, agents.id))
    .where(
      and(
        eq(approvals.businessId, businessId),
        inArray(approvals.approvalStatus, ["pending", "approved", "rejected"]),
      ),
    )
    .orderBy(desc(approvals.updatedAt))
    .limit(120);

  const pending: SerializableApprovalCard[] = [];
  const approved: SerializableApprovalCard[] = [];
  const rejected: SerializableApprovalCard[] = [];

  for (const r of rows) {
    const item: SerializableApprovalCard = {
      id: r.id,
      artifactRef: r.artifactRef as Record<string, unknown>,
      createdAt: r.createdAt.toISOString(),
      agentId: r.agentId,
      agentName: r.agentName,
    };
    if (r.approvalStatus === "pending") {
      pending.push(item);
    } else if (r.approvalStatus === "approved") {
      approved.push(item);
    } else {
      rejected.push(item);
    }
  }

  return { pending, approved, rejected };
}
