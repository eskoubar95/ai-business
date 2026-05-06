import { AGENT_PLATFORM_ICON_IDS, type AgentPlatformIconId } from "@/lib/agents/agent-platform-icon-ids";

/** Max UTF-8 size for stored `agents.avatar_url` when using `data:image/...` (base64 inflates vs raw bytes). */
export const MAX_AGENT_AVATAR_BYTES = 2 * 1024 * 1024;

/** Prefix slack for typical `data:image/png;base64,` variants when sizing raw uploads. */
const DATA_URL_PREFIX_RESERVE_UTF8 = 72;

/** Allowed image subtypes after `data:image/` (no SVG/HTML — reduces script-in-svg risk in unusual render paths). */
const ALLOWED_INLINE_IMAGE_SUBTYPES = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Max raw binary size for a picked file before `readAsDataURL` so UTF-8 result stays ≤ `MAX_AGENT_AVATAR_BYTES`. */
export function maxAvatarUploadFileBytes(
  storedUtf8Budget: number = MAX_AGENT_AVATAR_BYTES,
): number {
  return Math.floor(((storedUtf8Budget - DATA_URL_PREFIX_RESERVE_UTF8) * 3) / 4);
}

function assertAllowedInlineImageDataUrl(trimmed: string): void {
  const m = /^data:image\/([^;,]+)/i.exec(trimmed);
  const subtype = m?.[1]?.toLowerCase();
  if (!subtype || !ALLOWED_INLINE_IMAGE_SUBTYPES.has(subtype.replace(/^x-/, ""))) {
    throw new Error(
      "Inline avatar must be PNG, JPEG, GIF, or WebP (SVG not allowed)",
    );
  }
  if (!/;base64,/.test(trimmed)) {
    throw new Error("Avatar data URL must be base64-encoded");
  }
}

/** Accepts persisted `agents.avatar_url`: HTTPS URLs or data URLs for inlined uploads. */
export function assertValidAgentAvatarUrl(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Avatar URL cannot be blank");
  if (trimmed.startsWith("data:image/")) {
    assertAllowedInlineImageDataUrl(trimmed);
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
    throw new Error("Avatar URL must be https://... or an allowed inline image data URL");
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
