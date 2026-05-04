import type { GrillMeMessage } from "@/lib/grill-me/session-queries";

/**
 * Compact Grill-Me thread for soul finpudsning — fresh “agent context” anchor without
 * replaying the full raw session in the client.
 */
export function formatGrillTranscriptForSoulRefine(
  turns: GrillMeMessage[],
  maxTotalChars = 14_000,
): string {
  if (turns.length === 0) return "(Ingen Grill-Me-samtale gemt for denne virksomhed.)";

  const blocks: string[] = [];
  let total = 0;

  // Newest first so a tight budget keeps the latest founder/assistant signal; output stays chronological.
  for (let i = turns.length - 1; i >= 0; i--) {
    const m = turns[i]!;
    const label = m.role === "user" ? "Founder" : "Grill-Me";
    let body = m.content
      .replace(/\[\[GRILL_ME_COMPLETE\]\]/gi, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (body.length > 1_400) body = `${body.slice(0, 1_397)}…`;

    const line = `**${label}:** ${body}\n\n`;
    if (total + line.length > maxTotalChars) {
      blocks.unshift(
        "*(Ældre beskeder udeladt af pladshensyn — brug soul-markdown som sandhed.)*\n\n",
      );
      break;
    }
    blocks.unshift(line);
    total += line.length;
  }

  return blocks.join("").trim();
}
