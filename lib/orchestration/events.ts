import { getDb } from "@/db/index";
import { orchestrationEvents } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export type AgentLifecycleStatus = "idle" | "working" | "awaiting_approval";

export type LogOrchestrationEventInput = {
  type: string;
  businessId: string | null;
  payload: Record<string, unknown>;
  status?: "pending" | "processing" | "succeeded" | "failed";
  correlationId?: string | null;
  correlationKey?: string | null;
};

/** Inserts a row into `orchestration_events`. Returns the new id. */
export async function logEvent(input: LogOrchestrationEventInput): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(orchestrationEvents)
    .values({
      businessId: input.businessId,
      type: input.type,
      payload: input.payload,
      status: input.status ?? "succeeded",
      correlationId: input.correlationId ?? null,
      correlationKey: input.correlationKey ?? null,
    })
    .returning({ id: orchestrationEvents.id });

  if (!row) throw new Error("Failed to log orchestration event");
  return row.id;
}

/** Persist canonical agent UI status derived by `getAgentStatus`. */
export async function logAgentLifecycleStatus(
  businessId: string,
  agentId: string,
  status: AgentLifecycleStatus,
  extra?: Record<string, unknown>,
): Promise<void> {
  await logEvent({
    type: "agent.lifecycle",
    businessId,
    payload: {
      agentId,
      lifecycleStatus: status,
      ...extra,
    },
    status: "succeeded",
  });
}

/**
 * Reads the latest orchestration payload that carries `lifecycleStatus` for this agent.
 * Defaults to `idle` when no lifecycle rows exist.
 */
export async function getAgentStatus(agentId: string): Promise<AgentLifecycleStatus> {
  const db = getDb();
  const rows = await db
    .select({
      payload: orchestrationEvents.payload,
    })
    .from(orchestrationEvents)
    .where(sql`${orchestrationEvents.payload}->>'agentId' = ${agentId}`)
    .orderBy(desc(orchestrationEvents.createdAt))
    .limit(50);

  for (const row of rows) {
    const p = row.payload as Record<string, unknown>;
    const ls = p.lifecycleStatus;
    if (ls === "idle" || ls === "working" || ls === "awaiting_approval") {
      return ls;
    }
  }

  return "idle";
}
