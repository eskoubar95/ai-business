import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  AgentShardSchema,
  CommunicationPolicyShardSchema,
  ErrorRegistrySchema,
  GateKindShardSchema,
  ManifestSchema,
  TeamShardSchema,
} from "@/lib/templates/zod-schemas";
import { shardSha256 } from "@/lib/templates/bundle-verify";
import { TemplateSeedError } from "@/lib/templates/template-errors";

const TEMPLATE_ROOT = join(process.cwd(), "templates/conduro/enterprise/v3");

const shardValidators = {
  teams: TeamShardSchema,
  agents: AgentShardSchema,
  gates: GateKindShardSchema,
  communication_policy: CommunicationPolicyShardSchema,
  errors_registry: ErrorRegistrySchema,
} as const;

type ShardKey = keyof typeof shardValidators;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function validateShard(key: ShardKey, body: unknown): unknown {
  const schema = shardValidators[key];
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new TemplateSeedError(
      "BUNDLE_SCHEMA_INVALID",
      `Shard "${key}": ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  return parsed.data;
}

export function main(): void {
  const manifestPath = join(TEMPLATE_ROOT, "manifest.json");
  const manifestRaw = readJson(manifestPath);
  const manifestParsed = ManifestSchema.safeParse(manifestRaw);
  if (!manifestParsed.success) {
    throw new TemplateSeedError(
      "BUNDLE_SCHEMA_INVALID",
      `manifest.json: ${manifestParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  const manifest = manifestParsed.data;

  const shards: Record<string, unknown> = {};
  const sha256: Record<string, string> = {};

  for (const key of Object.keys(manifest.shards) as ShardKey[]) {
    const relPath = manifest.shards[key];
    const absPath = join(TEMPLATE_ROOT, relPath);
    const rawBody = readJson(absPath);
    const validated = validateShard(key, rawBody);
    shards[key] = validated;
    sha256[key] = shardSha256(validated);
  }

  const manifestOut = {
    ...manifest,
    sha256,
  };

  writeFileSync(manifestPath, JSON.stringify(manifestOut, null, 2) + "\n", "utf8");

  const bundleName = `${manifestOut.template_id}.${manifestOut.template_version}.bundle.json`;
  const bundlePath = join(process.cwd(), "dist", bundleName);
  mkdirSync(dirname(bundlePath), { recursive: true });

  const bundle = {
    manifest: manifestOut,
    shards,
  };

  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + "\n", "utf8");
  console.error(`Wrote ${bundlePath}`);
}

main();
