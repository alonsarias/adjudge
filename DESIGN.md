---
name: adjudge
description: Public Ad Library lots, pulled onto the wall.
colors:
  board: "#c45a14"
  kraft: "#8f3d0c"
  flute: "#a34810"
  ink: "#0e0d0c"
  tissue: "#f3efe6"
  forest: "#4f6a38"
  steel: "#3f547c"
  violet: "#6a3d7a"
  brick: "#b83a28"
typography:
  display:
    fontFamily: '"Big Shoulders Condensed", "Arial Narrow", sans-serif'
    fontSize: "58px"
    fontWeight: 800
    lineHeight: 0.78
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Big Shoulders Condensed", "Arial Narrow", sans-serif'
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Big Shoulders Condensed", "Arial Narrow", sans-serif'
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.04em"
  body:
    fontFamily: '"Big Shoulders Condensed", "Arial Narrow", sans-serif'
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: '"Chivo Mono", ui-monospace, monospace'
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.02em"
  mono:
    fontFamily: '"Chivo Mono", ui-monospace, monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0"
  code:
    fontFamily: '"Chivo Mono", ui-monospace, monospace'
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
  size-run:
    fontFamily: '"Chivo Mono", ui-monospace, monospace'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  sm: "3px"
spacing:
  control: "8px"
  panel: "10px"
  section: "18px"
  gutter: "24px"
  frame: "28px"
components:
  button-run:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tissue}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-run-hover:
    backgroundColor: "color-mix(in srgb, #0e0d0c 88%, #c45a14)"
    textColor: "{colors.tissue}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-board-hover:
    backgroundColor: "color-mix(in srgb, #f3efe6 35%, #c45a14)"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  button-cancel:
    backgroundColor: "{colors.tissue}"
    textColor: "{colors.brick}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
  field-tissue:
    backgroundColor: "{colors.tissue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  chip-colorway:
    backgroundColor: "{colors.tissue}"
    textColor: "{colors.ink}"
    padding: "6px 8px"
    height: "40px"
  tag-printed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tissue}"
    padding: "1px 6px 0"
  stamp:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tissue}"
    padding: "4px 9px 2px"
  end-label:
    backgroundColor: "color-mix(in srgb, #f3efe6 55%, #c45a14)"
    textColor: "{colors.ink}"
    padding: "10px 8px"
  lid-drawer:
    backgroundColor: "{colors.tissue}"
    textColor: "{colors.ink}"
    width: "min(428px, 100%)"
    padding: "20px"
---

# Design System: adjudge

## Overview

**Creative North Star: "Sneaker Archive Wall"**

The shipped Operate surface is a stockroom wall of sneaker boxes, not dashboard chrome. The page itself is burnt-orange box board with a hairline fiber weave; every control is either an ink archive cap or a tissue-white well cut into that board. Density is workbench-tight: a 1440px wall, condensed 17px body, mono labels, and holdings that read as stacked end labels.

The pairing is industrial and printed. Big Shoulders Condensed carries the wordmark, buttons, stamps, tags, and page names as tight uppercase caps. Chivo Mono carries size-runs, SKUs, URLs, helper copy, and field labels. Color is cardboard plus ink, then four printed chip inks that never become page fills. Depth is material: fluted lid lips, a pulled-end slide, and a hinged tissue drawer.

Confirmed visual rejections: Accession Register (ledger stamps, manila, cool-gray paper), Edit Decision List phosphor, and club-sleeve scrawl. The build does not introduce a separate app canvas or a system-UI pairing.

**Key Characteristics:**

- Board-as-page with a hairline fiber weave; no cool chrome
- Condensed archive caps paired with mono size-runs
- Tissue wells and fluted, ink-ruled box lips
- Holdings as stacked end labels; pull, then hinge a lid
- Four printed chip inks, used on tags and status only
- Honest empty slots on the wall, never mock boxes

## Colors

Cardboard is the field, ink is the stamp, tissue is the interior, and the four chip inks are printed colorways.

### Primary

- **Burnt-Orange Box Board** (`board`): The page, the wall, default button fill, sticky holdings headers, and the empty-slot field. Fiber weave sits on top of it.
- **Scorched Kraft** (`kraft`): The dark stripe inside the flute pattern; also mixed into the scrollbar track.
- **Flute Stripe** (`flute`): The mid stripe in the 10px horizontal corrugation that caps stacks, holdings, empty slots, and the drawer lid.

### Secondary

- **Archive Ink** (`ink`): Type, 2px box rules, the Run and Close caps, phase stamps, default printed tags, focus rings, caret, and selection.

### Tertiary

- **Printed Forest** (`forest`): Lit stack swatches, successful stack counts, and hashed tag fills.
- **Printed Steel** (`steel`): Hashed tag fills.
- **Printed Violet** (`violet`): Hashed tag fills.
- **Printed Brick** (`brick`): Struck stack swatches, Cancel, fail-stack wash, banners, and inline errors.

