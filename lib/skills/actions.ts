"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { agentSkills, agents, skills } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { and, asc, eq } from "drizzle-orm";

async function ensureBusinessMembership(businessId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
}

async function skillRowForBusiness(skillId: string, businessId: string) {
  const db = getDb();
  const row = await db.query.skills.findFirst({
    where: and(eq(skills.id, skillId), eq(skills.businessId, businessId)),
  });
  return row;
}

export async function createSkill(params: {
  businessId: string;
  name: string;
  markdown: string;
}) {
  const { businessId, name, markdown } = params;
  const nm = name.trim();
  const md = markdown.trim();
  if (!nm) throw new Error("Skill name is required");
  await ensureBusinessMembership(businessId);
  const db = getDb();
  const [row] = await db
    .insert(skills)
    .values({
      businessId,
      name: nm,
      markdown: md.length ? md : "",
    })
    .returning();
  if (!row) throw new Error("Failed to create skill");
  return row;
}

export async function updateSkill(
  skillId: string,
  patch: Partial<Pick<typeof skills.$inferSelect, "name" | "markdown">>,
) {
  const db = getDb();
  const userId = await requireSessionUserId();
  const existing = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Skill not found");
  await assertUserBusinessAccess(userId, existing.businessId);

  const payload: Partial<typeof skills.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) {
    const nm = patch.name.trim();
    if (!nm) throw new Error("Skill name is required");
    payload.name = nm;
  }
  if (patch.markdown !== undefined) {
    payload.markdown = patch.markdown.trim();
  }

  const [updated] = await db.update(skills).set(payload).where(eq(skills.id, skillId)).returning();
  if (!updated) throw new Error("Skill not found");
  return updated;
}

export async function deleteSkill(skillId: string): Promise<void> {
  const db = getDb();
  const userId = await requireSessionUserId();
  const existing = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Skill not found");
  await assertUserBusinessAccess(userId, existing.businessId);
  await db.delete(skills).where(eq(skills.id, skillId));
}

export async function attachSkillToAgent(agentId: string, skillId: string) {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const skill = await skillRowForBusiness(skillId, businessId);
  if (!skill) throw new Error("Skill not found in business");

  const db = getDb();
  await db.insert(agentSkills).values({ agentId, skillId }).onConflictDoNothing();
}

export async function detachSkillFromAgent(agentId: string, skillId: string): Promise<void> {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const skill = await skillRowForBusiness(skillId, businessId);
  if (!skill) throw new Error("Skill not found in business");

  const db = getDb();
  await db.delete(agentSkills).where(
    and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)),
  );
}

export async function listSkillsByBusiness(businessId: string) {
  await ensureBusinessMembership(businessId);
  const db = getDb();
  return db.query.skills.findMany({
    where: eq(skills.businessId, businessId),
    orderBy: [asc(skills.name)],
  });
}

export async function getSkillsByAgent(agentId: string) {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const db = getDb();

  const links = await db.query.agentSkills.findMany({
    where: eq(agentSkills.agentId, agentId),
    with: {
      skill: true,
    },
  });

  return links
    .map((link) => link.skill)
    .filter((row): row is NonNullable<(typeof links)[number]["skill"]> => row !== null && row.businessId === businessId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
