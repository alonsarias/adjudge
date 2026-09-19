export const HOOK_OPTIONS = {
  Contrarian: "Opens by rejecting a common belief or expected take.",
  "Identity Call-Out": "Names a specific person, role, or in-group in the opener.",
  Confession: "Opens as an admission, secret, or behind-the-scenes reveal.",
  "Pain Agitation": "Opens by pressing a felt problem before any offer.",
  "Curiosity Gap": "Opens with incomplete information the viewer must resolve.",
  "Loss Aversion": "Opens on what the viewer will lose, miss, or forfeit.",
  "Unspoken Truth": "Opens by saying what the category usually will not say.",
  "Pattern Interrupt": "Opens with a break in expected ad form or tone.",
  none: "No single Motion hook is present or readable from the copy.",
} as const;

export const TACTIC_OPTIONS = [
  "Aspirational",
  "Authority",
  "Belief",
  "Bold Claim",
  "Call To Action First",
  "Challenge",
  "Confession",
  "Contrast",
  "Contrarian",
  "Curiosity",
  "Demographic Callout",
  "Direct Address",
  "Directive",
  "Exclusivity",
  "Explainer",
  "FOMO",
  "How To",
  "If Then",
  "Listicle",
  "Myth Busting",
  "Offer Only",
  "Price Anchor",
  "Question",
  "Reasons Why",
  "Relatability",
  "Reverse Psychology",
  "Risk Reversal",
  "Shocking Statement",
  "Social Proof",
  "Statistic",
  "Storytelling",
  "Urgency",
  "Warning",
] as const;

export const ASSET_TYPE_OPTIONS = {
  image: "A single still image is the primary asset.",
  video: "A video is the primary asset.",
  carousel: "Multiple cards or frames are meant to be swiped.",
  collection: "A collection or catalog-style set of items.",
  dco: "Dynamic or templated creative with interchangeable slots.",
  unknown: "The asset type cannot be read from the available text.",
  none: "No asset type applies.",
} as const;

export const VISUAL_FORMAT_OPTIONS = {
  ugc: "User-generated or lo-fi native-looking creative.",
  talking_head: "A person speaking to camera.",
  product_demo: "The product being used or demonstrated.",
  text_on_screen: "Type or captions carry the message over footage or stills.",
  animation: "Motion graphics, illustration, or animated type.",
  lifestyle: "People in a lived context around the product.",
  before_after: "A contrast between a before state and an after state.",
  unknown: "The visual format cannot be read from the available text.",
  none: "No visual format applies.",
} as const;

export const MESSAGING_ANGLE_OPTIONS = {
  problem: "Leads with the problem or pain.",
  solution: "Leads with how the product solves it.",
  offer: "Leads with the deal, price, or incentive.",
  social_proof: "Leads with others’ results, reviews, or numbers.",
  feature: "Leads with a specific capability.",
  brand: "Leads with brand identity or feeling.",
  comparison: "Leads with a contrast to an alternative.",
  unknown: "The angle cannot be read from the available text.",
  none: "No messaging angle applies.",
} as const;

export const HEADLINE_TACTIC_OPTIONS = {
  question: "The headline is a question.",
  how_to: "The headline promises a method or how-to.",
  number: "The headline leads with a numeral or list count.",
  command: "The headline is an imperative.",
  curiosity: "The headline withholds the payoff.",
  benefit: "The headline names a concrete benefit.",
  unknown: "The headline tactic cannot be read.",
  none: "No headline tactic applies.",
} as const;

export const SEASONALITY_OPTIONS = {
  evergreen: "The copy could run any time of year.",
  holiday: "Tied to a named holiday.",
  sale_event: "Tied to a sale window or promo calendar.",
  seasonal: "Tied to a season without a named holiday.",
  launch: "Tied to a launch or newness window.",
  unknown: "Seasonality cannot be read.",
  none: "No seasonality applies.",
} as const;

export const OFFER_TYPE_OPTIONS = {
  discount: "A percent or amount off.",
  free: "A free item, gift, or giveaway.",
  trial: "A trial, sample, or try-before.",
  bundle: "A bundle or multi-item deal.",
  shipping: "Free or reduced shipping is the offer.",
  no_offer: "No commercial offer is present.",
  unknown: "The offer type cannot be read.",
  none: "No offer type applies.",
} as const;

export const INTENDED_AUDIENCE_OPTIONS = {
  existing_customers: "Speaks to people who already buy or use it.",
  prospects: "Speaks to people who do not yet buy.",
  lookalike_demo: "Names a demographic, role, or life stage.",
  retarget: "Assumes prior site, ad, or product contact.",
  broad: "No specific audience is named or implied.",
  unknown: "The intended audience cannot be read.",
  none: "No intended audience applies.",
} as const;

export const TACTIC_THRESHOLD = 0.6;

export const CREATIVE_SCORE_CRITERIA = [
  "No readable creative pattern in the copy.",
  "Thin or generic copy with almost no hook, offer, or angle.",
  "A weak but identifiable hook or message, poorly developed.",
  "A clear hook or angle with ordinary supporting copy.",
  "Strong hook, offer, or angle with coherent supporting copy.",
  "Exceptionally tight creative pattern: hook, angle, and offer reinforce each other.",
] as const;

export const FILTER_LABELS = {
  hook: "Hook",
  tactic: "Tactic",
  headline_tactic: "Headline Tactic",
  messaging_angle: "Messaging Angle",
  offer_type: "Offer Type",
  seasonality: "Seasonality",
  intended_audience: "Intended Audience",
  platform: "Platform",
  media_type: "Media",
  sourceUrl: "Source",
  still_active: "Still active",
  winner: "Winner",
  creative_score: "Creative score (not performance)",
  running_days: "Running days",
} as const;

export function choiceFilterKeys(options: Record<string, string>): string[] {
  return Object.keys(options).filter((key) => key !== "none" && key !== "unknown");
}
