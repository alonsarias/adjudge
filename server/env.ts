import { DEFAULT_WINNER_DAYS_MIN, DEFAULT_WINNER_SCORE_MIN } from "../shared/winner.ts";
import type { WinnerThresholds } from "../shared/types.ts";

export function hasTypeSafeKey(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY?.trim());
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function winnerThresholds(): WinnerThresholds {
  return {
    scoreMin: readInt("WINNER_SCORE_MIN", DEFAULT_WINNER_SCORE_MIN),
    daysMin: readInt("WINNER_DAYS_MIN", DEFAULT_WINNER_DAYS_MIN),
  };
}
