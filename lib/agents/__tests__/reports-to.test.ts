import { describe, expect, it, vi } from "vitest";

import { wouldIntroduceReportsCycle } from "../reports-cycle.js";

type NeonDb = ReturnType<typeof import("@/db/index").getDb>;

describe("reports_to hierarchy", () => {
  it("detects cycles when proposed manager implies loop back onto the edited agent", async () => {
    const rows: Array<{ reportsToAgentId: string | null } | undefined> = [
      { reportsToAgentId: "mgr-a" },
    ];
    const db = {
      query: {
        agents: {
          findFirst: vi.fn(async () => rows.shift()),
        },
      },
    };

    await expect(wouldIntroduceReportsCycle(db as unknown as NeonDb, "mgr-a", "mgr-b")).resolves.toBe(true);
    expect(db.query.agents.findFirst).toHaveBeenCalledTimes(1);
  });

  it("allows a finite manager chain", async () => {
    const rows: Array<{ reportsToAgentId: string | null } | undefined> = [
      { reportsToAgentId: "boss" },
      { reportsToAgentId: "top" },
      { reportsToAgentId: null },
    ];
    const db = {
      query: {
        agents: {
          findFirst: vi.fn(async () => rows.shift()),
        },
      },
    };

    await expect(
      wouldIntroduceReportsCycle(db as unknown as NeonDb, "new-agent", "lead"),
    ).resolves.toBe(false);
    expect(db.query.agents.findFirst).toHaveBeenCalledTimes(3);
  });
});
