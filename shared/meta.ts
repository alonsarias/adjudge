export const KNOWN_META_KEYS = [
  "ad_archive_id",
  "ad_id",
  "page_id",
  "page_name",
  "page_is_deleted",
  "page_like_count",
  "page_categories",
  "page_profile_uri",
  "page_profile_picture_url",
  "is_active",
  "start_date",
  "end_date",
  "start_date_iso",
  "end_date_iso",
  "total_active_time",
  "body",
  "body.text",
  "title",
  "cta_text",
  "cta_type",
  "caption",
  "link_url",
  "link_description",
  "display_format",
  "images",
  "videos",
  "cards",
  "extra_texts",
  "extra_images",
  "extra_videos",
  "extra_links",
  "branded_content",
  "byline",
  "disclaimer_label",
  "publisher_platform",
  "targeted_or_reached_countries",
  "spend",
  "currency",
  "impressions",
  "impressions_with_index",
  "reach_estimate",
  "categories",
  "collation_id",
  "collation_count",
  "contains_digital_created_media",
  "contains_sensitive_content",
  "gated_type",
  "regional_regulation_data",
  "report_count",
  "has_user_reported",
  "hide_data_status",
  "fev_info",
  "state_media_run_label",
  "source_url",
  "ad_library_url",
  "thumb_url",
] as const;

export const META_SECTIONS: { title: string; keys: readonly string[] }[] = [
  {
    title: "Identity / page",
    keys: [
      "ad_archive_id",
      "ad_id",
      "page_id",
      "page_name",
      "page_is_deleted",
      "page_like_count",
      "page_categories",
      "page_profile_uri",
      "page_profile_picture_url",
    ],
  },
  {
    title: "Status / time",
    keys: ["is_active", "start_date", "end_date", "start_date_iso", "end_date_iso", "total_active_time"],
  },
  {
    title: "Creative",
    keys: [
      "body",
      "body.text",
      "title",
      "cta_text",
      "cta_type",
      "caption",
      "link_url",
      "link_description",
      "display_format",
      "images",
      "videos",
      "cards",
      "extra_texts",
      "extra_images",
      "extra_videos",
      "extra_links",
      "branded_content",
      "byline",
      "disclaimer_label",
    ],
  },
  {
    title: "Distribution / money / reach / misc",
    keys: [
      "publisher_platform",
      "targeted_or_reached_countries",
      "spend",
      "currency",
      "impressions",
      "impressions_with_index",
      "reach_estimate",
      "categories",
      "collation_id",
      "collation_count",
      "contains_digital_created_media",
      "contains_sensitive_content",
      "gated_type",
      "regional_regulation_data",
      "report_count",
      "has_user_reported",
      "hide_data_status",
      "fev_info",
      "state_media_run_label",
    ],
  },
  {
    title: "Derived",
    keys: ["source_url", "ad_library_url", "thumb_url"],
  },
];

const SECTION_KEY_SET = new Set(META_SECTIONS.flatMap((section) => [...section.keys]));

export const PRIMARY_TABLE_IDS = [
  "thumb",
  "page",
  "body",
  "headline",
  "cta",
  "platforms",
  "hook",
  "tactics",
  "headline_tactic",
  "messaging_angle",
  "offer_type",
  "seasonality",
  "intended_audience",
  "still_active",
  "running_days",
  "creative_score",
  "winner",
] as const;

const PICKER_SKIP = new Set([
  "body",
  "body.text",
  "title",
  "cta_text",
  "publisher_platform",
  "thumb_url",
  "page_name",
  "ad_archive_id",
]);

const MAX_DEPTH = 6;
const MAX_ARRAY_INDEX = 8;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function writeFlattened(
  out: Record<string, unknown>,
  prefix: string,
  value: unknown,
  depth: number,
): void {
  if (depth > MAX_DEPTH) {
    out[prefix] = value;
    return;
  }
  if (value == null) {
    if (!(prefix in out)) out[prefix] = null;
    return;
  }
  const rec = asRecord(value);
  if (rec) {
    out[prefix] = value;
    for (const [key, item] of Object.entries(rec)) {
      writeFlattened(out, `${prefix}.${key}`, item, depth + 1);
    }
    return;
  }
  if (Array.isArray(value)) {
    out[prefix] = value;
    if (value.every((item) => item == null || typeof item !== "object")) return;
    for (const [index, item] of value.entries()) {
      if (index >= MAX_ARRAY_INDEX) break;
      writeFlattened(out, `${prefix}[${index}]`, item, depth + 1);
    }
    return;
  }
  out[prefix] = value;
}

export function flattenMeta(
  node: Record<string, unknown>,
  snapshot: Record<string, unknown> | null,
  derived: {
    source_url: string;
    ad_library_url: string;
    thumb_url: string | null;
    start_date_iso: string | null;
    end_date_iso: string | null;
  },
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of KNOWN_META_KEYS) out[key] = null;

  for (const [key, value] of Object.entries(node)) {
    if (key === "snapshot") continue;
    writeFlattened(out, key, value, 0);
  }

  if (snapshot) {
    for (const [key, value] of Object.entries(snapshot)) {
      const dest = Object.hasOwn(node, key) ? `snapshot.${key}` : key;
      writeFlattened(out, dest, value, 0);
    }
  }

  out.source_url = derived.source_url;
  out.ad_library_url = derived.ad_library_url;
  out.thumb_url = derived.thumb_url;
  out.start_date_iso = derived.start_date_iso;
  out.end_date_iso = derived.end_date_iso;
  return out;
}

export function collectMetaKeys(metas: Array<Record<string, unknown> | null | undefined>): string[] {
  const extras: string[] = [];
  const seen = new Set<string>(KNOWN_META_KEYS);
  for (const meta of metas) {
    if (!meta) continue;
    for (const key of Object.keys(meta)) {
      if (seen.has(key)) continue;
      seen.add(key);
      extras.push(key);
    }
  }
  extras.sort();
  return [...KNOWN_META_KEYS, ...extras];
}

export function pickerKeys(metas: Array<Record<string, unknown> | null | undefined>): string[] {
  return collectMetaKeys(metas).filter((key) => !PICKER_SKIP.has(key));
}

export function unsectionedMetaKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => !SECTION_KEY_SET.has(key));
}
