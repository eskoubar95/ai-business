"use server";

import { count, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/index";
import { projects, approvals, sprints, tasks } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { requireSessionUserId } from "@/lib/roster/session";

async function ensureBusiness(businessId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
}

export async function createProject(params: {
  businessId: string;
  name: string;
  prd?: string;
  status?: "draft" | "active" | "completed" | "archived";
}): Promise<{ id: string }> {
  await ensureBusiness(params.businessId);
  const db = getDb();
  const nm = params.name.trim();
  if (!nm) throw new Error("Project name is required");

  const [row] = await db
    .insert(projects)
    .values({
      businessId: params.businessId,
      name: nm,
      prd: params.prd ?? "",
      status: params.status ?? "draft",
      updatedAt: new Date(),
    })
    .returning({ id: projects.id });
  if (!row) throw new Error("Failed to create project");
  return row;
}

export async function updateProject(
  projectId: string,
  patch: Partial<{
    name: string;
    prd: string;
    status: string;
    notionId: string | null;
  }>,
): Promise<void> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Project not found");
  await assertUserBusinessAccess(userId, existing.businessId);

  const payload: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
  if (patch.name !== undefined) {
    const nm = patch.name.trim();
    if (!nm) throw new Error("Project name is required");
    payload.name = nm;
  }
  if (patch.prd !== undefined) payload.prd = patch.prd;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.notionId !== undefined) payload.notionId = patch.notionId;

  await db.update(projects).set(payload).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: string): Promise<void> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { businessId: true },
  });
  if (!existing) throw new Error("Project not found");
  await assertUserBusinessAccess(userId, existing.businessId);
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function listProjectsOverview(businessId: string) {
  await ensureBusiness(businessId);
  const db = getDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.businessId, businessId))
    .orderBy(desc(projects.updatedAt));

  if (rows.length === 0) return rows.map((r) => ({ ...r, sprintCount: 0, taskCount: 0 }));

  const ids = rows.map((r) => r.id);
  const sprintRows = await db
    .select({ projectId: sprints.projectId, n: count() })
    .from(sprints)
    .where(inArray(sprints.projectId, ids))
    .groupBy(sprints.projectId);
  const sprintMap = new Map(sprintRows.map((s) => [s.projectId, Number(s.n)]));

  const taskRows = await db
    .select({ projectId: tasks.projectId, n: count() })
    .from(tasks)
    .where(inArray(tasks.projectId, ids))
    .groupBy(tasks.projectId);
  const taskMap = new Map(
    taskRows.filter((t) => t.projectId != null).map((t) => [t.projectId!, Number(t.n)]),
  );

  return rows.map((r) => ({
    ...r,
    sprintCount: sprintMap.get(r.id) ?? 0,
    taskCount: taskMap.get(r.id) ?? 0,
  }));
}

export async function getProjectBundle(projectId: string) {
  const userId = await requireSessionUserId();
  const db = getDb();
  const proj = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      sprintsMany: {
        orderBy: (sp, { asc }) => [asc(sp.createdAt)],
      },
    },
  });
  if (!proj) throw new Error("Project not found");
  await assertUserBusinessAccess(userId, proj.businessId);

  const taskRows = await db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
    columns: {
      id: true,
      title: true,
      status: true,
      sprintId: true,
      priority: true,
      storyPoints: true,
    },
  });

  const approvalsAll = await db.query.approvals.findMany({
    where: eq(approvals.businessId, proj.businessId),
    orderBy: (a, { desc: d }) => [d(a.createdAt)],
    limit: 120,
    columns: {
      id: true,
      artifactRef: true,
      approvalStatus: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      agentId: true,
      businessId: true,
      decidedAt: true,
    },
  });
  const approvalsRows = approvalsAll.filter((a) => {
    const ref = a.artifactRef as Record<string, unknown>;
    return ref?.kind === "project" && ref?.projectId === projectId;
  });

  return { project: proj, tasks: taskRows, approvals: approvalsRows };
}
