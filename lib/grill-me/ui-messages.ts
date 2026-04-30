import type { UIMessage } from "ai";

import type { GrillMeMessage } from "@/lib/grill-me/session-queries";

export function grillMessagesToUIMessages(
  turns: GrillMeMessage[],
): UIMessage[] {
  return turns.map((t) => ({
    id: t.id,
    role: t.role,
    parts: [{ type: "text", text: t.content }],
  }));
}

export function textFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
