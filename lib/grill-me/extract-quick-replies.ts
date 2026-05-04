export type GrillQuickReply = {
  id: string;
  label: string;
  /** Full text sent as the user message (e.g. "A) Option text") */
  value: string;
};

export type SplitQuickRepliesOptions = {
  /** Max characters per chip label before ellipsis (default 56). Soul editor uses a higher value. */
  maxChipLabelLength?: number;
};

/**
 * Splits trailing `A) …`–`E) …` lines from assistant text for display (body without options)
 * while preserving quick-reply chips. Only a contiguous block at the **end** of the message
 * is treated as options (after trimming blank lines).
 */
export function splitAssistantBodyAndQuickReplies(
  assistantPlainText: string,
  options?: SplitQuickRepliesOptions,
): {
  body: string;
  quickReplies: GrillQuickReply[];
} {
  const cap = options?.maxChipLabelLength ?? 56;
  const lines = assistantPlainText.split(/\r?\n/);
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === "") end--;

  const replyLineStrings: string[] = [];
  while (end > 0) {
    const line = lines[end - 1].trim();
    const m = line.match(/^([A-Ea-e])[\.\)]\s+(.+)$/);
    if (!m) break;
    replyLineStrings.unshift(line);
    end--;
  }

  while (end > 0 && lines[end - 1].trim() === "") end--;

  const body = lines.slice(0, end).join("\n").trimEnd();
  const quickReplies: GrillQuickReply[] = [];
  for (const raw of replyLineStrings) {
    const line = raw.trim();
    const m = line.match(/^([A-Ea-e])[\.\)]\s+(.+)$/);
    if (!m) continue;
    const letter = m[1].toUpperCase();
    const rest = m[2].trim();
    const short =
      rest.length > cap ? `${rest.slice(0, Math.max(0, cap - 1))}…` : rest;
    quickReplies.push({
      id: letter,
      label: `${letter}. ${short}`,
      value: `${letter}) ${rest}`,
    });
  }
  return { body, quickReplies };
}

/**
 * Parses lines like `A) First option` … `E) Something else` from assistant plain text
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
