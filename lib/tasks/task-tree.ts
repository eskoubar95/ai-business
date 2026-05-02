import type { tasks } from "@/db/schema";

export type TaskRow = typeof tasks.$inferSelect;

export type TaskStatus = TaskRow["status"];

export type TaskTreeNode = TaskRow & { children: TaskTreeNode[] };

export type TaskEdge = { id: string; parentTaskId: string | null };

/** All task ids in the subtree rooted at `rootId` (including root). */
export function collectSubtreeIds(rootId: string, edges: TaskEdge[]): string[] {
  const childrenByParent = new Map<string | null, string[]>();
  for (const e of edges) {
    const p = e.parentTaskId;
    if (!childrenByParent.has(p)) childrenByParent.set(p, []);
    childrenByParent.get(p)!.push(e.id);
  }

  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    const kids = childrenByParent.get(id);
    if (kids) for (const k of kids) stack.push(k);
  }
  return out;
}

/**
 * Delete order: deepest descendants first so parent rows are removed last
 * (children reference parent via FK; deleting parent would orphan via SET NULL otherwise).
 */
export function buildDeleteOrderForSubtree(
  rootId: string,
  subtreeIds: string[],
  edges: TaskEdge[],
): string[] {
  const idSet = new Set(subtreeIds);
  const depth = new Map<string, number>();

  function dfs(id: string, d: number): void {
    depth.set(id, d);
    for (const e of edges) {
      if (e.parentTaskId === id && idSet.has(e.id)) {
        dfs(e.id, d + 1);
      }
    }
  }

  dfs(rootId, 0);

  const ordered = [...subtreeIds];
  ordered.sort((a, b) => (depth.get(b) ?? 0) - (depth.get(a) ?? 0));
  return ordered;
}
