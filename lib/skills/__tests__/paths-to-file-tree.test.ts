import { describe, expect, it } from "vitest";

import { pathsToFileTreeNodes } from "@/lib/skills/paths-to-file-tree";

describe("pathsToFileTreeNodes", () => {
  it("builds nested folders and sorts directories first", () => {
    const nodes = pathsToFileTreeNodes(["b.md", "a/foo.md", "a/bar.md"]);
    expect(nodes.map((n) => n.name)).toEqual(["a", "b.md"]);
    const a = nodes.find((n) => n.name === "a");
    expect(a?.children?.map((c) => c.name)).toEqual(["bar.md", "foo.md"]);
  });

  it("returns empty for empty paths", () => {
    expect(pathsToFileTreeNodes([])).toEqual([]);
  });
});
