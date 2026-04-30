import { describe, expect, it } from "vitest";

import {
  type HeartbeatPromptContext,
  formatHeartbeatPrompt,
} from "@/lib/heartbeat/prompt-builder.js";

const baseCtx = (): HeartbeatPromptContext => ({
  soul: "## agent soul",
  heartbeatDoc: "## beat",
  archetypeHeartbeatAddendum: "",
  memories: [],
  openTasks: [],
  recentTaskLogs: [],
  pendingApprovals: [],
});

describe("formatHeartbeatPrompt", () => {
  it("includes Soul, Heartbeat, memory, tasks, logs, and approvals sections with CONTEXT separators", () => {
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    const md = formatHeartbeatPrompt({
      soul: "Soul body",
      heartbeatDoc: "Hb body",
      archetypeHeartbeatAddendum: "Archetype extras",
      memories: [{ content: "M1", updatedAt: t0 }],
      openTasks: [{ title: "T1", description: "D1" }],
      recentTaskLogs: [{ content: "L1", createdAt: t0 }],
      pendingApprovals: [
        { id: "ap-1", artifactRef: { kind: "pr" }, comment: "review" },
      ],
    });

    expect(md).toContain("## Soul");
    expect(md).toContain("Soul body");
    expect(md).toContain("## Heartbeat template");
    expect(md).toContain("Hb body");
    expect(md).toContain("## Archetype heartbeat addendum");
    expect(md).toContain("Archetype extras");
    expect(md).toContain("## Business memory");
    expect(md).toContain("### Memory 1\nM1");
    expect(md).toContain("## Open tasks");
    expect(md).toContain("**T1**: D1");
    expect(md).toContain("## Recent task logs");
    expect(md).toContain("L1");
    expect(md).toContain("## Pending approvals");
    expect(md).toContain("ap-1");
    expect(md).toContain('"kind":"pr"');
    expect(md.split("--- CONTEXT ---").length).toBeGreaterThanOrEqual(7);
  });

  it("omits archetype section when addendum is whitespace only", () => {
    const md = formatHeartbeatPrompt({ ...baseCtx(), archetypeHeartbeatAddendum: "  \n" });
    expect(md).not.toContain("Archetype heartbeat");
  });
});
