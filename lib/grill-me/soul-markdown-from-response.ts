import { stripCompletionMarkers } from "@/lib/grill-me/markers";

/** Extracts soul markdown body from final assistant completion (fence optional). */
export function extractSoulMarkdownBody(rawAssistant: string): string {
  const withoutMarkerTokens = stripCompletionMarkers(rawAssistant);
  const fenced = withoutMarkerTokens.match(/```(?:markdown)?\s*\n([\s\S]*?)```/im);
  if (fenced?.[1]?.trim())
    return fenced[1].trim();
  return withoutMarkerTokens.trim();
}
