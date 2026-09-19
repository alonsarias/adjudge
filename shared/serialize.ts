import { displayValue } from "./empty.ts";

export function serializeValue(value: unknown): string {
  return displayValue(value);
}
