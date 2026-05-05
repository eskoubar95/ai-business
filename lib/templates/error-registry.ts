import { z } from "zod";

import registryJson from "@/templates/conduro/enterprise/v3/errors/registry.json";
import { ErrorRegistrySchema } from "@/lib/templates/zod-schemas";

export interface ErrorEntry {
  code: string;
  http_status: number;
  message: string;
  remediation_key: string;
  remediation_hint: string;
}

const registry = ErrorRegistrySchema.parse(registryJson);

const rawCodes = registry.error_codes.map((e) => e.code);
const uniqueCodes = new Set(rawCodes);
if (uniqueCodes.size !== rawCodes.length) {
  throw new Error("errors/registry.json contains duplicate `code` values");
}
if (rawCodes.length === 0) {
  throw new Error("errors/registry.json must contain at least one error code");
}

const codeTuple = rawCodes as [string, ...string[]];
const ErrorCodeSchema = z.enum(codeTuple);

/** Codes co-versioned with `errors/registry.json` (compile-time synced via Zod). */
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

const byCode = new Map<string, ErrorEntry>(
  registry.error_codes.map((e) => [e.code, e as ErrorEntry]),
);

/** Typesafe lookup for structured errors co-versioned with the enterprise template. */
export function getError(code: ErrorCode): ErrorEntry {
  const entry = byCode.get(code);
  if (!entry) {
    throw new Error(`Unknown error code: ${String(code)}`);
  }
  return entry;
}
