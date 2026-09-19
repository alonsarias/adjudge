export function serializeValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(serializeValue).filter(Boolean).join("; ");
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
