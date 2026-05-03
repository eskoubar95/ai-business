export type GrillQuickReply = {
  id: string;
  label: string;
  /** Full text sent as the user message (e.g. "A) Option text") */
  value: string;
};

/**
 * Parses lines like `A) First option` … `E) Something else` from the latest assistant turn
 * so the UI can show tap-to-reply chips (onboarding / dashboard Grill-Me).
 */
export function extractGrillQuickReplies(assistantPlainText: string): GrillQuickReply[] {
  const lines = assistantPlainText.split(/\r?\n/);
  const out: GrillQuickReply[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^([A-Ea-e])[\.\)]\s+(.+)$/);
    if (!m) continue;
    const letter = m[1].toUpperCase();
    const rest = m[2].trim();
    if (!rest) continue;
    const value = `${letter}) ${rest}`;
    const short = rest.length > 56 ? `${rest.slice(0, 53)}…` : rest;
    out.push({
      id: letter,
      label: `${letter}. ${short}`,
      value,
    });
    if (out.length >= 8) break;
  }
  return out;
}
