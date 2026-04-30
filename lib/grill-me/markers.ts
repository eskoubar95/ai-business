/** Sentinelle som assistent-output skal indeholde for at slå soulfil til på `memory`. */
export const GRILL_ME_COMPLETE_MARKER = "[[GRILL_ME_COMPLETE]]";

export function stripCompletionMarkers(rawResponse: string): string {
  return rawResponse.replace(/\[\[GRILL_ME_COMPLETE\]\]/gi, "").trim();
}
