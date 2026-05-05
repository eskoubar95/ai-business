/**
 * Deterministic JSON serialization for shard hashing (stable key order).
 */
export function canonicalStringify(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number" || t === "boolean") return JSON.stringify(value);
  if (t === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalStringify(item)).join(",") + "]";
  }
  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return "{" + keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`).join(",") + "}";
  }
  throw new Error(`Unsupported JSON value type for canonical stringify: ${String(value)}`);
}
