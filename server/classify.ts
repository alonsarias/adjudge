import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import {
  ASSET_TYPE_OPTIONS,
  CREATIVE_SCORE_CRITERIA,
  HEADLINE_TACTIC_OPTIONS,
  HOOK_OPTIONS,
  INTENDED_AUDIENCE_OPTIONS,
  MESSAGING_ANGLE_OPTIONS,
  OFFER_TYPE_OPTIONS,
  SEASONALITY_OPTIONS,
  TACTIC_OPTIONS,
  TACTIC_THRESHOLD,
  VISUAL_FORMAT_OPTIONS,
} from "../shared/labels.ts";
import type { ChoiceAnswer, Classification, ClassifiedAd, ScrapedAd } from "../shared/types.ts";
import { applyWinnerSignals } from "../shared/winner.ts";
import { hasTypeSafeKey, winnerThresholds } from "./env.ts";

function tacticId(name: string): string {
  return `tactic_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

const TACTIC_QUESTIONS = Object.fromEntries(
  TACTIC_OPTIONS.map((name) => [
    tacticId(name),
    noul(`Does this Meta ad use the Motion tactic ${name}?`),
  ]),
);

const QUESTIONS = {
  hook: choice(
    "What is the one primary Motion hook of this Meta ad — the dominant opener in the first line or first 1–3 seconds of the copy?",
    HOOK_OPTIONS,
  ),
  ...TACTIC_QUESTIONS,
  asset_type: choice("What is the primary asset type implied by this ad?", ASSET_TYPE_OPTIONS),
  visual_format: choice("What visual format does this ad use?", VISUAL_FORMAT_OPTIONS),
  messaging_angle: choice(
    "What is the one primary messaging angle across `body`, `headline`, `cta_text`, `caption`, and `link_description`? Choose none if no angle applies.",
    MESSAGING_ANGLE_OPTIONS,
  ),
  headline_tactic: choice(
    "What single tactic does `headline` use? Read `headline` first; use `body` only if the headline is empty. Choose none if no tactic applies.",
    HEADLINE_TACTIC_OPTIONS,
  ),
  seasonality: choice(
    "What seasonality cues are in `body`, `headline`, `cta_text`, `caption`, and `link_description`? Choose none if none apply.",
    SEASONALITY_OPTIONS,
  ),
  offer_type: choice(
    "What offer type is framed in `body`, `headline`, `cta_text`, `caption`, or `link_description`? Choose no_offer or none if no commercial offer is present.",
    OFFER_TYPE_OPTIONS,
  ),
  intended_audience: choice(
    "Who do `body`, `headline`, `cta_text`, `caption`, and `link_description` address? Choose none if no audience can be read.",
    INTENDED_AUDIENCE_OPTIONS,
  ),
  creative_score: score(
    "Rate the creative-only pattern strength of this Meta ad from `body`, `headline`, `cta_text`, `caption`, and `link_description`. Judge hook clarity, offer/angle coherence, and copy craft. Do not judge performance, spend, CTR, ROAS, or media production.",
    CREATIVE_SCORE_CRITERIA,
  ),
};

function asChoice(value: unknown): ChoiceAnswer | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as {
    choice?: unknown;
    confidence?: unknown;
    probabilities?: unknown;
  };
  const picked = typeof rec.choice === "string" ? rec.choice : null;
  return {
    choice: !picked || picked === "none" || picked === "unknown" ? null : picked,
    confidence: typeof rec.confidence === "number" ? rec.confidence : null,
    probabilities:
      rec.probabilities && typeof rec.probabilities === "object"
        ? (rec.probabilities as Record<string, number>)
        : {},
  };
}

function asNoul(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  const n = (value as { noul?: unknown }).noul;
  return typeof n === "number" ? n : 0;
}

function asCreativeScore(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const n = (value as { score?: unknown }).score;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const top = CREATIVE_SCORE_CRITERIA.length - 1;
  return Math.min(100, Math.max(0, Math.round((n / top) * 100)));
}

function withSignals(ad: ClassifiedAd): ClassifiedAd {
  return applyWinnerSignals(ad, winnerThresholds());
}

export function classifySkipped(ads: ScrapedAd[]): ClassifiedAd[] {
  return ads.map((ad) => withSignals({ ...ad, classification: null }));
}

export async function classifyAd(ad: ScrapedAd): Promise<ClassifiedAd> {
  if (!hasTypeSafeKey()) return withSignals({ ...ad, classification: null });
  const client = new TypeSafeClient();
  const response = await client.systemOne({
    state: {
      body: ad.body ?? "",
      headline: ad.headline ?? "",
      cta_text: ad.cta_text ?? "",
      cta_type: ad.cta_type ?? "",
      caption: ad.caption ?? "",
      link_description: ad.link_description ?? "",
    },
    questions: QUESTIONS,
  });
  const answers = response.answers as Record<string, unknown>;
  const tacticScores: Record<string, number> = {};
  const tactics: string[] = [];
  for (const name of TACTIC_OPTIONS) {
    const tacticScore = asNoul(answers[tacticId(name)]);
    tacticScores[name] = tacticScore;
    if (tacticScore >= TACTIC_THRESHOLD) tactics.push(name);
  }
  const classification: Classification = {
    hook: asChoice(answers.hook),
    tactics,
    tacticScores,
    asset_type: asChoice(answers.asset_type),
    visual_format: asChoice(answers.visual_format),
    messaging_angle: asChoice(answers.messaging_angle),
    headline_tactic: asChoice(answers.headline_tactic),
    seasonality: asChoice(answers.seasonality),
    offer_type: asChoice(answers.offer_type),
    intended_audience: asChoice(answers.intended_audience),
    creative_score: asCreativeScore(answers.creative_score),
  };
  return withSignals({ ...ad, classification });
}
