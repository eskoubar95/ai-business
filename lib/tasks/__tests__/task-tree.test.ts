import { describe, expect, it } from "vitest";

import { buildDeleteOrderForSubtree, collectSubtreeIds } from "../task-tree";

describe("task-tree helpers", () => {
  const edges = [
    { id: "root", parentTaskId: null },
    { id: "c1", parentTaskId: "root" },
    { id: "c2", parentTaskId: "root" },
    { id: "gc", parentTaskId: "c1" },
  ];

  it("collectSubtreeIds includes root and all descendants", () => {
    const ids = collectSubtreeIds("root", edges);
    expect(new Set(ids)).toEqual(new Set(["root", "c1", "c2", "gc"]));
  });

  it("buildDeleteOrderForSubtree deletes deeper nodes before ancestors", () => {
    const subtree = collectSubtreeIds("root", edges);
    const order = buildDeleteOrderForSubtree("root", subtree, edges);
    const rootIdx = order.indexOf("root");
    const gcIdx = order.indexOf("gc");
    const c1Idx = order.indexOf("c1");
    expect(gcIdx).toBeLessThan(c1Idx);
    expect(c1Idx).toBeLessThan(rootIdx);
  });
});
