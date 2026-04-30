import { describe, expect, it } from "vitest";

import { parseAgentMentions } from "@/lib/notion/parser";

describe("parseAgentMentions", () => {
  it("parses plan example", () => {
    expect(parseAgentMentions("Hello !grill-me please review")).toEqual([
      { agentSlug: "grill-me", message: "please review" },
    ]);
  });

  it("normalizes slug to lowercase and handles multiple tags", () => {
    expect(parseAgentMentions("!Agent-One hi !agent-two there")).toEqual([
      { agentSlug: "agent-one", message: "hi" },
      { agentSlug: "agent-two", message: "there" },
    ]);
  });
});
