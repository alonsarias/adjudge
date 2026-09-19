# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-specified: Vite + React + TypeScript for the UI; a small local Node API (Hono) beside the frontend. Concurrent `npm run dev` starts both. Playwright Chromium runs only on the local API. No StealAds, no paid scrapers, no official Meta Marketing API / `ads_archive`. No OpenAI, Anthropic, or Gemini APIs — TypeSafe / Jev only for AI judgments. `TYPESAFE_API_KEY` lives in `.env` and is loaded only by the local API (never `VITE_`, never the browser).

## Users

Primary user: a **creative strategist**. They open the tool on localhost, paste public Meta Ad Library URLs, and need a classified table of competitor creative — hooks, tactics, and Motion-style tags — so they can scan, filter, and export.

## Product Purpose

adjudge turns pasted Ad Library URLs into a live results table of real ads, then classifies creative text with TypeSafe Jev. Success is: paste 1–5 real URLs → sequential scrape → table shows real ads (or clear per-URL errors, never mocks) → classify after scrape (fail-soft without a key) → drawer, filters, and filtered CSV.

## Positioning

The mechanism is local Playwright against the public Ad Library page (SSR HTML first, GraphQL on scroll second) plus Jev judgments the surrounding code can type-check. Neighboring tools either require a Meta Marketing API token, a paid scraper, or an LLM that invents copy. adjudge does neither.

## Operating Context

Used on the strategist’s machine. They paste up to five `facebook.com/ads/library` URLs (one per line), hit Run, watch `URL i/5 · phase · ads found`, and start reading the table the moment rows exist. Classify runs after scrape. Cancel keeps already-scraped ads. Partial runs (e.g. 3/5 URLs OK) are success states. CDN thumbs expire; a broken thumb never drops the row.

## Capabilities and Constraints

- Up to 5 Meta Ad Library URLs per run; dedupe; reject non-library URLs inline.
- Default `limitPerUrl = 50`. Sequential URL queue, reused browser, short delay between URLs.
- Results table is the default (not cards). Row click opens a right drawer with full body, media, links, and raw fields.
- Filters: hook, tactic, platform, media_type, sourceUrl, active, text search. CSV exports currently filtered rows only.
- Classification is creative-only (body + headline + CTA). One primary Motion hook; multi tactics; extra tags as specified. No fake CTR/ROAS.
- No Facebook login. No official `ads_archive`. No paid scrapers. Never scrape from the Vite client.
- No silent mock-on-failure. Missing live fields stay `null`. Never invent ads to fill empty states.
- Required empty/error states: empty input; all URLs invalid; scrape returned 0 ads; all URLs failed; classify skipped/failed (ads still visible); no rows match filters.

## Brand Commitments

Name: **adjudge**. Voice is tool-like and scannable — an analyst workbench, not a marketing page. No locked visual world.

## Evidence on Hand

- Validated 2026-09-19: Playwright live `view_all_page_id=373478645850236` yielded 30 ads via SSR HTML / `ad_archive_id`.
- Example URL: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&media_type=all&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&view_all_page_id=373478645850236`
- Live node keys and `snapshot` keys are recorded in the build prompt; prefer those over OSS field maps.
- No testimonials, case studies, or customer names. Do not fabricate ads, spend, reach, or performance metrics.

## Product Principles

- Real ads or an honest empty state — never a mock row.
- Show scrape results before classification; classification is enrichment, not a gate.
- Partial success is success; fail per URL, not the whole run.
- Secrets and browsers stay on the local API.
- Creative judgments only; no invented performance numbers.

## Accessibility & Inclusion

Keyboard-reachable Run/Cancel, table, filters, and drawer. Broken media must not remove content. No product-specific WCAG target beyond standard operable web UI.
