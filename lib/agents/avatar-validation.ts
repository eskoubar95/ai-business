import { AGENT_PLATFORM_ICON_IDS, type AgentPlatformIconId } from "@/lib/agents/agent-platform-icon-ids";

/** Two megabytes — aligns with Agent settings UI helper copy. */
export const MAX_AGENT_AVATAR_BYTES = 2 * 1024 * 1024;

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Accepts persisted `agents.avatar_url`: HTTPS URLs or data URLs for inlined uploads. */
export function assertValidAgentAvatarUrl(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Avatar URL cannot be blank");
  if (trimmed.startsWith("data:image/")) {
    if (utf8ByteLength(trimmed) > MAX_AGENT_AVATAR_BYTES) {
      throw new Error(`Avatar exceeds ${MAX_AGENT_AVATAR_BYTES} bytes after encoding`);
    }
    return;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error("Avatar URL must be https://... or data:image/*");
  }
}

export function normalizeAgentIconKeyForSave(value: unknown): AgentPlatformIconId | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("Icon key invalid");
  if (!AGENT_PLATFORM_ICON_IDS.includes(value as AgentPlatformIconId)) {
    throw new Error("Icon key outside platform allowlist");
  }
  return value as AgentPlatformIconId;
}
