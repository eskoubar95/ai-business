/**
 * Guards soul editor AI turns from catastrophic markdown replacement
 * and classifies messages that should be guidance-only (no file rewrite).
 */

/** Same pattern as soul-section-parser numbered sections. */
const NUMBERED_HEADING_LINE = /^#{2,3}\s+\d+\.\s+/gm;

export function countNumberedSoulHeadings(md: string): number {
  return (md.match(NUMBERED_HEADING_LINE) ?? []).length;
}

export function isUnsafeSoulRefineOutput(previousMarkdown: string, candidateMarkdown: string): boolean {
  const prev = previousMarkdown.trim();
  const next = candidateMarkdown.trim();
  if (!prev) return false;
  if (!next) return true;

  if (prev.length > 400 && next.length < Math.min(500, prev.length * 0.28)) {
    return true;
  }

  const hp = countNumberedSoulHeadings(prev);
  const hn = countNumberedSoulHeadings(next);
  if (hp >= 3 && hn < 2) return true;
  if (hp >= 5 && hn < Math.ceil(hp * 0.55)) return true;
  if (hp >= 3 && hn > 0 && hn < hp - 2) return true;

  return false;
}

/**
 * User wants conversational validation / hypotheses like Grill-Me, not an immediate full rewrite.
 * Overridden when they clearly order a document mutation.
 */
export function wantsGuidanceOnlySoulTurn(userMessage: string): boolean {
  const t = userMessage.toLowerCase().normalize("NFKD");

  const explicitEdit =
    /\bopdater\w*\b/.test(t) &&
    /\b(dokument|soul|fil|markdown|afsnit|teksten)\b/.test(t) &&
    !/\b(ingen opdater|ikke opdater|uden at opdater)\b/.test(t);

  if (explicitEdit) return false;

  const strongEditPhrases = [
    "skriv det ind i",
    "indsæt i dokument",
    "erstat afsnit",
    "ret hele dokument",
    "gem ændring i soul",
    "apply to the document",
    "update the document",
    "rewrite the full",
  ];
  if (strongEditPhrases.some((p) => t.includes(p))) return false;

  const guidanceHints = [
    "hypotes",
    "hypothesis",
    "valider",
    "validere",
    "validated",
    "unknown",
    "gennemgå",
    "gennemga",
    "gå igennem",
    "ga igennem",
    "spørgsmål",
    "sporgsmal",
    "en ad gangen",
    "et ad gangen",
    "punkt for punkt",
    "hvad mener du",
    "hjælp mig",
    "diskuter",
    "forklar",
    "lad os tage",
  ];
  return guidanceHints.some((h) => t.includes(h));
}
