export type TemplateSeedErrorCode =
  | "TEMPLATE_HASH_MISMATCH"
  | "BUNDLE_SCHEMA_INVALID"
  | "SEED_REFERENCE_MISSING"
  | "BUSINESS_NOT_FOUND"
  | "INSTRUCTION_FILES_MISSING";

/** Structured failure when validating or applying enterprise template bundles. */
export class TemplateSeedError extends Error {
  readonly code: TemplateSeedErrorCode;

  constructor(code: TemplateSeedErrorCode, message?: string) {
    super(message ?? code);
    this.name = "TemplateSeedError";
    this.code = code;
  }
}
