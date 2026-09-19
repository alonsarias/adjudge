export const NO_VALUE = "No value";

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (value === "") return true;
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  if (typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>);
    return values.length === 0 || values.every(isEmptyValue);
  }
  return false;
}

export function displayValue(value: unknown): string {
  if (isEmptyValue(value)) return NO_VALUE;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const parts = value.map(displayValue).filter((item) => item !== NO_VALUE);
    return parts.length ? parts.join("; ") : NO_VALUE;
  }
  try {
    const json = JSON.stringify(value);
    if (!json || json === "{}" || json === "[]") return NO_VALUE;
    return json;
  } catch {
    return NO_VALUE;
  }
}
