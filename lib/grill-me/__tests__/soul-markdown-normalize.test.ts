import { describe, expect, it } from "vitest";

import { stripOuterMarkdownFenceIfWholeFile } from "@/lib/grill-me/soul-markdown-from-response";
import { normalizeSoulMarkdownForEditor } from "@/lib/grill-me/soul-markdown-normalize";

describe("stripOuterMarkdownFenceIfWholeFile", () => {
  it("unwraps when the entire file is one fenced block", () => {
    const inner = "# Title\n\n## 1. One\nx\n";
    const wrapped = "```markdown\n" + inner + "\n```";
    expect(stripOuterMarkdownFenceIfWholeFile(wrapped)).toBe(inner.trimEnd());
  });

  it("strips opening fence even when closing fence is missing (broken paste)", () => {
    const inner = "# Title\n\nBody\n";
    expect(stripOuterMarkdownFenceIfWholeFile("```markdown\n" + inner)).toBe(inner.trimEnd());
  });

  it("leaves normal soul markdown unchanged", () => {
    const md = "# Hi\n\n## 1. A\nb\n";
    expect(stripOuterMarkdownFenceIfWholeFile(md)).toBe(md.trim());
  });
});

describe("normalizeSoulMarkdownForEditor", () => {
  it("unwraps fence then truncates duplicate template", () => {
    const first = "## 1. A\nx\n## 2. B\ny\n## 3. C\nz\n";
    const doubled = "```markdown\n" + first + "\n" + first + "\n```";
    expect(normalizeSoulMarkdownForEditor(doubled)).toBe(first.trimEnd());
  });
});
