/**
 * Strips optional ```json fences and returns first JSON object substring.
 */
export function extractFirstJsonObject(raw: string): Record<string, unknown> | null {
  let t = raw.trim();
  const fence = t.match(/^```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fence?.[1]) t = fence[1].trim();

  const objStart = t.indexOf("{");
  const objEnd = t.lastIndexOf("}");
  if (objStart === -1 || objEnd === -1 || objEnd <= objStart) return null;

  const slice = t.slice(objStart, objEnd + 1);
  try {
    return JSON.parse(slice) as Record<string, unknown>;
  } catch {
    return null;
  }
}
