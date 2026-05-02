import type { JSONContent } from "@tiptap/react";

/** Minimal TipTap doc from plain text (one paragraph per line) for read-only Novel preview. */
export function plainTextToProseDoc(text: string): JSONContent {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const content = lines.map((line) => ({
    type: "paragraph" as const,
    content: line.length ? [{ type: "text" as const, text: line }] : [],
  }));
  return {
    type: "doc",
    content: content.length ? content : [{ type: "paragraph", content: [] }],
  };
}
