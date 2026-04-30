export type AgentMention = { agentSlug: string; message: string };

/**
 * Extracts `!agent-slug` mentions from free text. Text after each bang-tag until the next
 * `!` or end of string becomes `message`.
 *
 * @example parseAgentMentions("Hello !grill-me please review") → [{ agentSlug: "grill-me", message: "please review" }]
 */
export function parseAgentMentions(commentText: string): AgentMention[] {
  const text = commentText ?? "";
  const re = /!([a-zA-Z0-9_-]+)/g;
  const results: AgentMention[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const slug = m[1].toLowerCase();
    const afterBang = m.index + m[0].length;
    const rest = text.slice(afterBang);
    const nextIdx = rest.search(/!/);
    const end = nextIdx === -1 ? text.length : afterBang + nextIdx;
    const message = text.slice(afterBang, end).trim();
    results.push({ agentSlug: slug, message });
  }
  return results;
}
