import { and, asc, eq, sql } from "drizzle-orm";

import { communicationEdges } from "@/db/schema";
import type { AppDb } from "@/lib/templates/db-types";

import { findTemplateEdgeForConsult, loadEnterpriseCommunicationPolicy, type TemplatePolicyEdge } from "./template-defaults";
import type { CreateCommunicationEdgeInput, UpdateCommunicationEdgeInput } from "./schemas";

export type CommunicationEdgeRow = typeof communicationEdges.$inferSelect;

export async function listCommunicationEdges(
  db: AppDb,
  businessId: string,
): Promise<CommunicationEdgeRow[]> {
  return db.query.communicationEdges.findMany({
    where: eq(communicationEdges.businessId, businessId),
    orderBy: [asc(communicationEdges.fromRole), asc(communicationEdges.toRole)],
  });
}

export async function getCommunicationEdgeById(
  db: AppDb,
  businessId: string,
  edgeId: string,
): Promise<CommunicationEdgeRow | undefined> {
  return db.query.communicationEdges.findFirst({
    where: and(
      eq(communicationEdges.id, edgeId),
      eq(communicationEdges.businessId, businessId),
    ),
  });
}

export async function upsertCommunicationEdge(
  db: AppDb,
  businessId: string,
  input: CreateCommunicationEdgeInput,
  lineage?: {
    templateId: string | null;
    templateVersion: string | null;
    derivedFromTemplateId: string | null;
    derivedFromTemplateVersion: string | null;
  },
): Promise<CommunicationEdgeRow> {
  const templateId = lineage?.templateId ?? null;
  const templateVersion = lineage?.templateVersion ?? null;
  const derivedFromTemplateId = lineage?.derivedFromTemplateId ?? null;
  const derivedFromTemplateVersion = lineage?.derivedFromTemplateVersion ?? null;

  const [row] = await db
    .insert(communicationEdges)
    .values({
      businessId,
      fromRole: input.fromRole.trim(),
      toRole: input.toRole.trim(),
      direction: input.direction,
      allowedIntents: input.allowedIntents,
      allowedArtifacts: input.allowedArtifacts,
      requiresHumanAck: input.requiresHumanAck,
      quotaPerHour: input.quotaPerHour ?? null,
      quotaMode: input.quotaMode,
      templateId,
      templateVersion,
      derivedFromTemplateId,
      derivedFromTemplateVersion,
    })
    .onConflictDoUpdate({
      target: [
        communicationEdges.businessId,
        communicationEdges.fromRole,
        communicationEdges.toRole,
      ],
      set: {
        direction: sql.raw("excluded.direction"),
        allowedIntents: sql.raw("excluded.allowed_intents"),
        allowedArtifacts: sql.raw("excluded.allowed_artifacts"),
        requiresHumanAck: sql.raw("excluded.requires_human_ack"),
        quotaPerHour: sql.raw("excluded.quota_per_hour"),
        quotaMode: sql.raw("excluded.quota_mode"),
        templateId: sql.raw("excluded.template_id"),
        templateVersion: sql.raw("excluded.template_version"),
        derivedFromTemplateId: sql.raw("excluded.derived_from_template_id"),
        derivedFromTemplateVersion: sql.raw("excluded.derived_from_template_version"),
        updatedAt: sql`now()`,
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to upsert communication edge");
  }
  return row;
}

function sortedJoin(values: string[]): string {
  return [...values].sort().join("\0");
}

function templateBaseline(template: TemplatePolicyEdge): {
  direction: "one_way" | "bidirectional";
  allowedIntents: string[];
  allowedArtifacts: string[];
  requiresHumanAck: boolean;
  quotaPerHour: number | null;
  quotaMode: "warn_only" | "enforce";
} {
  return {
    direction: template.direction,
    allowedIntents: template.allowed_intents,
    allowedArtifacts: template.allowed_artifacts,
    requiresHumanAck: template.requires_human_ack,
    quotaPerHour: template.quota_per_hour ?? null,
    quotaMode: template.quota_mode,
  };
}

/**
 * merge_smart: only apply patch fields that are not drifted from the official template policy.
 * A field is drifted when its current DB value differs from the template default for that field.
 */
export async function mergeSmartUpdateEdge(
  db: AppDb,
  businessId: string,
  edgeId: string,
  patch: UpdateCommunicationEdgeInput,
): Promise<CommunicationEdgeRow | null> {
  const row = await getCommunicationEdgeById(db, businessId, edgeId);
  if (!row) return null;

  const policy = loadEnterpriseCommunicationPolicy();
  const template = findTemplateEdgeForConsult(policy, row.fromRole, row.toRole);
  const base = template ? templateBaseline(template) : null;

  const next: {
    direction?: "one_way" | "bidirectional";
    allowedIntents?: string[];
    allowedArtifacts?: string[];
    requiresHumanAck?: boolean;
    quotaPerHour?: number | null;
    quotaMode?: "warn_only" | "enforce";
  } = {};

  if (patch.direction !== undefined) {
    if (!base || row.direction === base.direction) {
      next.direction = patch.direction;
    }
  }
  if (patch.allowedIntents !== undefined) {
    if (!base || sortedJoin(row.allowedIntents) === sortedJoin(base.allowedIntents)) {
      next.allowedIntents = patch.allowedIntents;
    }
  }
  if (patch.allowedArtifacts !== undefined) {
    if (!base || sortedJoin(row.allowedArtifacts) === sortedJoin(base.allowedArtifacts)) {
      next.allowedArtifacts = patch.allowedArtifacts;
    }
  }
  if (patch.requiresHumanAck !== undefined) {
    if (!base || row.requiresHumanAck === base.requiresHumanAck) {
      next.requiresHumanAck = patch.requiresHumanAck;
    }
  }
  if (patch.quotaPerHour !== undefined) {
    if (!base || row.quotaPerHour === base.quotaPerHour) {
      next.quotaPerHour = patch.quotaPerHour;
    }
  }
  if (patch.quotaMode !== undefined) {
    if (!base || row.quotaMode === base.quotaMode) {
      next.quotaMode = patch.quotaMode;
    }
  }

  if (Object.keys(next).length === 0) {
    return row;
  }

  const [updated] = await db
    .update(communicationEdges)
    .set({
      ...(next.direction !== undefined ? { direction: next.direction } : {}),
      ...(next.allowedIntents !== undefined ? { allowedIntents: next.allowedIntents } : {}),
      ...(next.allowedArtifacts !== undefined ? { allowedArtifacts: next.allowedArtifacts } : {}),
      ...(next.requiresHumanAck !== undefined ? { requiresHumanAck: next.requiresHumanAck } : {}),
      ...(next.quotaPerHour !== undefined ? { quotaPerHour: next.quotaPerHour } : {}),
      ...(next.quotaMode !== undefined ? { quotaMode: next.quotaMode } : {}),
      updatedAt: sql`now()`,
    })
    .where(
      and(eq(communicationEdges.id, edgeId), eq(communicationEdges.businessId, businessId)),
    )
    .returning();

  return updated ?? null;
}

export async function deleteCommunicationEdge(
  db: AppDb,
  businessId: string,
  edgeId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(communicationEdges)
    .where(
      and(eq(communicationEdges.id, edgeId), eq(communicationEdges.businessId, businessId)),
    )
    .returning({ id: communicationEdges.id });
  return deleted.length > 0;
}
