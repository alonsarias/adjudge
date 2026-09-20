---
name: adjudge
description: Monochrome product-marketing materials applied to a local Ad Library workbench.
colors:
  s0: "#fafafa"
  s1: "#f2f2f2"
  s2: "#e6e6e6"
  s3: "#cfcfcf"
  s4: "#a6a6a6"
  s5: "#6b6b6b"
  s6: "#111111"
  accent: "#a6c23f"
  paper: "#ffffff"
typography:
  display:
    fontFamily: "Satoshi, \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Satoshi, \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Satoshi, \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
  body:
    fontFamily: "Satoshi, \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Satoshi, \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
rounded:
  thumb: "10px"
  chip: "12px"
  field: "14px"
  proof: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.s6}"
    textColor: "{colors.s0}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "#000000"
    textColor: "{colors.s0}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  button-primary-disabled:
    backgroundColor: "{colors.s5}"
    textColor: "{colors.s0}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.s6}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    typography: "{typography.body}"
  button-ghost-hover:
    backgroundColor: "{colors.s1}"
    textColor: "{colors.s6}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  button-ghost-disabled:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.s5}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.s6}"
    rounded: "{rounded.pill}"
    padding: "8px"
  textarea:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.s6}"
    rounded: "{rounded.field}"
    padding: "8px"
  tag:
    backgroundColor: "{colors.s1}"
    textColor: "{colors.s6}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  empty:
    backgroundColor: "{colors.s0}"
    textColor: "{colors.s6}"
    rounded: "{rounded.proof}"
    padding: "16px 18px"
  table-wrap:
    backgroundColor: "{colors.s0}"
    rounded: "{rounded.proof}"
  banner:
    backgroundColor: "{colors.s1}"
    textColor: "{colors.s6}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
  slot:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.s6}"
    rounded: "{rounded.chip}"
    padding: "8px"
  thumb:
    backgroundColor: "{colors.s1}"
    rounded: "{rounded.thumb}"
    width: "52px"
    height: "52px"
  drawer:
    backgroundColor: "{colors.s0}"
    textColor: "{colors.s6}"
    padding: "20px"
    width: "min(520px, 100%)"
---

# Design System: adjudge

## Overview

**Creative North Star: "The Workbench Stays Put"**

adjudge wears Monochrome Product Marketing as a tool, not as a campaign. The seven-step near-white to near-black scale, Satoshi, hairline chrome, ghost pills, and a single chartreuse mark are the catalog world's materials; the page itself stays an analyst workbench. Title, intake, slots, filters, and the proof (empty or table) remain where they already sit. Nothing is restaged into a hero, a sidebar shell, or a marketing narrative.

The atmosphere is paper: a gallery ground, a fixed micro-noise film, and quiet radial highlights. Depth is tonal. Controls are white pills with a hairline until Run, which is near-black with the only chromatic stroke. Proofs — the empty state and the results table — share one paper language so a successful scrape does not change the furniture.

This system is the operate expression of `digital-design-canon-monochrome-product-marketing`. It keeps the world's scale, type, chrome, and ring, and leaves the catalog card's poster composition (oversized display type, device mock, campaign headline) on the reference sheet.

**Key Characteristics:**

- Seven-step neutral scale (`--s0`–`--s6`) plus bright paper and one chartreuse
- Self-hosted Satoshi at 400 / 500 / 700 on a Helvetica Neue fallback stack
- Hairline chrome (`1px solid --s2`); pills for controls; 16px radii for proofs
- Primary action is ink-filled with a 1.5px accent ring
- Product thumbs sit on radial grounds; proofs use the same paper + hairline + radial recipe
- Intersection-driven soft rise on `[data-proof]`; reduced motion turns it off

## Colors

One neutral ladder from gallery white to near-black, plus bright paper and a single chartreuse used as proof — never as a wash.

### Primary

- **Chartreuse Ring** (`accent`): Resting 1.5px border on Run, Run's `:focus-visible` outline, and the 7px success dots on completed URL slots and URL-result rows. Never a button fill, never a page tint, never a link color.

### Neutral

- **Gallery White** (`s0`): Page ground, drawer ground, proof wash end-stop, selection text, Run label.
- **Cool Mist** (`s1`): Ghost hover, row hover, selected row fill, banner fill, tag fill, raw-JSON fill, table-header wash, scrollbar track, large-thumb mid-stop.
- **Hairline Chrome** (`s2`): The only chrome stroke (`--hair`). Table row rules. Large-thumb outer stop.
- **Cloud Silver** (`s3`): Disabled ghost border. Scrollbar thumb.
- **Pewter** (`s4`): Declared mid-step on `:root`. No component currently paints with it; keep the ladder intact rather than deleting the step.
- **Graphite Mute** (`s5`): Lede, notes, phase, empty-field ghosts, field labels, table headers, placeholders, disabled ghost type, disabled Run fill and border.
- **Near-Black Ink** (`s6`): Body type, primary fill, default focus ring, fail slot border, banner border, selected-row outline, selection background, drawer links.
- **Bright Paper** (`paper`): Control and slot fills; the white pole of every radial highlight.

