import type { ModelParameterValue, ModelSelection, SettingSource } from "@cursor/sdk";

import type { RunCursorAgentOptions } from "@/lib/cursor/agent";

const VALID_SETTING_SOURCES = new Set<SettingSource>([
  "project",
  "user",
  "team",
  "mdm",
  "plugins",
  "all",
]);

function parseModelParams(json: string): ModelParameterValue[] | undefined {
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data)) {
      return undefined;
    }
    const out: ModelParameterValue[] = [];
    for (const item of data) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        typeof (item as { id: unknown }).id !== "string" ||
        !("value" in item) ||
        typeof (item as { value: unknown }).value !== "string"
      ) {
        continue;
      }
      out.push({
        id: (item as { id: string }).id,
        value: (item as { value: string }).value,
      });
    }
    return out.length ? out : undefined;
  } catch {
    return undefined;
  }
}

/** Split CSV of SDK setting layers; rejects unknown tokens */
function parseSettingSourceList(csv: string): SettingSource[] {
  const candidates = csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as SettingSource[];
  return candidates.filter((s) => VALID_SETTING_SOURCES.has(s));
}

/**
 * Cursor SDK `local.settingSources` for Grill-Me.
 * When env is **unset**, defaults to `["project"]` (repo `.cursor` rules/skills/plugins).
 */
export function grillMeSettingSourcesFromEnv(env: NodeJS.ProcessEnv): SettingSource[] {
  if (env.CURSOR_GRILL_ME_SETTING_SOURCES === undefined) {
    return ["project"];
  }
  const raw = env.CURSOR_GRILL_ME_SETTING_SOURCES?.trim() ?? "";
  if (!raw || raw.toLowerCase() === "none" || raw.toLowerCase() === "off") {
    return [];
  }
  const parsed = parseSettingSourceList(raw);
  return parsed.length > 0 ? parsed : [];
}

export function grillMeModelFromEnv(env: NodeJS.ProcessEnv): ModelSelection | undefined {
  const idRaw = env.CURSOR_GRILL_ME_MODEL_ID?.trim();
  const paramsRaw = env.CURSOR_GRILL_ME_MODEL_PARAMS_JSON?.trim();
  if (!idRaw && !paramsRaw) {
    return undefined;
  }
  const id = idRaw || "composer-2";
  const params = paramsRaw ? parseModelParams(paramsRaw) : undefined;
  return params?.length ? { id, params } : { id };
}

/** SDK options appended to Grill-Me `runCursorAgent` calls */
export function mergeGrillMeCursorAgentOptions(
  decryptedUserApiKey: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): RunCursorAgentOptions {
  const model = grillMeModelFromEnv(env);
  const trimmedKey = decryptedUserApiKey?.trim();
  const localSettingSources = grillMeSettingSourcesFromEnv(env);

  const out: RunCursorAgentOptions = {
    ...(trimmedKey ? { apiKey: trimmedKey } : {}),
    ...(model ? { model } : {}),
    localSettingSources,
  };
  return out;
}

export function grillReasoningModelFromEnv(env: NodeJS.ProcessEnv): ModelSelection {
  const idRaw = env.CURSOR_GRILL_REASONING_MODEL_ID?.trim();
  const paramsRaw =
    env.CURSOR_GRILL_REASONING_MODEL_PARAMS_JSON?.trim() ||
    env.CURSOR_GRILL_ME_MODEL_PARAMS_JSON?.trim();
  const id = idRaw || "composer-2";
  const params = paramsRaw ? parseModelParams(paramsRaw) : undefined;
  return params?.length ? { id, params } : { id };
}

/** Overrides model selection for Prompt 1 (reasoning); keeps Grill-Me settingSources + apiKey. */
export function mergeGrillMeReasoningAgentOptions(
  decryptedUserApiKey: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): RunCursorAgentOptions {
  const chat = mergeGrillMeCursorAgentOptions(decryptedUserApiKey, env);
  return {
    ...(chat.apiKey ? { apiKey: chat.apiKey } : {}),
    ...(chat.localSettingSources !== undefined
      ? { localSettingSources: chat.localSettingSources }
      : {}),
    model: grillReasoningModelFromEnv(env),
  };
}
