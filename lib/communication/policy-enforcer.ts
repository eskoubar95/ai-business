import { randomUUID } from "node:crypto";

import { getError, type ErrorCode } from "@/lib/templates/error-registry";
import type { AppDb } from "@/lib/templates/db-types";

import { listCommunicationEdges, type CommunicationEdgeRow } from "./edge-store";

export type PolicyError = {
  error_code: ErrorCode;
  correlation_id: string;
  remediation_key: string;
  detail: string;
};

export type ConsultArtifactInput = { kind: string; ref?: string | null };

export type ConsultCheckInput = {
  org_id: string;
  from_role: string;
  to_role: string;
  intent: string;
  artifacts?: ConsultArtifactInput[];
};

export type PolicyCheckResult =
  | { allowed: true; correlation_id: string }
  | { allowed: false; error: PolicyError };

export function makePolicyError(code: ErrorCode, correlationId: string): PolicyError {
  const e = getError(code);
  return {
    error_code: code,
    correlation_id: correlationId,
    remediation_key: e.remediation_key,
    detail: e.message,
  };
}

/** Resolve a stored edge for a consult direction (handles `bidirectional`). */
export function findStoredEdgeForConsult(
  edges: CommunicationEdgeRow[],
  fromRole: string,
  toRole: string,
): CommunicationEdgeRow | undefined {
  const direct = edges.find((e) => e.fromRole === fromRole && e.toRole === toRole);
  if (direct) return direct;
  return edges.find(
    (e) =>
      e.direction === "bidirectional" && e.fromRole === toRole && e.toRole === fromRole,
  );
}

/**
 * Policy gate for cross-agent consults. `hard_block` semantics: violations never pass.
 *
 * Quotas: `quota_per_hour` / `quota_mode` are **not** enforced here (no per-hour counters in
 * this layer). `warn_only` / `enforce` accounting is intended for the job orchestrator / queue
 * (Stream B). This function validates graph topology, intent, artifacts, and human-ack gates only.
 */
export function checkConsultAgainstEdges(
  edges: CommunicationEdgeRow[],
  input: ConsultCheckInput,
): PolicyCheckResult {
  const correlationId = randomUUID();
  const edge = findStoredEdgeForConsult(edges, input.from_role, input.to_role);
  if (!edge) {
    return {
      allowed: false,
      error: makePolicyError("CONSULT_EDGE_DISALLOWED", correlationId),
    };
  }

  if (edge.requiresHumanAck) {
    return { allowed: false, error: makePolicyError("HUMAN_ACK_REQUIRED", correlationId) };
  }

  if (!edge.allowedIntents.includes(input.intent)) {
    return { allowed: false, error: makePolicyError("INTENT_NOT_ALLOWED", correlationId) };
  }

  const arts = input.artifacts ?? [];

  if (edge.allowedArtifacts.length === 0) {
    if (arts.length > 0) {
      return { allowed: false, error: makePolicyError("ARTIFACT_KIND_NOT_ALLOWED", correlationId) };
    }
    return { allowed: true, correlation_id: correlationId };
  }

  if (arts.length === 0) {
    return { allowed: false, error: makePolicyError("MISSING_ARTIFACT_REF", correlationId) };
  }

  for (const a of arts) {
    if (!edge.allowedArtifacts.includes(a.kind)) {
      return { allowed: false, error: makePolicyError("ARTIFACT_KIND_NOT_ALLOWED", correlationId) };
    }
    if (a.ref == null || String(a.ref).trim() === "") {
      return { allowed: false, error: makePolicyError("MISSING_ARTIFACT_REF", correlationId) };
    }
  }

  return { allowed: true, correlation_id: correlationId };
}

export async function checkConsult(db: AppDb, input: ConsultCheckInput): Promise<PolicyCheckResult> {
  const edges = await listCommunicationEdges(db, input.org_id);
  return checkConsultAgainstEdges(edges, input);
}