### Named Rules

**The Chartreuse-as-Proof Rule.** Accent marks the thing that runs and the slot that succeeded. If a new control needs color, it does not get a second hue — it gets ink, hairline, or this same chartreuse in a 7px dot or a 1.5px ring.

**The Seven-Step Rule.** Neutrals come from `--s0`–`--s6` plus `--paper`. Do not insert a warm or cool tint between steps. Run's hover fill `#000000` is a one-off darker than ink; it is not a new scale step.

## Typography

**Display Font:** Satoshi (self-hosted `/fonts/satoshi-400.woff2`, `satoshi-500.woff2`, `satoshi-700.woff2`; fallback `"Helvetica Neue", Helvetica, Arial, sans-serif`)
**Body Font:** Satoshi (same stack)
**Label/Mono Font:** Satoshi for UI labels; `ui-monospace, SFMono-Regular, Menlo, monospace` only inside the drawer raw block (12px / 1.45)

**Character:** A geometric product-marketing face used at tool density. Regular carries reading, medium carries controls and names, bold carries the two titles. Tracking tightens only on those titles.

### Hierarchy

- **Display** (700, 1.5rem, −0.03em): The page title `adjudge`. This is the largest size the workbench sets.
- **Headline** (700, −0.03em, size unset): Drawer page name. Weight and tracking match display; size is left to the user-agent heading.
- **Title** (500, 0.85rem): Drawer section headings (`Classification`, `Winner signals`, Meta groups).
- **Body** (400, 15px / 1.45): Page default. Lede and notes wrap at 62ch. Controls inherit size and use 500.
- **Label** (500, 0.8rem): Field captions, filter captions, table headers. Mute color. Tags sit slightly smaller at 0.78rem / 500.

Counts, phase strings, and table cells use `font-variant-numeric: tabular-nums`.

### Named Rules

**The Satoshi Three-Weight Rule.** Regular for body, medium for controls and labels, bold for the two titles. No italics, no fourth weight, no second UI family. Mono is a drawer inspection face, not a brand face.

## Layout

The workbench is full-bleed: `.app` is `max-width: none` with padding 24px 20px 80px over the gallery ground. Rhythm is 4 / 8 / 12 / 16 / 20 / 24.

Header is a horizontal split: title and lede left, tabular count and phase right, aligned to the baseline (`align-items: flex-end`), 16px gap. Intake is `1fr auto` with a 12px gap: the URL field grows; Run / Cancel / CSV stack in a 7.5rem column with 8px gaps. Five URL slots share one row (`repeat(5, minmax(0, 1fr))`, 8px gap). Filters: a full-width search pill, then dials on `repeat(auto-fill, minmax(150px, 1fr))`. Range pairs are two 10px-radius fields. URL-result rows are `56px 1fr auto`.

Empty state and results table occupy the same slot. Both are 16px-radius proofs with hairline and a top-lit radial. The table scrolls inside that wrap; it is not a separate card.

At 900px the intake, slot row, filter dials, and URL-result rows collapse to one column; the header stacks; the drawer goes full width.

## Elevation & Depth

The system is flat chrome with tonal layering. Surfaces do not lift off the page. Depth comes from paper against gallery, a 1px hairline, radial highlights, and a fixed micro-noise film (`/noise.svg` tiled at 96px, opacity 0.32, `mix-blend-mode: multiply`). The page wash is a 920×520px radial at 78% −8%. Proofs and thumbs use their own top-lit radials.

Shadows exist in two places only.

### Shadow Vocabulary

- **Thumb loft** (`box-shadow: 0 10px 18px -14px rgb(17 17 17 / 0.4)`): Compressed under the 52px product thumb so the creative sits on the row.
- **Drawer edge** (`box-shadow: -18px 0 40px -28px rgb(17 17 17 / 0.35)`): Soft falloff on the fixed 520px detail panel. The drawer also uses a left hairline.

### Named Rules

**The Hairline-Not-Shadow Rule.** Chrome is a 1px `--s2` stroke. Do not add ambient card shadows, hover lifts, or a third shadow role. Thumbs and the drawer already have the only loft the world uses.

## Shapes

Controls are pills (999px): buttons, text inputs, selects, tags. The URL textarea breaks the pill into a 14px stadium so five lines can sit. Proofs — empty and table wrap — are 16px. Slots, URL-result rows, banners, and the raw block are 12px. Range fields and table thumbs are 10px; the drawer hero thumb is 14px. Success is a 7px circle, not a badge.

