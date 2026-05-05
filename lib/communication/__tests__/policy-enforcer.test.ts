import { describe, expect, it } from "vitest";

import type { CommunicationEdgeRow } from "@/lib/communication/edge-store";
import { checkConsultAgainstEdges } from "@/lib/communication/policy-enforcer";

function stubRow(partial: Partial<CommunicationEdgeRow>): CommunicationEdgeRow {
  const base = {
    id: "00000000-0000-4000-8000-000000000099",
    businessId: "00000000-0000-4000-8000-0000000000aa",
    fromRole: "role_a",
    toRole: "role_b",
    direction: "one_way" as const,
    allowedIntents: ["notify_completion"],
    allowedArtifacts: ["ticket_ref"],
    requiresHumanAck: false,
    quotaPerHour: 10 as number | null,
    quotaMode: "warn_only" as const,
    templateId: null as string | null,
    templateVersion: null as string | null,
    derivedFromTemplateId: null as string | null,
    derivedFromTemplateVersion: null as string | null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  return { ...base, ...partial };
}

describe("checkConsultAgainstEdges", () => {
  it("returns CONSULT_EDGE_DISALLOWED when no edge exists", () => {
    const r = checkConsultAgainstEdges([], {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "x",
      to_role: "y",
      intent: "notify_completion",
      artifacts: [],
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.error.error_code).toBe("CONSULT_EDGE_DISALLOWED");
      expect(r.error.correlation_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  it("returns INTENT_NOT_ALLOWED for disallowed intent", () => {
    const edges = [stubRow({ allowedIntents: ["report_blocker"] })];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "role_a",
      to_role: "role_b",
      intent: "notify_completion",
      artifacts: [{ kind: "ticket_ref", ref: "T-1" }],
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.error.error_code).toBe("INTENT_NOT_ALLOWED");
  });

  it("returns ARTIFACT_KIND_NOT_ALLOWED for wrong artifact kind", () => {
    const edges = [stubRow({ allowedArtifacts: ["ticket_ref"] })];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "role_a",
      to_role: "role_b",
      intent: "notify_completion",
      artifacts: [{ kind: "pr_ref", ref: "1" }],
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.error.error_code).toBe("ARTIFACT_KIND_NOT_ALLOWED");
  });

  it("returns MISSING_ARTIFACT_REF when artifacts required but missing", () => {
    const edges = [stubRow({ allowedArtifacts: ["ticket_ref"] })];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "role_a",
      to_role: "role_b",
      intent: "notify_completion",
      artifacts: [],
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.error.error_code).toBe("MISSING_ARTIFACT_REF");
  });

  it("returns MISSING_ARTIFACT_REF when ref empty", () => {
    const edges = [stubRow({ allowedArtifacts: ["ticket_ref"] })];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "role_a",
      to_role: "role_b",
      intent: "notify_completion",
      artifacts: [{ kind: "ticket_ref", ref: "  " }],
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.error.error_code).toBe("MISSING_ARTIFACT_REF");
  });

  it("returns HUMAN_ACK_REQUIRED when edge requires acknowledgement", () => {
    const edges = [stubRow({ requiresHumanAck: true })];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "role_a",
      to_role: "role_b",
      intent: "notify_completion",
      artifacts: [{ kind: "ticket_ref", ref: "T-1" }],
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.error.error_code).toBe("HUMAN_ACK_REQUIRED");
  });

  it("allows a valid consult", () => {
    const edges = [stubRow({})];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "role_a",
      to_role: "role_b",
      intent: "notify_completion",
      artifacts: [{ kind: "ticket_ref", ref: "T-1" }],
    });
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.correlation_id).toBeTruthy();
  });

  it("resolves bidirectional stored edge in reverse direction", () => {
    const edges = [
      stubRow({
        direction: "bidirectional",
        fromRole: "left",
        toRole: "right",
      }),
    ];
    const r = checkConsultAgainstEdges(edges, {
      org_id: "00000000-0000-4000-8000-0000000000aa",
      from_role: "right",
      to_role: "left",
      intent: "notify_completion",
      artifacts: [{ kind: "ticket_ref", ref: "T-1" }],
    });
    expect(r.allowed).toBe(true);
  });
});
