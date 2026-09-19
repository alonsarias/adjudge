import { flattenMeta } from "../shared/meta.ts";
import type { ScrapedAd } from "../shared/types.ts";
import { DEFAULT_WINNER_DAYS_MIN, DEFAULT_WINNER_SCORE_MIN, applyWinnerSignals } from "../shared/winner.ts";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function rawDate(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((item): item is string => Boolean(item));
}

function unixToIso(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    const asNum = Number(value);
    if (Number.isFinite(asNum) && asNum > 0) return unixToIso(asNum);
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const ms = value < 1e12 ? value * 1000 : value;
  return new Date(ms).toISOString();
}

function readBody(snapshot: Record<string, unknown> | null): string | null {
  if (!snapshot) return null;
  const chunks: string[] = [];
  const body = snapshot.body;
  if (typeof body === "string") chunks.push(body);
  const bodyRec = asRecord(body);
  if (bodyRec) {
    const text = asString(bodyRec.text);
    if (text) chunks.push(text);
    const markup = asString(bodyRec.markup);
    if (markup) chunks.push(stripMarkup(markup));
  }
  const cards = Array.isArray(snapshot.cards) ? snapshot.cards : [];
  for (const card of cards) {
    const rec = asRecord(card);
    if (!rec) continue;
    const cardBody = rec.body;
    if (typeof cardBody === "string") chunks.push(cardBody);
    const cardBodyRec = asRecord(cardBody);
    const cardText = cardBodyRec ? asString(cardBodyRec.text) : null;
    if (cardText) chunks.push(cardText);
  }
  const extras = asRecord(snapshot.extra_links) ?? asRecord(snapshot.extras);
  if (extras) {
    const extraText = asString(extras.text) ?? asString(extras.body);
    if (extraText) chunks.push(extraText);
  }
  const joined = chunks.map((chunk) => chunk.trim()).filter(Boolean);
  return joined.length ? Array.from(new Set(joined)).join("\n\n") : null;
}

