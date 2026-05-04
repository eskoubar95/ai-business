import { stripCompletionMarkers } from "@/lib/grill-me/markers";

/** Extracts soul markdown body from final assistant completion (fence optional). */
export function extractSoulMarkdownBody(rawAssistant: string): string {
  const withoutMarkerTokens = stripCompletionMarkers(rawAssistant);
  const fenced = withoutMarkerTokens.match(/```(?:markdown)?\s*\n([\s\S]*?)```/im);
  if (fenced?.[1]?.trim())
    return fenced[1].trim();
  return withoutMarkerTokens.trim();
}

/**
 * When the file starts with a markdown code fence, return the inner markdown.
 * - If a closing ``` line exists, strip fence + inner only.
 * - If there is **no** closing fence (broken paste), still strip the opening fence line so
 *   TipTap does not treat the entire soul as one `codeBlock`.
 */
export function stripOuterMarkdownFenceIfWholeFile(md: string): string {
  const raw = md.replace(/^\uFEFF/, "").trim();
  if (!raw.startsWith("```")) return raw;

  const firstNl = raw.indexOf("\n");
  const openingLine = firstNl === -1 ? raw : raw.slice(0, firstNl).trim();
  if (!/^```[\t ]*(?:[a-z0-9_-]+)?[\t ]*$/i.test(openingLine)) return raw;

  const body = firstNl === -1 ? "" : raw.slice(firstNl + 1);
  const lines = body.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "```") {
      return lines.slice(0, i).join("\n").trimEnd();
    }
  }
  return body.trimEnd();
}
