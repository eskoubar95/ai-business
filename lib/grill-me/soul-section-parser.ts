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

/** Numbered soul sections: `## 1. Title` or `### 1. Title` (model sometimes emits h3). */
const HEADING_RE = /^#{2,3}\s+(\d+)\.\s+(.+)$/gm;

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

/**
 * When the model pastes the full soul twice, a second `## 1.` appears after a full numbered run.
 * Keeps the first copy only (common failure mode from refine).
 */
export function truncateAppendedSoulDocumentDuplicate(md: string): string {
  const n = md.replace(/\r\n/g, "\n");
  const re = /^#{2,3}\s+1\.\s+/gm;
  const matches = [...n.matchAll(re)];
  if (matches.length < 2) return md;
  const firstIdx = matches[0].index ?? 0;
  const secondIdx = matches[1].index ?? 0;
  if (secondIdx <= firstIdx) return md;
  const between = n.slice(firstIdx, secondIdx);
  const numberedHeadings = between.match(/^#{2,3}\s+\d+\.\s+/gm) ?? [];
  const gap = secondIdx - firstIdx;
  const looksLikeFullSoulPaste =
    numberedHeadings.length >= 3 ||
    gap >= 1500 ||
    /^#{2,3}\s+10\.\s+/m.test(between) ||
    /^#{2,3}\s+9\.\s+/m.test(between);
  if (looksLikeFullSoulPaste) {
    return n.slice(0, secondIdx).trimEnd();
  }
  return md;
}

/** Nav-safe label (model/HTML sometimes leaves entities in headings). */
export function decodeSoulNavTitle(title: string): string {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
    // Occurrence index keeps keys/DOM ids unique when the doc has two `## 1.` blocks.
    const slug = `soul-section-${numStr}-${i}`;
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

/** Non-validated sections (for AI / refine prompts). */
export function formatSoulNavGapSummary(source: string): string {
  const secs = parseSoulMarkdownSections(source);
  const gaps = secs.filter((s) => s.confidence !== "validated");
  if (gaps.length === 0) return "";
  const body = gaps
    .map((s) => `- ${s.num}. ${s.title}: **${s.confidence}** (check [HYPOTHESIS] / [UNKNOWN] markers in body)`)
    .join("\n");
  return `\n## Section confidence overview (sidebar)\n${body}\n`;
}
