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

  for (const m of turns) {
    const label = m.role === "user" ? "Founder" : "Grill-Me";
    let body = m.content
      .replace(/\[\[GRILL_ME_COMPLETE\]\]/gi, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (body.length > 1_400) body = `${body.slice(0, 1_397)}…`;

    const line = `**${label}:** ${body}\n\n`;
    if (total + line.length > maxTotalChars) {
      blocks.push("*(Ældre beskeder udeladt af pladshensyn — brug soul-markdown som sandhed.)*\n");
      break;
    }
    blocks.push(line);
    total += line.length;
  }

  return blocks.join("").trim();
}
