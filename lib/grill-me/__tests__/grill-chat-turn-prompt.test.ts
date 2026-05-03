import { describe, expect, it } from "vitest";

import { buildGrillChatTurnPrompt } from "@/lib/grill-me/grill-chat-turn-prompt";
import { minimalFallbackReasoningContext } from "@/lib/grill-me/grill-reasoning-types";

describe("buildGrillChatTurnPrompt", () => {
  it("injects reasoning JSON + soul template placeholders", () => {
    const r = minimalFallbackReasoningContext("new", "Acme", "We do AI widgets");
    const p = buildGrillChatTurnPrompt([], "Hi", "new", r);
    expect(p.startsWith("# Grill-Me — chat system (Prompt 2)")).toBe(true);
    expect(p).toContain("### Context object (JSON)");
    expect(p).toContain('"businessType": "new"');
    expect(p).toContain("# [Business Name] — Soul Document");
    expect(p).toContain("# Conversation transcript");
    expect(p).toContain("user: Hi");
  });
});
