import { serializeValue } from "../shared/serialize.ts";
import type { ClassifiedAd } from "../shared/types.ts";

const COLUMNS = [
  "id",
  "page_name",
  "page_id",
  "body",
  "headline",
  "cta_text",
  "cta_type",
  "platforms",
  "is_active",
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
] as const;

function cell(ad: ClassifiedAd, key: (typeof COLUMNS)[number]): string {
  const classification = ad.classification;
  switch (key) {
    case "platforms":
      return ad.platforms.join("; ");
    case "hook":
      return classification?.hook?.choice ?? "";
    case "tactics":
      return classification?.tactics.join("; ") ?? "";
    case "asset_type":
    case "visual_format":
    case "messaging_angle":
    case "headline_tactic":
    case "seasonality":
    case "offer_type":
    case "intended_audience":
      return classification?.[key]?.choice ?? "";
    default:
      return serializeValue(ad[key]);
  }
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll("\"", "\"\"")}"`;
  return value;
}

export function adsToCsv(ads: ClassifiedAd[]): string {
  const header = COLUMNS.join(",");
  const rows = ads.map((ad) => COLUMNS.map((key) => escapeCsv(cell(ad, key))).join(","));
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
