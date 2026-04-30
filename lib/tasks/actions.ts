"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { getDb } from "@/db/index";
import { approvals, tasks } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { asc, eq, inArray } from "drizzle-orm";

import {
  buildDeleteOrderForSubtree,
  collectSubtreeIds,
  type TaskRow,
} from "./task-tree";

export type TaskStatus = (typeof tasks.$inferSelect)["status"];

export type TaskTreeNode = TaskRow & { children: TaskTreeNode[] };
export type { TaskRow };

async function assertTaskInBusinessForUser(taskId: string): Promise<TaskRow> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task) throw new Error("Task not found");
  await assertUserBusinessAccess(userId, task.businessId);
  return task;
}

async function assertParentInSameBusiness(
  businessId: string,
  parentTaskId: string | null | undefined,
): Promise<void> {
  if (!parentTaskId) return;
  const db = getDb();
  const parent = await db.query.tasks.findFirst({
    where: eq(tasks.id, parentTaskId),
    columns: { businessId: true },
  });
  if (!parent || parent.businessId !== businessId) {
    throw new Error("Parent task must belong to the same business");
  }
}

async function assertApprovalInBusiness(businessId: string, approvalId: string): Promise<void> {
  const db = getDb();
  const appr = await db.query.approvals.findFirst({
    where: eq(approvals.id, approvalId),
    columns: { businessId: true },
  });
  if (!appr?.businessId || appr.businessId !== businessId) {
    throw new Error("Approval not found for this business");
  }
}

export async function createTask(
  businessId: string,
  input: {
    title: string;
    description?: string;
    teamId?: string | null;
    agentId?: string | null;
    parentTaskId?: string | null;
  },
): Promise<{ id: string }> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  await assertParentInSameBusiness(businessId, input.parentTaskId ?? null);

  const db = getDb();
  const [row] = await db
    .insert(tasks)
    .values({
      businessId,
      title,
      description: (input.description ?? "").trim(),
      teamId: input.teamId ?? null,
      agentId: input.agentId ?? null,
      parentTaskId: input.parentTaskId ?? null,
      status: "backlog",
    })
    .returning({ id: tasks.id });

  if (!row) throw new Error("Failed to create task");
  return row;
}

export async function updateTask(
  taskId: string,
  patch: {
    title?: string;
    description?: string;
    agentId?: string | null;
    teamId?: string | null;
    parentTaskId?: string | null;
  },
): Promise<void> {
  const task = await assertTaskInBusinessForUser(taskId);
  const db = getDb();

  if (patch.parentTaskId !== undefined && patch.parentTaskId !== null) {
    if (patch.parentTaskId === taskId) throw new Error("Task cannot be its own parent");
    await assertParentInSameBusiness(task.businessId, patch.parentTaskId);
  }

  const updates: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) throw new Error("Title is required");
    updates.title = t;
  }
  if (patch.description !== undefined) updates.description = patch.description.trim();
  if (patch.agentId !== undefined) updates.agentId = patch.agentId;
  if (patch.teamId !== undefined) updates.teamId = patch.teamId;
  if (patch.parentTaskId !== undefined) updates.parentTaskId = patch.parentTaskId;

  await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  opts?: { blockedReason?: string | null; approvalId?: string | null },
): Promise<void> {
  const task = await assertTaskInBusinessForUser(taskId);
  const db = getDb();

  const updates: Partial<typeof tasks.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "blocked") {
    updates.blockedReason = opts?.blockedReason?.trim() || null;
  } else {
    updates.blockedReason = null;
  }

  if (status === "in_review") {
    const approvalId = opts?.approvalId ?? null;
    if (approvalId) {
      await assertApprovalInBusiness(task.businessId, approvalId);
    }
    updates.approvalId = approvalId;
  } else {
    updates.approvalId = null;
  }

  await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await assertTaskInBusinessForUser(taskId);
  const db = getDb();

  const allInBusiness = await db.query.tasks.findMany({
    where: eq(tasks.businessId, task.businessId),
    columns: { id: true, parentTaskId: true },
  });

  const subtree = collectSubtreeIds(taskId, allInBusiness);
  const deleteOrder = buildDeleteOrderForSubtree(taskId, subtree, allInBusiness);

  await db.delete(tasks).where(inArray(tasks.id, deleteOrder));
}

export async function getTasksByBusiness(businessId: string): Promise<TaskTreeNode[]> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const rows = await db.query.tasks.findMany({
    where: eq(tasks.businessId, businessId),
    orderBy: [asc(tasks.createdAt)],
  });

  return buildTree(rows);
}

export async function getTasksByAgent(agentId: string): Promise<TaskRow[]> {
  await assertUserOwnsAgent(agentId);
  const db = getDb();
  return db.query.tasks.findMany({
    where: eq(tasks.agentId, agentId),
    orderBy: [asc(tasks.updatedAt)],
  });
}

function buildTree(rows: TaskRow[]): TaskTreeNode[] {
  const map = new Map<string, TaskTreeNode>();
  for (const r of rows) {
    map.set(r.id, { ...r, children: [] });
  }

  const roots: TaskTreeNode[] = [];
  for (const r of rows) {
    const node = map.get(r.id)!;
    const pid = r.parentTaskId;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
