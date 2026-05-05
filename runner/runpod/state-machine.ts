import { getDb } from "@/db/index";
import { agentJobs, runpodInstanceStateEnum, runpodInstances } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { createRunpodClientFromEnv, type RunpodClient } from "./client";

export type RunpodInstanceState = (typeof runpodInstanceStateEnum.enumValues)[number];

export const SHUTDOWN_IDLE_MS = 7 * 60 * 1000;

export function shouldShutdownReady(params: {
  queueEmpty: boolean;
  inFlightEmpty: boolean;
  elapsedSinceLastActivityMs: number;
  gpuIdleSignalsOk?: boolean;
}): boolean {
  return (
    params.queueEmpty &&
    params.inFlightEmpty &&
    (params.gpuIdleSignalsOk ?? true) &&
    params.elapsedSinceLastActivityMs >= SHUTDOWN_IDLE_MS
  );
}

export function evaluateShutdownTick(params: {
  state: RunpodInstanceState;
  queueDepth: number;
  inFlightDepth: number;
  lastActivityAtMs: number;
  nowMs: number;
}): { action: "none" } | { action: "shutdown" } {
  if (params.state !== "warm") {
    return { action: "none" };
  }
  const ok = shouldShutdownReady({
    queueEmpty: params.queueDepth === 0,
    inFlightEmpty: params.inFlightDepth === 0,
    elapsedSinceLastActivityMs: params.nowMs - params.lastActivityAtMs,
  });
  return ok ? { action: "shutdown" } : { action: "none" };
}

export async function getOrCreateDefaultRunpodInstance(db = getDb(), slug = "default") {
  const existing = await db.select().from(runpodInstances).where(eq(runpodInstances.slug, slug)).limit(1);
  if (existing[0]) {
    return existing[0];
  }
  const inserted = await db.insert(runpodInstances).values({ slug }).returning();
  return inserted[0];
}

export async function countAgentJobsByStatus(
  status: "queued" | "inflight" | "done" | "failed",
  db = getDb(),
): Promise<number> {
  const [row] = await db.select({ n: count() }).from(agentJobs).where(eq(agentJobs.status, status));
  return Number(row?.n ?? 0);
}

/** After a new job is persisted: wake RunPod from `cold`, or bump activity while warm. */
export async function onJobEnqueued(
  deps: {
    db?: ReturnType<typeof getDb>;
    client?: RunpodClient;
    now?: Date;
  } = {},
): Promise<void> {
  const db = deps.db ?? getDb();
  const client = deps.client ?? createRunpodClientFromEnv();
  const now = deps.now ?? new Date();
  const inst = await getOrCreateDefaultRunpodInstance(db);

  if (inst.state === "cold") {
    await db
      .update(runpodInstances)
      .set({ state: "warming", lastActivityAt: now, updatedAt: now })
      .where(eq(runpodInstances.id, inst.id));
    await client.startInstance();
    const endpointUrl = process.env.RUNPOD_ENDPOINT?.trim() || inst.endpointUrl;
    await db
      .update(runpodInstances)
      .set({
        state: "warm",
        lastActivityAt: now,
        updatedAt: now,
        endpointUrl: endpointUrl ?? null,
      })
      .where(eq(runpodInstances.id, inst.id));
    return;
  }

  await db
    .update(runpodInstances)
    .set({ lastActivityAt: now, updatedAt: now })
    .where(eq(runpodInstances.id, inst.id));
}

/** Mark activity (e.g. job started or finished) to reset idle shutdown timer. */
export async function recordRunpodActivity(db = getDb(), at: Date = new Date()): Promise<void> {
  const inst = await getOrCreateDefaultRunpodInstance(db);
  await db
    .update(runpodInstances)
    .set({ lastActivityAt: at, updatedAt: at })
    .where(eq(runpodInstances.id, inst.id));
}

export type ShutdownTickDeps = {
  db?: ReturnType<typeof getDb>;
  client?: RunpodClient;
  /** Wall clock ms (inject for tests). */
  nowMs?: () => number;
};

/**
 * When queue and in-flight are empty and idle time exceeds threshold, stop RunPod and return to `cold`.
 */
export async function maybeShutdownTick(deps: ShutdownTickDeps = {}): Promise<void> {
  const db = deps.db ?? getDb();
  const client = deps.client ?? createRunpodClientFromEnv();
  const nowMs = deps.nowMs ?? (() => Date.now());

  const inst = await getOrCreateDefaultRunpodInstance(db);
  const q = await countAgentJobsByStatus("queued", db);
  const infl = await countAgentJobsByStatus("inflight", db);
  const decision = evaluateShutdownTick({
    state: inst.state,
    queueDepth: q,
    inFlightDepth: infl,
    lastActivityAtMs: inst.lastActivityAt.getTime(),
    nowMs: nowMs(),
  });

  if (decision.action === "none") {
    return;
  }

  const t = new Date(nowMs());
  await db
    .update(runpodInstances)
    .set({ state: "draining", updatedAt: t })
    .where(eq(runpodInstances.id, inst.id));

  await client.stopInstance();

  await db
    .update(runpodInstances)
    .set({ state: "idle", updatedAt: new Date(nowMs()) })
    .where(eq(runpodInstances.id, inst.id));

  await db
    .update(runpodInstances)
    .set({ state: "cold", updatedAt: new Date(nowMs()) })
    .where(eq(runpodInstances.id, inst.id));
}

/** Warm-up completion if start is handled asynchronously; moves `warming` → `warm`. */
export async function markRunpodWarm(db = getDb(), at: Date = new Date()): Promise<void> {
  const inst = await getOrCreateDefaultRunpodInstance(db);
  await db
    .update(runpodInstances)
    .set({
      state: "warm",
      lastActivityAt: at,
      updatedAt: at,
      endpointUrl: process.env.RUNPOD_ENDPOINT?.trim() || inst.endpointUrl,
    })
    .where(and(eq(runpodInstances.id, inst.id), eq(runpodInstances.state, "warming")));
}
