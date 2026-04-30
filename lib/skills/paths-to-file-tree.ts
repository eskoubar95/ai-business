import type { FileTreeNode } from "@/components/ui/file-tree";

/** Turn storage paths like `docs/foo.md` into a nested `FileTree` structure. */
export function pathsToFileTreeNodes(paths: string[]): FileTreeNode[] {
  const rootChildren: FileTreeNode[] = [];

  function findOrCreate(
    level: FileTreeNode[],
    name: string,
    fullPath: string,
    isFile: boolean,
  ): FileTreeNode {
    let node = level.find((c) => c.name === name);
    if (!node) {
      node = isFile ? { id: fullPath, name } : { id: fullPath, name, children: [] };
      level.push(node);
      return node;
    }
    if (!isFile && !node.children) {
      node.children = [];
    }
    return node;
  }

  const sortedPaths = [...paths].sort((a, b) => a.localeCompare(b));
  for (const path of sortedPaths) {
    const parts = path.split("/").filter(Boolean);
    let level = rootChildren;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      const node = findOrCreate(level, part, acc, isFile);
      if (!isFile) {
        if (!node.children) node.children = [];
        level = node.children;
      }
    }
  }

  function sortLevel(nodes: FileTreeNode[]): FileTreeNode[] {
    return [...nodes]
      .map((n) => ({
        ...n,
        children: n.children ? sortLevel(n.children) : undefined,
      }))
      .sort((a, b) => {
        const aDir = Boolean(a.children);
        const bDir = Boolean(b.children);
        if (aDir !== bDir) return aDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  return sortLevel(rootChildren);
}
