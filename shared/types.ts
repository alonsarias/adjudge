export type ChoiceAnswer = {
  choice: string | null;
  confidence: number | null;
  probabilities: Record<string, number>;
};

export type Classification = {
  hook: ChoiceAnswer | null;
  tactics: string[];
  tacticScores: Record<string, number>;
  asset_type: ChoiceAnswer | null;
  visual_format: ChoiceAnswer | null;
  messaging_angle: ChoiceAnswer | null;
  headline_tactic: ChoiceAnswer | null;
  seasonality: ChoiceAnswer | null;
  offer_type: ChoiceAnswer | null;
  intended_audience: ChoiceAnswer | null;
};

export type ScrapedAd = {
  id: string;
  sourceUrl: string;
  page_id: string | null;
  page_name: string | null;
  is_active: boolean | null;
  started_at: string | null;
  stopped_at: string | null;
  body: string | null;
  headline: string | null;
  cta_text: string | null;
  cta_type: string | null;
  link_url: string | null;
  link_description: string | null;
  caption: string | null;
  platforms: string[];
  media_type: string | null;
  thumb_url: string | null;
  media_urls: string[];
  video_urls: string[];
  ad_library_url: string;
  raw: Record<string, unknown> | null;
  scraped_at: string;
};

export type ClassifiedAd = ScrapedAd & {
  classification: Classification | null;
};

export type UrlResult = {
  url: string;
  ok: boolean;
  adCount: number;
  error?: string;
};

export type ScrapeProgress = {
  type: "progress";
  urlIndex: number;
  urlCount: number;
  url: string;
  phase: string;
  adsFound: number;
};

export type ScrapeAdsEvent = {
  type: "ads";
  ads: ScrapedAd[];
};

export type ScrapeUrlEvent = {
  type: "url";
  result: UrlResult;
};

export type ScrapeDoneEvent = {
  type: "done";
  ads: ScrapedAd[];
  results: UrlResult[];
  cancelled?: boolean;
};

export type ScrapeErrorEvent = {
  type: "error";
  error: string;
};

export type ScrapeEvent =
  | ScrapeProgress
  | ScrapeAdsEvent
  | ScrapeUrlEvent
  | ScrapeDoneEvent
  | ScrapeErrorEvent;

export type ClassifyProgress = {
  type: "progress";
  index: number;
  total: number;
};

export type ClassifyAdEvent = {
  type: "ad";
  ad: ClassifiedAd;
};

export type ClassifyDoneEvent = {
  type: "done";
  ads: ClassifiedAd[];
  skipped?: boolean;
  error?: string;
  cancelled?: boolean;
};

export type ClassifyEvent = ClassifyProgress | ClassifyAdEvent | ClassifyDoneEvent;

export type Health = {
  ok: boolean;
  hasTypeSafeKey: boolean;
};
