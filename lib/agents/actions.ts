"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { agentDocuments, agents, teams } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { and, asc, eq } from "drizzle-orm";

import { validateReportsToForBusiness } from "./reports-cycle";

/** Agent row with soul markdown exposed as `instructions` for existing UI contracts. */
export type AgentWithInstructions = typeof agents.$inferSelect & {
  instructions: string;
};

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

  const created = await db.transaction(async (tx) => {
    const [agentRow] = await tx
      .insert(agents)
      .values({
        businessId,
        name: trimmedName,
        role: trimmedRole,
        reportsToAgentId: validatedReports,
      })
      .returning();

    if (!agentRow) throw new Error("Failed to create agent");

    await tx.insert(agentDocuments).values([
      {
        agentId: agentRow.id,
        slug: "soul",
        filename: "soul.md",
        content: trimmedInstructions,
      },
      {
        agentId: agentRow.id,
        slug: "tools",
        filename: "tools.md",
        content: "",
      },
      {
        agentId: agentRow.id,
        slug: "heartbeat",
        filename: "heartbeat.md",
        content: "",
      },
    ]);

    return agentRow;
  });

  return { ...created, instructions: trimmedInstructions };
}

export async function updateAgent(
  agentId: string,
  patch: Partial<
    Pick<typeof agents.$inferSelect, "name" | "role" | "reportsToAgentId"> & {
      instructions?: string;
    }
  >,
) {
  await assertUserOwnsAgent(agentId);

  const db = getDb();
  const existing = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Agent not found");

  const payload: Partial<typeof agents.$inferInsert> = {};

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
  if (patch.reportsToAgentId !== undefined) {
    const validated = await validateReportsToForBusiness(
      existing.businessId,
      agentId,
      patch.reportsToAgentId ?? null,
    );
    payload.reportsToAgentId = validated;
  }

  const shouldPatchAgentRow =
    patch.name !== undefined || patch.role !== undefined || patch.reportsToAgentId !== undefined;

  return db.transaction(async (tx) => {
    if (patch.instructions !== undefined) {
      const ins = patch.instructions.trim();
      if (!ins) throw new Error("Instructions are required");
      await tx
        .update(agentDocuments)
        .set({ content: ins, updatedAt: new Date() })
        .where(and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, "soul")));
    }

    let updated: typeof agents.$inferSelect | undefined;
    if (shouldPatchAgentRow) {
      payload.updatedAt = new Date();
      const rows = await tx.update(agents).set(payload).where(eq(agents.id, agentId)).returning();
      updated = rows[0];
    } else {
      updated = await tx.query.agents.findFirst({
        where: eq(agents.id, agentId),
      });
    }

    if (!updated) throw new Error("Agent not found");

    const soulRows = await tx.query.agentDocuments.findMany({
      where: and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, "soul")),
      columns: { content: true },
    });
    const soulContent = soulRows[0]?.content ?? "";

    return { ...updated, instructions: soulContent };
  });
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

export async function getAgentsByBusiness(businessId: string): Promise<AgentWithInstructions[]> {
  await ensureBusinessMembership(businessId);
  const db = getDb();
  const rows = await db.query.agents.findMany({
    where: eq(agents.businessId, businessId),
    orderBy: [asc(agents.name)],
    with: {
      documents: {
        where: eq(agentDocuments.slug, "soul"),
        columns: { slug: true, content: true },
      },
    },
  });

  return rows.map((r) => {
    const soulContent = r.documents.find((d) => d.slug === "soul")?.content ?? "";
    const { documents: _documents, ...agent } = r;
    return { ...agent, instructions: soulContent };
  });
}
