import { randomUUID } from "node:crypto";
import { getDb } from "@/db/index";
import { agentJobs, runpodInstances } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { asc, count, eq } from "drizzle-orm";
import { createRunpodClientFromEnv } from "@/runner/runpod/client";
import { getOrCreateDefaultRunpodInstance, onJobEnqueued } from "@/runner/runpod/state-machine";

export type AgentJobRow = InferSelectModel<typeof agentJobs>;
export type ExecutionAdapter = AgentJobRow["adapter"];
export type AgentJobStatus = AgentJobRow["status"];

/** Pure fair-share: rotate across businesses by oldest-first ordering within each business. */
export function pickFairShareJob<T extends { businessId: string; enqueuedAt: Date }>(
  queued: T[],
  lastBusinessId: string | null,
): T | null {
  if (queued.length === 0) {
    return null;
  }
  const byBiz = new Map<string, T[]>();
  for (const j of queued) {
    if (!byBiz.has(j.businessId)) {
      byBiz.set(j.businessId, []);
    }
    byBiz.get(j.businessId)!.push(j);
  }
  for (const list of byBiz.values()) {
    list.sort((a, b) => a.enqueuedAt.getTime() - b.enqueuedAt.getTime());
  }
  const orgs = [...byBiz.keys()].sort(
    (a, b) => byBiz.get(a)![0].enqueuedAt.getTime() - byBiz.get(b)![0].enqueuedAt.getTime(),
  );
  if (!lastBusinessId || !orgs.includes(lastBusinessId)) {
    return byBiz.get(orgs[0])![0];
  }
  const idx = orgs.indexOf(lastBusinessId);
  const nextOrg = orgs[(idx + 1) % orgs.length];
  return byBiz.get(nextOrg)![0];
}

export type EnqueueAgentJobInput = {
  businessId: string;
  agentSlug: string;
  adapter: ExecutionAdapter;
  payload: Record<string, unknown>;
  correlationId?: string;
  fromRole?: string;
  toRole?: string;
  metadata?: Record<string, unknown>;
};

export async function enqueueAgentJob(input: EnqueueAgentJobInput, db = getDb()): Promise<AgentJobRow> {
  const correlationId = input.correlationId ?? randomUUID();

  const [row] = await db
    .insert(agentJobs)
    .values({
      businessId: input.businessId,
      agentSlug: input.agentSlug,
      adapter: input.adapter,
      payload: input.payload,
      correlationId,
      fromRole: input.fromRole,
      toRole: input.toRole,
      metadata: input.metadata,
    })
    .returning();

  await onJobEnqueued({ db, client: createRunpodClientFromEnv() });

  return row;
}

export async function fairShareNext(db = getDb()): Promise<AgentJobRow | null> {
  const queued = await db
    .select()
    .from(agentJobs)
    .where(eq(agentJobs.status, "queued"))
    .orderBy(asc(agentJobs.enqueuedAt));

  if (queued.length === 0) {
    return null;
  }

  const inst = await getOrCreateDefaultRunpodInstance(db);
  const lastId = inst.lastFairShareBusinessId ?? null;

  const pick = pickFairShareJob(queued, lastId);
  if (!pick) {
    return null;
  }

  await db
    .update(runpodInstances)
    .set({
      lastFairShareBusinessId: pick.businessId,
      updatedAt: new Date(),
    })
    .where(eq(runpodInstances.id, inst.id));

  return pick;
}

export async function markInflight(jobId: string, db = getDb(), at: Date = new Date()): Promise<void> {
  await db
    .update(agentJobs)
    .set({ status: "inflight", startedAt: at })
    .where(eq(agentJobs.id, jobId));
}

export async function markDone(
  jobId: string,
  output: string,
  db = getDb(),
  at: Date = new Date(),
): Promise<void> {
  await db
    .update(agentJobs)
    .set({ status: "done", output, completedAt: at })
    .where(eq(agentJobs.id, jobId));
}

export async function markFailed(
  jobId: string,
  message: string,
  db = getDb(),
  at: Date = new Date(),
): Promise<void> {
  await db
    .update(agentJobs)
    .set({ status: "failed", output: message, completedAt: at })
    .where(eq(agentJobs.id, jobId));
}

export async function countQueuedJobs(db = getDb()): Promise<number> {
  const [row] = await db.select({ n: count() }).from(agentJobs).where(eq(agentJobs.status, "queued"));
  return Number(row?.n ?? 0);
}
