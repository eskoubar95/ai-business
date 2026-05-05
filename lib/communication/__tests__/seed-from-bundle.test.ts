import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { communicationEdges } from "@/db/schema";
import { CommunicationPolicyShardSchema } from "@/lib/templates/zod-schemas";

import { seedCommunicationEdgesFromBundle } from "@/lib/communication/seed-from-bundle";

function loadPolicyShard() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../../templates/conduro/enterprise/v3");
  const raw = readFileSync(join(root, "communication/policy.json"), "utf8");
  return CommunicationPolicyShardSchema.parse(JSON.parse(raw));
}

describe("seedCommunicationEdgesFromBundle", () => {
  it("upserts once per edge in the policy shard", async () => {
    const policy = loadPolicyShard();
    const upsertCalls: unknown[] = [];

    const insertChain = {
      values: vi.fn(() => conflictChain),
    };
    const conflictChain = {
      onConflictDoUpdate: vi.fn(() => returningChain),
    };
    const returningChain = {
      returning: vi.fn(() =>
        Promise.resolve([
          {
            id: "00000000-0000-4000-8000-000000000099",
            businessId: "00000000-0000-4000-8000-0000000000aa",
          },
        ]),
      ),
    };

    const db = {
      insert: vi.fn((table: unknown) => {
        upsertCalls.push(table);
        return insertChain;
      }),
    };

    await seedCommunicationEdgesFromBundle(
      db as never,
      "00000000-0000-4000-8000-0000000000aa",
      policy,
      { templateId: "conduro.enterprise", templateVersion: "3.0.0" },
    );

    expect(db.insert).toHaveBeenCalledTimes(policy.edges.length);
    expect(upsertCalls.every((t) => t === communicationEdges)).toBe(true);
    expect(insertChain.values).toHaveBeenCalledTimes(policy.edges.length);
    expect(conflictChain.onConflictDoUpdate).toHaveBeenCalledTimes(policy.edges.length);
  });
});
