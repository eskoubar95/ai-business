import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { CommunicationPolicyShard } from "@/lib/templates/zod-schemas";
import { CommunicationPolicyShardSchema } from "@/lib/templates/zod-schemas";

let cached: CommunicationPolicyShard | null = null;

/** Canonical enterprise v3 communication policy (for merge_smart drift detection). */
export function loadEnterpriseCommunicationPolicy(): CommunicationPolicyShard {
  if (cached) return cached;
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../templates/conduro/enterprise/v3");
  const raw = readFileSync(join(root, "communication/policy.json"), "utf8");
  cached = CommunicationPolicyShardSchema.parse(JSON.parse(raw));
  return cached;
}

export type TemplatePolicyEdge = CommunicationPolicyShard["edges"][number];

/** Template row for a directed consult pair (respects edge direction). */
export function findTemplateEdgeForConsult(
  policy: CommunicationPolicyShard,
  fromRole: string,
  toRole: string,
): TemplatePolicyEdge | undefined {
  const forward = policy.edges.find((e) => e.from_role === fromRole && e.to_role === toRole);
  if (forward) return forward;
  return policy.edges.find(
    (e) => e.direction === "bidirectional" && e.from_role === toRole && e.to_role === fromRole,
  );
}