### Neutral

- **Tissue White** (`tissue`): Paste well, chips, colorway panel, selected end, open-lid interior, thumbs, and the empty-slot wells.

Mixes are formulas, not extra swatches: helper copy is ink at 78% over board; ghost cells are ink at 46% over board; resting end labels are tissue at 55% over board; stack shells are tissue at 18% over board.

**The Board-Is-The-Page Rule.** The viewport is box board with the fiber weave. Do not introduce a separate app chrome, cool-gray canvas, or manila sheet.

**The Tissue-Well Rule.** Fields, chips, colorway, open lids, and selected ends are tissue interiors. Board stays the wall; tissue is the inside of a box.

**The Printed-Chip Rule.** Forest, steel, violet, and brick are printed on labels and status. Brick also marks cancel and fail. None of them fill the page.

## Typography

**Display Font:** Big Shoulders Condensed (Arial Narrow, sans-serif)
**Body Font:** Big Shoulders Condensed at 17px / 500 on the wall
**Label/Mono Font:** Chivo Mono (ui-monospace)

**Character:** Condensed caps feel like box-end print; mono feels like a size-run stamped beside them. Loaded faces are Big Shoulders Condensed 400–800 and Chivo Mono 400–600.

### Hierarchy

- **Display** (800, 58px / 40px below 900px, 0.78, -0.04em, uppercase): The `adjudge` wordmark only.
- **Headline** (800, 36px, 0.9, -0.03em, uppercase): Open-lid page title.
- **Title** (700, 16px, 0.04em, uppercase): Page names on end labels.
- **Body** (500, 17px, 1.35): Default wall type. Buttons are the same family at 16px / 700 / 0.08em / uppercase.
- **Mono** (400, 13px): Lede, notes, banners, empty-wall copy, drawer body, holdings cells, and stack marks. Max line length on lede and drawer body is 62ch.
- **Label** (500, 11px, 0.02em, sentence case): Field captions, colorway dial captions, and sticky holdings headers.
- **Code** (500, 11px, 0.04em, uppercase, tabular-nums): `STACK 01`, `BOX {id}`, archive IDs, dates, platforms.
- **Size-run** (600, 22px, 1, -0.04em, tabular-nums): Mast inventory `000 / 000`.

Textarea type is Chivo Mono 12px / 400 / 1.45. Phase stamps are condensed 15px / 800 / uppercase on an ink brick. Selection inverts to ink on tissue.

**The Size-Run Rule.** Counts live in Chivo Mono tabular numerals. The condensed wordmark never carries the inventory number.

**The Archive-Cap Rule.** Wordmark, buttons, stamps, tags, and page names are uppercase condensed. Helper copy, URLs, and field labels stay sentence-case mono.

## Layout

One column, centered, max-width 1440px, frame padding 28px 24px 96px. The mast is a split bar — wordmark and lede left, size-run and phase stamp right — sitting on a 2px ink rule. Intake is `1fr auto`: the paste well grows, Run / Cancel / CSV stack as a 8px action column. Five stack chips sit in equal columns. Colorway is a tissue panel with a full-width search and six equal dials. Holdings and empty slots share a 2px-ink box; stack rows are `84px 1fr auto`, empty slots are `72px 1fr 88px`.

Below 900px the mast, intake, chips, dials, stack rows, and empty slots collapse to one column, the wordmark drops to 40px, and the lid goes full-bleed. Spacing rhythm is 8px inside controls, 10px inside panels, 18px between sections, 24px for gutters.

## Elevation & Depth

The wall is flat. Depth comes from material, not a shadow scale: the 4px fiber hatch on the board, the 10px corrugation on box lips, tissue wells recessed into board, and one directional drop used only when a box is pulled or opened.

### Shadow Vocabulary

- **Pulled box** (`box-shadow: 14px 10px 24px color-mix(in srgb, var(--ink) 32%, transparent)`): Selected end label (`.lead`) and the open lid drawer.

Fiber is a 180° repeating 3px/1px ink-at-5% hatch. Fluting is a 90° 4px kraft / 1px flute / 5px board stripe. Fail stacks wash brick at 16%. The empty-wall message sits on a 35% board veil over the silhouette slots.

**The Pull-To-Lift Rule.** Surfaces are flat at rest. The ink drop and the 48px slide exist only for a pulled end or an open lid.

## Shapes

Box shells are square: stacks, holdings, chips, tags, thumbs, and the drawer. Only operable wells — buttons, textarea, inputs, selects — take the 3px radius. Rules are 1px ink on wells and 2px ink on box outer shells; the drawer lid’s bottom rule is 3px. Thumbs are 52×52 die-cuts, or full-width 220px in the lid. Missing media is tissue with a 135° ink hatch. Struck stack swatches reuse that hatch over brick.

