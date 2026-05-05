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

/** Map a DB row + roles to comparable template shape (canonical policy.json fields). */
export function rowMatchesTemplateEdge(
  row: {
    direction: "one_way" | "bidirectional";
    allowedIntents: string[];
    allowedArtifacts: string[];
    requiresHumanAck: boolean;
    quotaPerHour: number | null;
    quotaMode: "warn_only" | "enforce";
  },
  template: TemplatePolicyEdge,
): boolean {
  const sameDirection = row.direction === template.direction;
  const sameIntents =
    [...row.allowedIntents].sort().join("\0") === [...template.allowed_intents].sort().join("\0");
  const sameArts =
    [...row.allowedArtifacts].sort().join("\0") === [...template.allowed_artifacts].sort().join("\0");
  const sameAck = row.requiresHumanAck === template.requires_human_ack;
  const sameQuota = row.quotaPerHour === (template.quota_per_hour ?? null);
  const sameMode = row.quotaMode === template.quota_mode;
  return sameDirection && sameIntents && sameArts && sameAck && sameQuota && sameMode;
}
