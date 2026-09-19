import type { ClassifiedAd, ScrapedAd, WinnerThresholds } from "./types.ts";

export const DEFAULT_WINNER_SCORE_MIN = 70;
export const DEFAULT_WINNER_DAYS_MIN = 14;

export const WINNER_TOOLTIP =
  "Heuristic: creative_score + longevity. Not Ads Manager performance.";

const DAY_MS = 86_400_000;

export function parseTimeMs(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum) && asNum > 0) return parseTimeMs(asNum);
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function stillActiveFrom(isActive: boolean | null | undefined): boolean | null {
  return typeof isActive === "boolean" ? isActive : null;
}

export function runningDaysFrom(
  start: unknown,
  end: unknown,
  stillActive: boolean | null,
  now = Date.now(),
): number | null {
  const startMs = parseTimeMs(start);
  if (startMs == null) return null;
  const endMs =
    stillActive === true || parseTimeMs(end) == null ? now : parseTimeMs(end);
  if (endMs == null) return null;
  return Math.max(0, Math.floor((endMs - startMs) / DAY_MS));
}

export function winnerFrom(
  creativeScore: number | null,
  runningDays: number | null,
  thresholds: WinnerThresholds,
): boolean | null {
  if (creativeScore == null || runningDays == null) return null;
  return creativeScore >= thresholds.scoreMin && runningDays >= thresholds.daysMin;
}

export function applyWinnerSignals<T extends ScrapedAd>(
  ad: T,
  thresholds: WinnerThresholds,
  now = Date.now(),
): T {
  const still_active = stillActiveFrom(ad.is_active);
  const running_days = runningDaysFrom(
    ad.start_date ?? ad.started_at,
    ad.end_date ?? ad.stopped_at,
    still_active,
    now,
  );
  const classified = ad as T & Partial<ClassifiedAd>;
  const creative_score = classified.classification?.creative_score ?? null;
  return {
    ...ad,
    still_active,
    running_days,
    creative_score,
    winner: winnerFrom(creative_score, running_days, thresholds),
  };
}