Hairline is 1px `--s2` everywhere except Run (1.5px `accent`) and fail slots (1px ink). Focus is a 2px ink ring at 2px offset (inset −2px on table-header buttons). Run's focus ring is accent. Selected rows use a 2px ink outline on mist. Disabled controls keep full opacity and recolor instead of fading.

## Components

Ghost paper pills, one solid primary, proofs that do not change clothes. Medium weight on every control.

### Buttons

- **Shape:** Pill (999px). Padding 8px 14px. Width 100% in the action stack.
- **Primary (Run):** Ink fill, gallery text, 1.5px accent ring. Hover fills `#000000`. Disabled: mute fill, mute border, gallery text.
- **Ghost (Cancel, CSV, Close):** Paper fill, ink type, hairline. Hover: mist fill. Disabled: paper fill, mute type, silver border. Opacity stays 1.
- **Active:** `translateY(0.5px)` unless reduced motion.
- **Focus:** 2px ink ring, 2px offset; Run uses accent.
- **Table sort headers:** Unstyled buttons — no chrome, no radius, inherit mute 0.8rem / 500. Hover mist. Idle sort chevrons at 0.28 opacity.

### Chips

- **Style:** Mist fill, hairline, pill, 2px 8px, 0.78rem / 500. Used for hook, tactics, and classified choice cells.
- **Empty:** The `.ghost` word `No value` in mute, no chip chrome.

### Cards / Containers

- **Empty proof:** 16px radius, hairline, 16px 18px padding, ink type on the shared proof radial (`80% 120% at 50% 0%`, paper → gallery). Margin 24px 0. This is the vacant table, not a marketing panel.
- **Table wrap:** Same radius, hairline, and radial. Interior rows rule with `--s2`. Header cells wash `rgb(250 250 250 / 0.92)`.
- **URL slots / URL results:** Paper, hairline, 12px radius, 8px padding. Success: 7px accent dot, top-right. Fail: ink border, no red.
- **Banner:** Mist fill, 1px ink border, 12px radius, 8px 12px. One treatment for input errors, classify errors, and the missing-key notice.

### Inputs / Fields

- **Style:** Paper, hairline, 8px padding. Inputs and selects are pills; textarea is 14px, min-height 124px, vertical resize. Placeholders mute.
- **Focus:** Default 2px ink ring.
- **Labels:** 0.8rem / 500 / mute, 4px above the field.
- **Range:** Two 10px-radius number fields, 6px apart.

### Navigation

No app nav. The Meta-columns picker is a `<details>`: medium summary, wrapped checkbox labels at 0.85rem.

### Results table

The default results surface. Full-width, collapsed borders, 8px cells, tabular numerals. Rows are buttons (Enter / Space). Hover and selected state share mist; selected adds the 2px ink outline. Sort cycles asc → desc → off.

### Product thumb

52×52, 10px radius, hairline, cover-fit, radial at 42% 32% (paper → mist), thumb loft shadow. Failed or missing URLs become an empty placeholder with the same ground — the row stays. Drawer hero: 100% × 220px, 14px radius, a deeper three-stop radial.

### Detail drawer

Fixed right, `min(520px, 100%)`, gallery ground, left hairline, drawer-edge shadow, 20px padding, z-index 4. Close is a ghost pill, floated right. Links are ink with 3px underline offset. Escape dismisses.

### Proof motion

`[data-proof]` (empty, URL results, table wrap) starts visible. When motion is allowed, pending nodes sit at 0.88 opacity, 14px down, 4px blur, then 240ms `cubic-bezier(0.16, 1, 0.3, 1)` to rest. Intersection: threshold 0.08, rootMargin `0px 0px -8% 0px`. `prefers-reduced-motion: reduce` applies `is-in` immediately and strips transform, blur, and transition.

## Do's and Don'ts

### Do:

- **Do** keep proofs (empty and table) on the same paper + hairline + 16px + top-lit radial recipe, in the same slot.
- **Do** paint Run as ink-on-gallery with a 1.5px chartreuse ring; paint every other action as a paper ghost pill.
- **Do** signal URL success with a 7px accent dot and URL failure with an ink border — not a second chroma.
- **Do** sit product thumbs on radial grounds; keep a broken thumb as a placeholder so the row never disappears.
- **Do** use Satoshi 400 / 500 / 700 and the seven-step scale as declared on `:root`.
- **Do** honor `prefers-reduced-motion` by skipping the proof rise.

### Don't:

- **Don't** introduce a second chromatic color, an accent fill, or an accent page wash.
- **Don't** restage the operate workbench as a landing-page hero, device mock, or default SaaS shell.
- **Don't** add ambient card shadows or hover lift to chrome; loft stays on thumbs and the drawer.
- **Don't** fade disabled controls — recolor them (mute type, silver or mute border).
- **Don't** invent a painted role for Pewter (`s4`) just because the step exists; leave the ladder intact.
