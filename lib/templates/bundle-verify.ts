import { createHash } from "node:crypto";

import { BundlePayloadSchema, type BundlePayload } from "@/lib/templates/zod-schemas";
import { canonicalStringify } from "@/lib/templates/canonical-json";
import { TemplateSeedError } from "@/lib/templates/template-errors";

export function shardSha256(parsedShard: unknown): string {
  return createHash("sha256").update(canonicalStringify(parsedShard), "utf8").digest("hex");
}

/** Validates Zod shape then verifies each shard hash against `manifest.sha256`. */
export function verifyAndParseBundle(raw: unknown): BundlePayload {
  const parsed = BundlePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TemplateSeedError(
      "BUNDLE_SCHEMA_INVALID",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  }
  const bundle = parsed.data;
  for (const key of Object.keys(bundle.manifest.shards)) {
    const expected = bundle.manifest.sha256[key];
    const shardBody = bundle.shards[key as keyof typeof bundle.shards];
    const actual = shardSha256(shardBody);
    if (expected !== actual) {
      throw new TemplateSeedError(
        "TEMPLATE_HASH_MISMATCH",
        `Shard "${key}" hash mismatch: manifest=${expected}, actual=${actual}`,
      );
    }
  }
  return bundle;
}
