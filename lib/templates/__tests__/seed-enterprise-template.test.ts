import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  agents,
  communicationEdges,
  gateKinds,
  teamMembers,
  teams,
} from "@/db/schema";
import { shardSha256 } from "@/lib/templates/bundle-verify";
import type { AppDb } from "@/lib/templates/db-types";
import { seedEnterpriseTemplate } from "@/lib/templates/seed-enterprise-template";
import { BundlePayloadSchema, type BundlePayload } from "@/lib/templates/zod-schemas";

type TeamRow = {
  team_slug: string;
  display_name: string;
  description: string;
  lead_agent_slug: string;
  tier: number;
};

function loadEnterpriseShards() {
  const ROOT = join(process.cwd(), "templates/conduro/enterprise/v3");
  return {
    teams: JSON.parse(readFileSync(join(ROOT, "teams/teams.json"), "utf8")) as TeamRow[],
    agents: JSON.parse(readFileSync(join(ROOT, "agents/agents.json"), "utf8")),
    gates: JSON.parse(readFileSync(join(ROOT, "gates/gate_kinds.json"), "utf8")),
    communication_policy: JSON.parse(readFileSync(join(ROOT, "communication/policy.json"), "utf8")),
    errors_registry: JSON.parse(readFileSync(join(ROOT, "errors/registry.json"), "utf8")),
  };
}

function buildBundle(shards: ReturnType<typeof loadEnterpriseShards>): BundlePayload {
  const manifest = {
    template_id: "conduro.enterprise",
    template_version: "3.0.0",
    display_name: "Conduro Enterprise Agent Team",
    description: "Full product-to-engineering agent organisation. Two streams: Product and Build.",
    author: "Conduro Platform",
    released_at: "2026-05-05",
    shards: {
      teams: "teams/teams.json",
      agents: "agents/agents.json",
      gates: "gates/gate_kinds.json",
      communication_policy: "communication/policy.json",
      errors_registry: "errors/registry.json",
    },
    sha256: {
      teams: shardSha256(shards.teams),
      agents: shardSha256(shards.agents),
      gates: shardSha256(shards.gates),
      communication_policy: shardSha256(shards.communication_policy),
      errors_registry: shardSha256(shards.errors_registry),
    },
  };
  return BundlePayloadSchema.parse({ manifest, shards });
}

describe("seedEnterpriseTemplate", () => {
  const businessId = "00000000-0000-4000-8000-000000000001";

  function createMockDb(opts?: { businessUpdateHits?: boolean }) {
    const businessUpdateHits = opts?.businessUpdateHits ?? true;
    const agentSlugToId = new Map<string, string>();
    const teamSlugToId = new Map<string, string>();
    const insertCounts = new Map<object, number>();
    let updatePayload: Record<string, unknown> | undefined;

    const insert = vi.fn((table: object) => ({
      values: (vals: Record<string, unknown> | Array<Record<string, unknown>>) => ({
        onConflictDoUpdate: vi.fn(() => {
          insertCounts.set(table, (insertCounts.get(table) ?? 0) + 1);
          const rows = Array.isArray(vals) ? vals : [vals];
          for (const row of rows) {
            if (table === agents && row.slug != null) {
              const s = String(row.slug);
              if (!agentSlugToId.has(s)) agentSlugToId.set(s, randomUUID());
            }
            if (table === teams && row.slug != null) {
              const s = String(row.slug);
              if (!teamSlugToId.has(s)) teamSlugToId.set(s, randomUUID());
            }
          }
          return Promise.resolve();
        }),
      }),
    }));

    const update = vi.fn(() => ({
      set: vi.fn((payload: Record<string, unknown>) => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => {
            updatePayload = payload;
            return Promise.resolve(businessUpdateHits ? [{ id: businessId }] : []);
          }),
        })),
      })),
    }));

    const select = vi.fn(() => ({
      from: vi.fn((table: object) => ({
        where: vi.fn(() => {
          if (table === agents) {
            return Promise.resolve(
              Array.from(agentSlugToId.entries()).map(([slug, id]) => ({ id, slug })),
            );
          }
          if (table === teams) {
            return Promise.resolve(
              Array.from(teamSlugToId.entries()).map(([slug, id]) => ({ id, slug })),
            );
          }
          return Promise.resolve([]);
        }),
      })),
    }));

    const mockDb = { insert, update, select };

    return {
      mockDb: mockDb as unknown as AppDb,
      insertCounts,
      getUpdatePayload: () => updatePayload,
    };
  }

  it("runs one batched upsert per seeded table", async () => {
    const shards = loadEnterpriseShards();
    const bundle = buildBundle(shards);
    const { mockDb, insertCounts, getUpdatePayload } = createMockDb();

    await seedEnterpriseTemplate(mockDb, businessId, bundle);

    expect(getUpdatePayload()?.templateId).toBe("conduro.enterprise");
    expect(getUpdatePayload()?.templateVersion).toBe("3.0.0");

    expect(insertCounts.get(agents)).toBe(1);
    expect(insertCounts.get(teams)).toBe(1);
    expect(insertCounts.get(teamMembers)).toBe(1);
    expect(insertCounts.get(gateKinds)).toBe(1);
    expect(insertCounts.get(communicationEdges)).toBe(1);
  });

  it("throws SEED_REFERENCE_MISSING when lead slug cannot be resolved", async () => {
    const shards = loadEnterpriseShards();
    const brokenTeams = shards.teams.map((t) =>
      t.team_slug === "product_team" ? { ...t, lead_agent_slug: "nonexistent_lead_slug" } : t,
    );
    const bundle = buildBundle({ ...shards, teams: brokenTeams });
    const { mockDb } = createMockDb();

    await expect(seedEnterpriseTemplate(mockDb, businessId, bundle)).rejects.toMatchObject({
      code: "SEED_REFERENCE_MISSING",
    });
  });

  it("throws BUSINESS_NOT_FOUND when no business row matches org id", async () => {
    const shards = loadEnterpriseShards();
    const bundle = buildBundle(shards);
    const { mockDb } = createMockDb({ businessUpdateHits: false });

    await expect(seedEnterpriseTemplate(mockDb, businessId, bundle)).rejects.toMatchObject({
      code: "BUSINESS_NOT_FOUND",
    });
  });
});
