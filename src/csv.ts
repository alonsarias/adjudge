import { displayValue } from "../shared/empty.ts";
import { collectMetaKeys } from "../shared/meta.ts";
import type { ClassifiedAd } from "../shared/types.ts";

const FIXED_COLUMNS = [
  "id",
  "page_name",
  "page_id",
  "body",
  "headline",
  "cta_text",
  "cta_type",
  "caption",
  "link_description",
  "platforms",
  "is_active",
  "start_date",
  "end_date",
  "started_at",
  "stopped_at",
  "media_type",
  "sourceUrl",
  "ad_library_url",
  "link_url",
  "hook",
  "tactics",
  "asset_type",
  "visual_format",
  "messaging_angle",
  "headline_tactic",
  "seasonality",
  "offer_type",
  "intended_audience",
  "still_active",
  "running_days",
  "creative_score",
  "winner",
] as const;

const FIXED_SET = new Set<string>(FIXED_COLUMNS);

const CHOICE_KEYS = [
  "hook",
  "asset_type",
  "visual_format",
  "messaging_angle",
  "headline_tactic",
  "seasonality",
  "offer_type",
  "intended_audience",
] as const;

function cell(ad: ClassifiedAd, key: string): string {
  const classification = ad.classification;
  if (key === "platforms") return displayValue(ad.platforms);
  if (key === "tactics") return displayValue(classification?.tactics);
  if ((CHOICE_KEYS as readonly string[]).includes(key)) {
    const field = classification?.[key as (typeof CHOICE_KEYS)[number]];
    return displayValue(field?.choice);
  }
  if (key in ad) return displayValue(ad[key as keyof ClassifiedAd]);
  return displayValue(ad.meta?.[key]);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll("\"", "\"\"")}"`;
  return value;
}

export function csvColumns(ads: ClassifiedAd[]): string[] {
  const extra = collectMetaKeys(ads.map((ad) => ad.meta)).filter((key) => !FIXED_SET.has(key));
  return [...FIXED_COLUMNS, ...extra];
}

export function adsToCsv(ads: ClassifiedAd[]): string {
  const columns = csvColumns(ads);
  const header = columns.join(",");
  const rows = ads.map((ad) => columns.map((key) => escapeCsv(cell(ad, key))).join(","));
  return [header, ...rows].join("\n");
}

export function downloadCsv(ads: ClassifiedAd[]): void {
  const blob = new Blob([adsToCsv(ads)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `adjudge-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
