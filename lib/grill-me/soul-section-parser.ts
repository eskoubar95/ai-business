/** Parse Soul markdown into numbered `## N. Title` sections for nav + scroll-spy. */

export type SoulConfidence = "validated" | "hypothesis" | "unknown";

export type ParsedSoulSection = {
  num: number;
  title: string;
  slug: string;
  /** Full markdown for this slice, including its `##` heading line */
  markdown: string;
  startOffset: number;
  endOffset: number;
  confidence: SoulConfidence;
};

const HEADING_RE = /^##\s+(\d+)\.\s+(.+)$/gm;

export function inferSectionConfidence(sectionMarkdown: string): SoulConfidence {
  const t = sectionMarkdown;
  if (/\[UNKNOWN\b/i.test(t) || /\[UNKNOWN —/i.test(t)) return "unknown";
  if (/\[HYPOTHESIS\]/i.test(t) || /\(HYPOTHESIS/i.test(t) || /\bHYPOTHESIS\b/i.test(t))
    return "hypothesis";
  if (/\[UNKNOWN — to be defined\]/i.test(t)) return "unknown";
  return "validated";
}

/**
 * Heading looks like Grill-Me main title.
 */
export function parseSoulDocTitle(markdown: string, fallbackName: string): string {
  const firstLine = markdown.split(/\r?\n/).find((l) => l.trim().length)?.trim();
  if (firstLine?.startsWith("# ")) return firstLine.replace(/^#\s+/, "").trim() || fallbackName;
  return `${fallbackName} — Soul Document`;
}

export function extractSoulSubtitleLine(markdown: string): string | null {
  const lines = markdown.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 1; i < Math.min(lines.length, 10); i++) {
    const l = lines[i];
    if (l.startsWith("*") && (l.includes("Grill") || l.includes("Generated")))
      return l.replace(/^\*\s*/, "").replace(/\*\s*$/, "");
  }
  return null;
}

export function clipAssistantTranscriptSnippet(content: string, maxChars = 500): string {
  let out = content;
  const fb = out.indexOf("```markdown");
  if (fb !== -1) out = out.slice(0, fb).trimEnd();
  if (out.length <= maxChars) return out.trim();
  return `${out.slice(0, maxChars).trim()}…`;
}

/** Section nav label: number + abbreviated title */
export function shortenNavTitle(title: string, max = 20): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function parseSoulMarkdownSections(source: string): ParsedSoulSection[] {
  const out: ParsedSoulSection[] = [];
  const matches = [...source.matchAll(HEADING_RE)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const idx = m.index!;
    const endIdx = matches[i + 1]?.index ?? source.length;
    const numStr = m[1] ?? "";
    const title = (m[2] ?? "").trim();
    const num = Number(numStr);
    if (!Number.isFinite(num) || num < 0) continue;
    const slug = `soul-section-${numStr}`;
    const markdown = source.slice(idx, endIdx);
    const confidence = inferSectionConfidence(markdown);
    out.push({
      num,
      title: title || `Sektion ${num}`,
      slug,
      markdown,
      startOffset: idx,
      endOffset: endIdx,
      confidence,
    });
  }
  return out;
}