**The Fluted-Lip Rule.** Stacks (12px), holdings (16px), and the drawer lid (28px) open with a horizontal flute strip under a 2px ink rule. Those shells stay square.

**The Three-Pixel Well Rule.** Only operable controls get the 3px radius. Ends, tags, thumbs, and chips stay die-cut square.

## Components

### Buttons

Condensed archive caps: 16px / 700 / 0.08em / uppercase, 1px ink rule, 3px radius, 9px 18px padding.

- **Shape:** Slightly softened die-cut (3px).
- **Run / Close:** Ink fill, tissue type. Hover warms the ink with 12% board. Close floats right on the lid and uses the same ink cap.
- **Board (CSV):** Board fill, ink type. Hover washes 35% tissue into the board.
- **Cancel:** Tissue fill, brick type and rule. Hover uses the board-button wash.
- **Hover / Focus:** 2px ink focus ring, 3px offset. Disabled opacity 0.38.
- **Secondary / Ghost / Tertiary:** Not present. Export is the board button; Cancel is the brick well.

### Chips

Five tissue tiles with a 22px swatch and a `STACK 0N` code. Resting swatch is ink at 10% on tissue. Lit swatch is forest. Struck swatch is brick with the diagonal hatch. No radius; 1px ink rule; min-height 40px.

### Cards / Containers

There is no card component. The repeating container is a square box shell: 2px ink rule, flute lip, board or faint tissue wash.

- **Corner Style:** Square (0).
- **Background:** Stacks use tissue at 18% on board; holdings and empty slots sit on board; colorway is solid tissue.
- **Shadow Strategy:** None at rest; pulled-box shadow only on the selected end and open lid.
- **Border:** 2px ink on the shell, 1px ink-at-22–28% row dividers.
- **Internal Padding:** 8–10px.

### Inputs / Fields

- **Style:** Tissue fill, ink type, 1px ink rule, 3px radius, 8px 10px padding. Labels are 11px mono above a 6px gap.
- **Textarea:** Chivo Mono 12px / 400 / 1.45, min-height 124px.
- **Selects:** Same well as inputs; ink accent.
- **Focus:** Global 2px ink ring, 3px offset. Caret is ink.
- **Error / Disabled:** Errors are brick lists and tissue banners with a brick rule. Disabled controls dim to 0.38.

### Navigation

No nav. Phase is a mast stamp (`empty wall`, `pulling`, `on the wall`, `tagging`, `tagged`) plus a 12px mono progress line. Tagging and the missing-key banner use a 1s step pulse to 28% opacity.

### End label

Holdings row: tissue-wash cells, sticky mono headers on board, 52px thumb in a tissue first column, condensed uppercase page name, mono snippet cells. Hover fills the row with solid tissue. Selected (`.lead`) slides 48px on `200ms cubic-bezier(0.2, 0.8, 0.2, 1)` and takes the pulled-box shadow. Reduced motion drops the slide and uses a 2px ink outline.

### Lid drawer

Fixed right lid, `min(428px, 100%)`, 220ms hinge from `perspective(900px) rotateY(-32deg) translateX(36px)`. Fluted 28px lip, then a scrolling tissue interior. Below 900px it is full width and hinges from the top (`rotateX(-12deg) translateY(-16px)`). Escape and Close dismiss it.

### Empty wall

The same box shell as holdings, filled with seven silhouette slots (tissue well, flute rib, tissue runout) and a centered 13px mono message on a translucent board veil. Used for empty input, invalid lots, zero ads, all stacks failed, and no filter matches.

### Printed tag

Uppercase condensed 13px / 700 / 0.04em chip, tissue on ink by default. Hook and tactic strings hash into forest, steel, violet, or brick. Missing values are 11px ghost mono em-dashes.

## Do's and Don'ts

### Do:

- **Do** set the page on box board with the fiber weave and keep tissue for interiors.
- **Do** pair Big Shoulders Condensed caps with Chivo Mono size-runs and SKUs.
- **Do** mark box shells with a fluted lip and a 2px ink rule.
- **Do** slide a selected end 48px and hinge the lid; under reduced motion, outline in ink instead.
- **Do** print forest, steel, violet, and brick on tags and status chips only.

### Don't:

- **Don't** revive Accession Register (ledger stamps, manila, cool-gray paper), Edit Decision List phosphor, or club-sleeve scrawl.
- **Don't** wrap the wall in cool-gray or manila app chrome.
- **Don't** restyle holdings as a SaaS card grid.
- **Don't** replace the pairing with system UI or editorial serif faces.
- **Don't** flood a screen with forest, steel, violet, or brick fills.
- **Don't** invent mock boxes to fill an empty wall.