function stripMarkup(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function collectMedia(snapshot: Record<string, unknown> | null): {
  thumb: string | null;
  media: string[];
  videos: string[];
} {
  const media: string[] = [];
  const videos: string[] = [];
  let thumb: string | null = null;
  if (!snapshot) return { thumb, media, videos };

  const push = (value: unknown, into: string[]) => {
    const url = asString(value);
    if (url && /^https?:\/\//i.test(url)) into.push(url);
  };

  const videosList = Array.isArray(snapshot.videos) ? snapshot.videos : [];
  for (const video of videosList) {
    const rec = asRecord(video);
    if (!rec) continue;
    if (!thumb) thumb = asString(rec.video_preview_image_url);
    push(rec.video_preview_image_url, media);
    push(rec.video_hd_url, videos);
    push(rec.video_sd_url, videos);
    push(rec.video_preview_image_url, videos);
  }

  const images = Array.isArray(snapshot.images) ? snapshot.images : [];
  for (const image of images) {
    if (typeof image === "string") {
      push(image, media);
      if (!thumb) thumb = asString(image);
      continue;
    }
    const rec = asRecord(image);
    if (!rec) continue;
    const url =
      asString(rec.original_image_url) ??
      asString(rec.resized_image_url) ??
      asString(rec.url) ??
      asString(rec.original_image_hash);
    push(url, media);
    if (!thumb) thumb = url;
  }

  const cards = Array.isArray(snapshot.cards) ? snapshot.cards : [];
  for (const card of cards) {
    const rec = asRecord(card);
    if (!rec) continue;
    push(rec.original_image_url, media);
    push(rec.resized_image_url, media);
    push(rec.video_hd_url, videos);
    push(rec.video_sd_url, videos);
    if (!thumb) {
      thumb =
        asString(rec.video_preview_image_url) ??
        asString(rec.original_image_url) ??
        asString(rec.resized_image_url);
    }
  }

  return {
    thumb,
    media: Array.from(new Set(media)),
    videos: Array.from(new Set(videos.filter((url) => !url.includes("preview_image")))),
  };
}

function prune(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[omitted]";
  if (typeof value === "string") return value.length > 20_000 ? "[omitted]" : value;
  if (Array.isArray(value)) return value.slice(0, 40).map((item) => prune(item, depth + 1));
  const rec = asRecord(value);
  if (!rec) return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(rec)) {
    out[key] = prune(item, depth + 1);
  }
  return out;
}

export function collectArchiveNodes(input: unknown, out: Map<string, Record<string, unknown>>): void {
  if (!input || typeof input !== "object") return;
  if (Array.isArray(input)) {
    for (const item of input) collectArchiveNodes(item, out);
    return;
  }
  const rec = input as Record<string, unknown>;
  const id = rec.ad_archive_id;
  if (typeof id === "string" || typeof id === "number") {
    out.set(String(id), rec);
  }
  for (const nested of Object.values(rec)) collectArchiveNodes(nested, out);
}

function findObjectStart(text: string, from: number): number {
  for (let i = from; i >= 0; i--) {
    if (text[i] === "{") return i;
  }
  return -1;
}

function extractBalanced(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseJsonIslands(text: string): unknown[] {
  const islands: unknown[] = [];
  const tryParse = (raw: string) => {
    try {
      islands.push(JSON.parse(raw));
    } catch {
      /* not json */
    }
  };
  tryParse(text);
  const needle = '"ad_archive_id"';
  let from = 0;
  while (from < text.length) {
    const idx = text.indexOf(needle, from);
    if (idx < 0) break;
    const start = findObjectStart(text, idx);
    if (start >= 0) {
      const extracted = extractBalanced(text, start);
      if (extracted) tryParse(extracted);
    }
    from = idx + needle.length;
  }
  return islands;
}

export function ingestPayload(payload: unknown, into: Map<string, Record<string, unknown>>): void {
  collectArchiveNodes(payload, into);
  if (typeof payload === "string") {
    for (const island of parseJsonIslands(payload)) collectArchiveNodes(island, into);
  }
}

export function normalizeAd(
  node: Record<string, unknown>,
  sourceUrl: string,
  scrapedAt: string,
): ScrapedAd | null {
  const id = asString(node.ad_archive_id);
  if (!id) return null;
  const snapshot =
    asRecord(node.snapshot) ??
    asRecord(asRecord(node.ad)?.snapshot) ??
    asRecord(asRecord(node.data)?.snapshot);
  const media = collectMedia(snapshot);
  const platforms = asStringList(node.publisher_platform ?? node.publisher_platforms);
  const start_date = rawDate(node.start_date ?? node.ad_delivery_start_time);
  const end_date = rawDate(node.end_date ?? node.ad_delivery_stop_time);
  const started_at = unixToIso(start_date);
  const stopped_at = unixToIso(end_date);
  const ad_library_url = `https://www.facebook.com/ads/library/?id=${id}`;
  const ad = applyWinnerSignals(
    {
      id,
      sourceUrl,
      page_id: asString(node.page_id) ?? asString(snapshot?.page_id),
      page_name: asString(node.page_name) ?? asString(snapshot?.page_name),
      is_active: asBoolean(node.is_active),
      start_date,
      end_date,
      started_at,
      stopped_at,
      body: readBody(snapshot),
      headline: asString(snapshot?.title) ?? asString(snapshot?.current_page_name),
      cta_text: asString(snapshot?.cta_text),
      cta_type: asString(snapshot?.cta_type),
      link_url: asString(snapshot?.link_url) ?? asString(snapshot?.caption),
      link_description: asString(snapshot?.link_description),
      caption: asString(snapshot?.caption),
      platforms,
      media_type: asString(snapshot?.display_format),
      thumb_url: media.thumb,
      media_urls: media.media,
      video_urls: media.videos,
      ad_library_url,
      raw: prune(node) as Record<string, unknown>,
      meta: flattenMeta(node, snapshot, {
        source_url: sourceUrl,
        ad_library_url,
        thumb_url: media.thumb,
        start_date_iso: started_at,
        end_date_iso: stopped_at,
      }),
      scraped_at: scrapedAt,
      still_active: null,
      running_days: null,
      creative_score: null,
      winner: null,
    },
    { scoreMin: DEFAULT_WINNER_SCORE_MIN, daysMin: DEFAULT_WINNER_DAYS_MIN },
  );
  return ad;
}

export function normalizeNodes(
  nodes: Map<string, Record<string, unknown>>,
  sourceUrl: string,
  scrapedAt: string,
): ScrapedAd[] {
  const ads: ScrapedAd[] = [];
  for (const node of nodes.values()) {
    const ad = normalizeAd(node, sourceUrl, scrapedAt);
    if (ad) ads.push(ad);
  }
  return ads;
}
