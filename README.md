# adjudge

Local workbench: paste Meta Ad Library URLs, scrape ads on your machine, classify creative with TypeSafe Jev, filter, export CSV.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Paste your TypeSafe key into `.env` as `TYPESAFE_API_KEY`. Never commit `.env`. Never put the key in a `VITE_*` variable — the browser never sees it.

Restart `npm run dev` after saving `.env`.

```bash
npm run dev
```

UI and the local API start together. Open the Vite URL the script prints.

## Use

1. Paste **1–5** public Ad Library URLs, one per line. Example:

   `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&media_type=all&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&view_all_page_id=373478645850236`

2. Run. The table fills as soon as real scrape rows exist (up to 50 ads per URL). Classify runs after scrape.
3. Cancel keeps whatever has already been scraped.
4. Filters and CSV apply to the **currently visible** rows only.

Without `TYPESAFE_API_KEY`, scraped ads stay visible and classify is skipped with a clear banner.

## Limits

- **SSR-first scrape.** Playwright reads embedded JSON (`ad_archive_id`) from the public Ad Library page, then GraphQL responses on scroll. There is no official Marketing API `ads_archive` call and no Facebook login.
- **CDN thumbs expire.** A 403 or dead preview image is replaced with a placeholder. The row stays.
- **Rate limits and blocks.** Facebook may throttle or challenge headless Chromium. Failures are per-URL; the app never invents ads.
- Local machine only. Do not scrape from the Vite client.

## Project-only skill

```bash
npx skills add typesafe-ai/skills --skill typesafe-ai
```
