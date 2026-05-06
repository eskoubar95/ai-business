import { describe, expect, it } from "vitest";

import { shardSha256, verifyAndParseBundle } from "@/lib/templates/bundle-verify";
import { canonicalStringify } from "@/lib/templates/canonical-json";
import { TemplateSeedError } from "@/lib/templates/template-errors";
import { BundlePayloadSchema } from "@/lib/templates/zod-schemas";

const minimalShards = {
  teams: [
    {
      team_slug: "engineering_team",
      display_name: "Engineering",
      description: "",
      lead_agent_slug: "lead_eng",
      tier: 1,
    },
  ],
  agents: [
    {
      agent_slug: "lead_eng",
      display_name: "Lead",
      team_slug: "engineering_team",
      tier: 1,
      role_summary: "Lead",
      execution_adapter: "cursor_agent_cli" as const,
      model_routing: "cursor_managed" as const,
      instructions_path: "lead.md/",
      heartbeat_template: "ping",
      mcp_allowlist: [] as string[],
      required_gates_before_output: [] as string[],
    },
  ],
  gates: {
    gate_kinds: [{ slug: "code_review", label: "Code review", description: "" }],
    default_mode: "blocking" as const,
    metadata_schema: {},
  },
  communication_policy: {
    schema_version: "1.0.0",
    default_violation_policy: "hard_block" as const,
    default_quota_mode: "warn_only" as const,
    allowed_intents: [] as string[],
    allowed_artifact_kinds: [] as string[],
    edges: [
      {
        from_role: "lead_eng",
        to_role: "lead_eng",
        direction: "one_way" as const,
        allowed_intents: [] as string[],
        allowed_artifacts: [] as string[],
        requires_human_ack: false,
        quota_per_hour: null,
        quota_mode: "warn_only" as const,
      },
    ],
  },
  errors_registry: {
    registry_version: "1.0.0",
    language: "en",
    error_codes: [
      {
        code: "TEMPLATE_HASH_MISMATCH",
        http_status: 409,
        message: "m",
        remediation_key: "CONTACT_ADMIN",
        remediation_hint: "h",
      },
    ],
  },
} as const;

describe("bundle-verify", () => {
  it("detects hash mismatch after shard mutation", () => {
    const bundle = {
      manifest: {
        template_id: "t",
        template_version: "1.0.0",
        display_name: "d",
        description: "x",
        author: "a",
        released_at: "2026-01-01",
        shards: {
          teams: "teams.json",
          agents: "agents.json",
          gates: "gates.json",
          communication_policy: "communication/policy.json",
          errors_registry: "errors/registry.json",
        },
        sha256: {
          teams: "badhash",
          agents: "badhash",
          gates: "badhash",
          communication_policy: "badhash",
          errors_registry: "badhash",
        },
      },
      shards: { ...minimalShards },
    };

    expect(() => verifyAndParseBundle(bundle)).toThrow(TemplateSeedError);
    try {
      verifyAndParseBundle(bundle);
    } catch (e) {
      expect(e).toBeInstanceOf(TemplateSeedError);
      expect((e as TemplateSeedError).code).toBe("TEMPLATE_HASH_MISMATCH");
    }
  });

  it("rejects invalid bundle shape", () => {
    expect(() => verifyAndParseBundle({})).toThrow(TemplateSeedError);
    try {
      verifyAndParseBundle({});
    } catch (e) {
      expect(e).toBeInstanceOf(TemplateSeedError);
      expect((e as TemplateSeedError).code).toBe("BUNDLE_SCHEMA_INVALID");
    }
  });

  it("canonicalStringify + shardSha256 are stable", () => {
    const a = { b: 1, c: [{ z: true }] };
    expect(shardSha256(a)).toEqual(shardSha256({ c: [{ z: true }], b: 1 }));
    expect(canonicalStringify(a)).toBe(`{"b":1,"c":[{"z":true}]}`);
  });

  it("rejects manifest.sha256 with keys outside the fixed shard set (strict manifest)", () => {
    expect(() =>
      BundlePayloadSchema.parse({
        manifest: {
          template_id: "t",
          template_version: "1.0.0",
          display_name: "d",
          description: "x",
          author: "a",
          released_at: "2026-01-01",
          shards: {
            teams: "teams.json",
            agents: "agents.json",
            gates: "gates.json",
            communication_policy: "communication/policy.json",
            errors_registry: "errors/registry.json",
          },
          sha256: {
            teams: "a",
            agents: "a",
            gates: "a",
            communication_policy: "a",
            errors_registry: "a",
            stray: "nope",
          },
        },
        shards: {
          teams: minimalShards.teams,
          agents: minimalShards.agents,
          gates: minimalShards.gates,
          communication_policy: minimalShards.communication_policy,
          errors_registry: {
            registry_version: "1.0.0",
            language: "en",
            error_codes: [],
          },
        },
      }),
    ).toThrow();
  });
});
