import { stripOuterMarkdownFenceIfWholeFile } from "@/lib/grill-me/soul-markdown-from-response";
import { truncateAppendedSoulDocumentDuplicate } from "@/lib/grill-me/soul-section-parser";

/**
 * Normalizes soul markdown for the TipTap editor and section nav:
 * strips a whole-file ```markdown fence if present (fixes single code-block rendering),
 * then removes a duplicated full template pasted after the first `## 1.`.
 */
export function normalizeSoulMarkdownForEditor(md: string): string {
  let t = md.replace(/^\uFEFF/, "").trim();
  if (!t) return md.trim();
  let prev = "";
  while (t !== prev) {
    prev = t;
    t = stripOuterMarkdownFenceIfWholeFile(t).trim();
  }
  return truncateAppendedSoulDocumentDuplicate(t).trimEnd();
}
