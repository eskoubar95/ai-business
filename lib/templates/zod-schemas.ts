import { z } from "zod";
import {
  AGENT_PLATFORM_ICON_IDS,
  type AgentPlatformIconId,
} from "@/lib/agents/agent-platform-icon-ids";

const agentDocumentSlugEnum = z.enum(["agents", "soul", "heartbeat", "tools"]);

/** Matches `agents.icon_key` allowlist (`normalizeAgentIconKeyForSave`) — catches typos at bundle parse time. */
const enterpriseAgentIconKeySchema = z.enum(
  AGENT_PLATFORM_ICON_IDS as unknown as [AgentPlatformIconId, ...AgentPlatformIconId[]],
);

/** Single agent row inside `agents/agents.json` (source shard; bundled rows include `agent_documents` bodies). */
export const EnterpriseAgentShardEntrySchema = z.object({
  agent_slug: z.string(),
  display_name: z.string(),
  team_slug: z.string(),
  tier: z.number().int(),
  role_summary: z.string(),
  execution_adapter: z.enum(["hermes_agent_cli", "claude_code_cli", "cursor_agent_cli"]),
  model_routing: z.enum(["litellm_runpod", "cursor_managed", "cursor_allowlist"]),
  /** Relative directory under enterprise v3 bundle root holding AGENTS/SOUL/HEARTBEAT/TOOLS. */
  instructions_path: z.string(),
  heartbeat_template: z.string(),
  mcp_allowlist: z.array(z.string()),
  required_gates_before_output: z.array(z.string()),
  /** Default emoji-style icon picker key seeded onto `agents.icon_key`. */
  icon_key: enterpriseAgentIconKeySchema.nullable().optional(),
  /** Populated when building bundle or when testing seeded payloads. */
  agent_documents: z
    .array(
      z.object({
        slug: agentDocumentSlugEnum,
        filename: z.string(),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type EnterpriseAgentShardEntry = z.infer<typeof EnterpriseAgentShardEntrySchema>;

export const AgentShardSchema = z.array(EnterpriseAgentShardEntrySchema).min(1);

/** Team definitions inside `teams/teams.json`. */
export const TeamShardSchema = z.array(
  z.object({
    team_slug: z.string(),
    display_name: z.string(),
    description: z.string(),
    lead_agent_slug: z.string(),
    tier: z.number().int(),
  }),
).min(1);

/** Gate kinds shard (`gates/gate_kinds.json`). */
export const GateKindShardSchema = z.object({
  gate_kinds: z
    .array(
      z.object({
        slug: z.string(),
        label: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
  default_mode: z.enum(["blocking", "warn_only"]),
  metadata_schema: z.record(z.string(), z.string()),
});

/** Communication policy shard (`communication/policy.json`). */
export const CommunicationPolicyShardSchema = z.object({
  schema_version: z.string(),
  default_violation_policy: z.enum(["hard_block"]),
  default_quota_mode: z.enum(["warn_only", "enforce"]),
  allowed_intents: z.array(z.string()),
  allowed_artifact_kinds: z.array(z.string()),
  edges: z
    .array(
      z.object({
        from_role: z.string(),
        to_role: z.string(),
        direction: z.enum(["one_way", "bidirectional"]),
        allowed_intents: z.array(z.string()),
        allowed_artifacts: z.array(z.string()),
        requires_human_ack: z.boolean(),
        quota_per_hour: z.number().int().nullable(),
        quota_mode: z.enum(["warn_only", "enforce"]),
      }),
    )
    .min(1),
});

/** Platform error registry (`errors/registry.json`). */
export const ErrorRegistrySchema = z.object({
  registry_version: z.string(),
  language: z.string(),
  error_codes: z.array(
    z.object({
      code: z.string(),
      http_status: z.number().int(),
      message: z.string(),
      remediation_key: z.string(),
      remediation_hint: z.string(),
    }),
  ),
});

/** Shard path entries in `manifest.json` (must match `manifest.sha256` keys exactly). */
export const ManifestShardRefsSchema = z
  .object({
    teams: z.string(),
    agents: z.string(),
    gates: z.string(),
    communication_policy: z.string(),
    errors_registry: z.string(),
  })
  .strict();

export const ManifestSchema = z
  .object({
    template_id: z.string(),
    template_version: z.string(),
    display_name: z.string(),
    description: z.string(),
    author: z.string(),
    released_at: z.string(),
    shards: ManifestShardRefsSchema,
    sha256: ManifestShardRefsSchema,
  })
  .strict();

/** Full compiled bundle produced by `npm run templates:build`. */
export const BundlePayloadSchema = z
  .object({
    manifest: ManifestSchema,
    shards: z
      .object({
        teams: TeamShardSchema,
        agents: AgentShardSchema,
        gates: GateKindShardSchema,
        communication_policy: CommunicationPolicyShardSchema,
        errors_registry: ErrorRegistrySchema,
      })
      .strict(),
  })
  .strict();

export type BundlePayload = z.infer<typeof BundlePayloadSchema>;
export type CommunicationPolicyShard = z.infer<typeof CommunicationPolicyShardSchema>;
