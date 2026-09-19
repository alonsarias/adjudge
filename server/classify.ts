import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import {
  ASSET_TYPE_OPTIONS,
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
import { hasTypeSafeKey } from "./env.ts";

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
  messaging_angle: choice("What is the primary messaging angle?", MESSAGING_ANGLE_OPTIONS),
  headline_tactic: choice("What tactic does the headline use?", HEADLINE_TACTIC_OPTIONS),
  seasonality: choice("What seasonality does this ad copy carry?", SEASONALITY_OPTIONS),
  offer_type: choice("What offer type is present in the copy?", OFFER_TYPE_OPTIONS),
  intended_audience: choice("Who is the intended audience of this copy?", INTENDED_AUDIENCE_OPTIONS),
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

export function classifySkipped(ads: ScrapedAd[]): ClassifiedAd[] {
  return ads.map((ad) => ({ ...ad, classification: null }));
}

export async function classifyAd(ad: ScrapedAd): Promise<ClassifiedAd> {
  if (!hasTypeSafeKey()) return { ...ad, classification: null };
  const client = new TypeSafeClient();
  const response = await client.systemOne({
    state: {
      body: ad.body ?? "",
      headline: ad.headline ?? "",
      cta_text: ad.cta_text ?? "",
      cta_type: ad.cta_type ?? "",
    },
    questions: QUESTIONS,
  });
  const answers = response.answers as Record<string, unknown>;
  const tacticScores: Record<string, number> = {};
  const tactics: string[] = [];
  for (const name of TACTIC_OPTIONS) {
    const score = asNoul(answers[tacticId(name)]);
    tacticScores[name] = score;
    if (score >= TACTIC_THRESHOLD) tactics.push(name);
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
  };
  return { ...ad, classification };
}
