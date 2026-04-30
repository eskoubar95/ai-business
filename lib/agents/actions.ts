"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { agents, teams } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { asc, eq } from "drizzle-orm";

import { validateReportsToForBusiness } from "./reports-cycle";

async function ensureBusinessMembership(businessId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
}

export async function assertUserOwnsAgent(agentId: string): Promise<{
  userId: string;
  businessId: string;
}> {
  const db = getDb();
  const userId = await requireSessionUserId();
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    columns: { businessId: true },
  });
  if (!agent) throw new Error("Forbidden");
  await assertUserBusinessAccess(userId, agent.businessId);
  return { userId, businessId: agent.businessId };
}

export async function createAgent(params: {
  businessId: string;
  name: string;
  role: string;
  instructions: string;
  reportsToAgentId?: string | null;
}) {
  const { businessId, name, role, instructions, reportsToAgentId } = params;
  const trimmedName = name.trim();
  const trimmedRole = role.trim();
  const trimmedInstructions = instructions.trim();
  if (!trimmedName) throw new Error("Agent name is required");
  if (!trimmedRole) throw new Error("Agent role is required");
  if (!trimmedInstructions) throw new Error("Instructions are required");

  await ensureBusinessMembership(businessId);
  const db = getDb();
  const validatedReports = await validateReportsToForBusiness(
    businessId,
    null,
    reportsToAgentId,
  );

  const [created] = await db
    .insert(agents)
    .values({
      businessId,
      name: trimmedName,
      role: trimmedRole,
      instructions: trimmedInstructions,
      reportsToAgentId: validatedReports,
    })
    .returning();

  if (!created) throw new Error("Failed to create agent");
  return created;
}

export async function updateAgent(
  agentId: string,
  patch: Partial<
    Pick<typeof agents.$inferSelect, "name" | "role" | "instructions" | "reportsToAgentId">
  >,
) {
  await assertUserOwnsAgent(agentId);

  const db = getDb();
  const existing = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Agent not found");

  const payload: Partial<typeof agents.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (patch.name !== undefined) {
    const nm = patch.name.trim();
    if (!nm) throw new Error("Agent name is required");
    payload.name = nm;
  }
  if (patch.role !== undefined) {
    const rl = patch.role.trim();
    if (!rl) throw new Error("Agent role is required");
    payload.role = rl;
  }
  if (patch.instructions !== undefined) {
    const ins = patch.instructions.trim();
    if (!ins) throw new Error("Instructions are required");
    payload.instructions = ins;
  }
  if (patch.reportsToAgentId !== undefined) {
    const validated = await validateReportsToForBusiness(
      existing.businessId,
      agentId,
      patch.reportsToAgentId ?? null,
    );
    payload.reportsToAgentId = validated;
  }

  const [updated] = await db.update(agents).set(payload).where(eq(agents.id, agentId)).returning();

  if (!updated) throw new Error("Agent not found");
  return updated;
}

export async function deleteAgent(agentId: string): Promise<void> {
  await assertUserOwnsAgent(agentId);
  const db = getDb();

  const blockingTeam = await db.query.teams.findFirst({
    where: eq(teams.leadAgentId, agentId),
    columns: { id: true, name: true },
  });
  if (blockingTeam) {
    throw new Error(
      `Cannot delete agent while they are lead of team "${blockingTeam.name}". Reassign lead first.`,
    );
  }

  await db.delete(agents).where(eq(agents.id, agentId));
}

export async function getAgentsByBusiness(businessId: string) {
  await ensureBusinessMembership(businessId);
  const db = getDb();
  return db.query.agents.findMany({
    where: eq(agents.businessId, businessId),
    orderBy: [asc(agents.name)],
  });
}
