/** Allowlist for agents.icon_key — must stay aligned with picker UI icons. */

export const AGENT_PLATFORM_ICON_IDS = [
  "bot",
  "brain",
  "cpu",
  "zap",
  "shield",
  "target",
  "globe",
  "eye",
  "code",
  "search",
  "layers",
  "chart",
  "pen",
  "palette",
  "wrench",
  "users",
  "star",
  "bulb",
  "rocket",
  "flask",
] as const;

export type AgentPlatformIconId = (typeof AGENT_PLATFORM_ICON_IDS)[number];

export function isAgentPlatformIconId(value: unknown): value is AgentPlatformIconId {
  return typeof value === "string" && AGENT_PLATFORM_ICON_IDS.includes(value as AgentPlatformIconId);
}
