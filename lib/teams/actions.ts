"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { getDb } from "@/db/index";
import { teamMembers, teams } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { and, asc, eq } from "drizzle-orm";

async function requireTeamAccess(teamId: string): Promise<{
  team: typeof teams.$inferSelect;
}> {
  const db = getDb();
  const userId = await requireSessionUserId();
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });
  if (!team) throw new Error("Team not found");
  await assertUserBusinessAccess(userId, team.businessId);
  return { team };
}

export async function createTeam(params: {
  businessId: string;
  name: string;
  leadAgentId: string;
}) {
  const { businessId, name, leadAgentId } = params;
  const nm = name.trim();
  if (!nm) throw new Error("Team name is required");

  const db = getDb();
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const leader = await assertUserOwnsAgent(leadAgentId);
  if (leader.businessId !== businessId) {
    throw new Error("Lead agent must belong to this business");
  }

  // Neon HTTP driver (`drizzle-orm/neon-http`) does not support `db.transaction()`.
  const [teamRow] = await db
    .insert(teams)
    .values({
      businessId,
      name: nm,
      leadAgentId,
    })
    .returning();

  if (!teamRow) throw new Error("Failed to create team");

  try {
    await db.insert(teamMembers).values({
      teamId: teamRow.id,
      agentId: leadAgentId,
      sortOrder: 0,
    });
  } catch (err) {
    await db.delete(teams).where(eq(teams.id, teamRow.id));
    throw err;
  }

  return teamRow;
}

export async function addTeamMember(teamId: string, agentId: string): Promise<void> {
  const { team } = await requireTeamAccess(teamId);
  const owned = await assertUserOwnsAgent(agentId);
  if (owned.businessId !== team.businessId) throw new Error("Agent must belong to same business");

  const db = getDb();
  await db.insert(teamMembers).values({
    teamId,
    agentId,
    sortOrder: 999,
  }).onConflictDoNothing();
}

export async function removeTeamMember(teamId: string, agentId: string): Promise<void> {
  const { team } = await requireTeamAccess(teamId);

  if (team.leadAgentId === agentId) {
    throw new Error("Cannot remove the team lead before reassigning lead");
  }

  const db = getDb();
  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.agentId, agentId)));
}

export async function setTeamLead(teamId: string, leadAgentId: string): Promise<void> {
  const { team } = await requireTeamAccess(teamId);
  const owned = await assertUserOwnsAgent(leadAgentId);
  if (owned.businessId !== team.businessId) throw new Error("Agent must belong to same business");

  const db = getDb();
  const memberRow = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.agentId, leadAgentId)),
  });
  if (!memberRow) {
    throw new Error("Lead agent must already be a team member");
  }

  await db
    .update(teams)
    .set({
      leadAgentId,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function listTeamsByBusiness(businessId: string) {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
  const db = getDb();
  return db.query.teams.findMany({
    where: eq(teams.businessId, businessId),
    orderBy: [asc(teams.name)],
    with: {
      leadAgent: true,
      members: true,
    },
  });
}

export async function updateTeamName(teamId: string, name: string): Promise<void> {
  const nm = name.trim();
  if (!nm) throw new Error("Team name is required");
  await requireTeamAccess(teamId);
  const db = getDb();
  await db
    .update(teams)
    .set({ name: nm, updatedAt: new Date() })
    .where(eq(teams.id, teamId));
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { team } = await requireTeamAccess(teamId);
  const db = getDb();
  await db.delete(teams).where(eq(teams.id, team.id));
}

export async function getTeamWithMembers(teamId: string) {
  await requireTeamAccess(teamId);

  const db = getDb();
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      leadAgent: true,
      members: {
        with: {
          agent: true,
        },
        orderBy: (tm, { asc: ascTm }) => [ascTm(tm.sortOrder)],
      },
    },
  });
}
