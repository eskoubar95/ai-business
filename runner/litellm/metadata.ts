/**
 * Standard LiteLLM / OpenAI-compatible proxy headers for correlation with platform metadata.
 */
export type LiteLLMMetadataInput = {
  tenantId: string;
  businessId: string;
  agentId: string;
  jobId: string;
  /** Prefer the job row `correlation_id` when distinct from `jobId`. */
  correlationId?: string;
  templateVersion?: string;
};

/** Same fields as metadata; convenience alias for HTTP header construction. */
export type LiteLLMMetadata = LiteLLMMetadataInput;

/**
 * Build lowercase headers expected by `runner/litellm/config-template.yaml` (`headers_to_pass`).
 * LiteLLM forwards these upstream where the model server supports extra headers.
 */
export function buildLiteLLMHeaders(input: LiteLLMMetadataInput): Record<string, string> {
  const headers: Record<string, string> = {
    "x-correlation-id": input.correlationId?.trim() || input.jobId,
    "x-tenant-id": input.tenantId,
    "x-agent-id": input.agentId,
    "x-job-id": input.jobId,
    "x-business-id": input.businessId,
  };
  if (input.templateVersion?.trim()) {
    headers["x-template-version"] = input.templateVersion.trim();
  }
  return headers;
}

/** Plan-facing alias — identical to `buildLiteLLMHeaders`. */
export const buildLiteLLMMetadata = buildLiteLLMHeaders;
