import { describe, expect, it } from "vitest";
import {
  getAuthorLabel,
  getMonogram,
  hastToHtml,
  slugifyTaskTitleSegment,
} from "../task-detail-helpers";
import type { LogEntry } from "../task-detail-types";

describe("slugifyTaskTitleSegment", () => {
  it("lowercases and collapses separators", () => {
    expect(slugifyTaskTitleSegment("MercFlow V2 Beta!!")).toBe("mercflow-v2-beta");
  });

  it("trims to 40 chars", () => {
    expect(slugifyTaskTitleSegment("a".repeat(100)).length).toBe(40);
  });
});

describe("hastToHtml", () => {
  it("escapes text content", () => {
    expect(hastToHtml({ type: "text", value: "<x>&\"" })).toBe("&lt;x&gt;&amp;\"");
  });

  it("walks roots and spans", () => {
    const node = {
      type: "root",
      children: [
        { type: "element", tagName: "span", properties: { className: ["hl-keyword"] }, children: [{ type: "text", value: "ok" }] },
      ],
    };
    expect(hastToHtml(node)).toContain("hl-keyword");
    expect(hastToHtml(node)).toContain("ok");
  });
});

describe("getAuthorLabel / getMonogram", () => {
  const uid = "u1";
  const agents: Record<string, string> = { a1: "Alpha Bot" };

  it("labels current human as You / ME", () => {
    const log: LogEntry = {
      id: "1",
      authorType: "human",
      authorId: uid,
      content: "",
      createdAt: new Date(),
    };
    expect(getAuthorLabel(log, uid, agents)).toBe("You");
    expect(getMonogram(log, uid, agents)).toBe("ME");
  });

  it("shows agent friendly name monogram", () => {
    const log: LogEntry = {
      id: "2",
      authorType: "agent",
      authorId: "a1",
      content: "",
      createdAt: new Date(),
    };
    expect(getAuthorLabel(log, uid, agents)).toBe("Alpha Bot");
    expect(getMonogram(log, uid, agents)).toBe("AL");
  });
});
