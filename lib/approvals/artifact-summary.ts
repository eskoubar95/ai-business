/** Human-readable one-liner for approval artifact JSON (UI + lists). */
export function summarizeArtifactRef(ref: Record<string, unknown>): string {
  const title = ref.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  const keys = Object.keys(ref);
  if (keys.length === 0) return "(no reference)";
  return keys.slice(0, 3).join(", ") + (keys.length > 3 ? "…" : "");
}
