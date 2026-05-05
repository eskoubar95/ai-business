import type { AppDb } from "@/lib/templates/db-types";
import type { CommunicationPolicyShard } from "@/lib/templates/zod-schemas";

import { upsertCommunicationEdge } from "./edge-store";
import type { CreateCommunicationEdgeInput } from "./schemas";

/**
 * Idempotent upsert of communication edges from a validated policy shard (Stream A bundle).
 */
export async function seedCommunicationEdgesFromBundle(
  db: AppDb,
  businessId: string,
  policy: CommunicationPolicyShard,
  lineage: {
    templateId: string;
    templateVersion: string;
  },
): Promise<void> {
  const { templateId, templateVersion } = lineage;

  for (const edge of policy.edges) {
    const input: CreateCommunicationEdgeInput = {
      fromRole: edge.from_role,
      toRole: edge.to_role,
      direction: edge.direction,
      allowedIntents: edge.allowed_intents,
      allowedArtifacts: edge.allowed_artifacts,
      requiresHumanAck: edge.requires_human_ack,
      quotaPerHour: edge.quota_per_hour ?? null,
      quotaMode: edge.quota_mode,
    };

    await upsertCommunicationEdge(db, businessId, input, {
      templateId,
      templateVersion,
      derivedFromTemplateId: templateId,
      derivedFromTemplateVersion: templateVersion,
    });
  }
}
