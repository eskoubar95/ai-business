"use server";

import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db/index";
import { projects, sprints } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";

async function assertProjectAccessForSprint(projectId: string): Promise<void> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const p = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { businessId: true },
  });
  if (!p) throw new Error("Project not found");
  await assertUserBusinessAccess(userId, p.businessId);
}

async function assertSprintAccess(sprintId: string): Promise<string> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const sp = await db.query.sprints.findFirst({
    where: eq(sprints.id, sprintId),
    columns: { projectId: true },
    with: {
      project: { columns: { businessId: true } },
    },
  });
  if (!sp?.project) throw new Error("Sprint not found");
  await assertUserBusinessAccess(userId, sp.project.businessId);
  return sp.projectId;
}

export async function createSprint(projectId: string, data: { name: string; goal?: string }) {
  await assertProjectAccessForSprint(projectId);
  const nm = data.name.trim();
  if (!nm) throw new Error("Sprint name is required");
  const db = getDb();
  const [row] = await db
    .insert(sprints)
    .values({
      projectId,
      name: nm,
      goal: data.goal?.trim() || null,
    })
    .returning({ id: sprints.id });
  if (!row) throw new Error("Failed to create sprint");
  return row;
}

export async function updateSprint(
  sprintId: string,
  patch: Partial<{
    name: string;
    goal: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
  }>,
): Promise<void> {
  await assertSprintAccess(sprintId);
  const db = getDb();
  const payload: Partial<typeof sprints.$inferInsert> = {};
  if (patch.name !== undefined) {
    const nm = patch.name.trim();
    if (!nm) throw new Error("Sprint name is required");
    payload.name = nm;
  }
  if (patch.goal !== undefined) payload.goal = patch.goal;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.startDate !== undefined) payload.startDate = patch.startDate;
  if (patch.endDate !== undefined) payload.endDate = patch.endDate;
  await db.update(sprints).set(payload).where(eq(sprints.id, sprintId));
}

export async function deleteSprint(sprintId: string): Promise<void> {
  await assertSprintAccess(sprintId);
  const db = getDb();
  await db.delete(sprints).where(eq(sprints.id, sprintId));
}

/** Sets one sprint `active`; other sprints on the project become `planning` (unless `completed`). */
export async function activateSprint(sprintId: string): Promise<void> {
  const projectId = await assertSprintAccess(sprintId);
  const db = getDb();
  await db
    .update(sprints)
    .set({ status: "planning" })
    .where(
      and(
        eq(sprints.projectId, projectId),
        ne(sprints.id, sprintId),
        ne(sprints.status, "completed"),
      ),
    );
  await db.update(sprints).set({ status: "active" }).where(eq(sprints.id, sprintId));
}
