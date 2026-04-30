import type { TaskTreeNode } from "./actions";
import type { TaskRow } from "./task-tree";

/** Depth-first flatten of `getTasksByBusiness` tree nodes into plain task rows. */
export function flattenTaskTree(nodes: TaskTreeNode[]): TaskRow[] {
  const out: TaskRow[] = [];

  function walk(n: TaskTreeNode): void {
    const { children, ...row } = n;
    out.push(row);
    for (const c of children) walk(c);
  }

  for (const root of nodes) walk(root);
  return out;
}
