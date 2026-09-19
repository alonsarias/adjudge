import { chromium, type Browser, type Page, type Response } from "playwright";
import { isAdLibraryUrl } from "../shared/urls.ts";
import { ingestPayload, normalizeNodes } from "./normalize.ts";
import type { ScrapedAd, UrlResult } from "../shared/types.ts";

export { isAdLibraryUrl };

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const EMPTY_SCROLLS = 4;
const SCROLL_PAUSE_MS = 1100;
const BETWEEN_URL_MS = 1600;
const GOTO_TIMEOUT_MS = 45_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function dismissCookies(page: Page): Promise<void> {
  const labels = [
    "Allow all cookies",
    "Accept all",
    "Allow all",
    "Accept cookies",
    "Decline optional cookies",
  ];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label, exact: false }).first();
    try {
      if (await button.isVisible({ timeout: 1500 })) {
        await button.click({ timeout: 2000 });
        return;
      }
    } catch {
      /* try next */
    }
  }
}

async function ingestResponse(
  response: Response,
  into: Map<string, Record<string, unknown>>,
): Promise<void> {
  const url = response.url();
  const type = response.headers()["content-type"] ?? "";
  const isGraphql = url.includes("/api/graphql");
  const isHtml = type.includes("text/html") || type.includes("application/xhtml");
  const isJson = type.includes("application/json") || type.includes("text/javascript");
  if (!isGraphql && !isHtml && !isJson) return;
  try {
    const text = await response.text();
    ingestPayload(text, into);
    if (isJson || isGraphql) {
      try {
        ingestPayload(JSON.parse(text), into);
      } catch {
        /* html or wrapped */
      }
    }
  } catch {
    /* closed or binary */
  }
}

export type ScrapeHandlers = {
  onProgress: (info: {
    urlIndex: number;
    urlCount: number;
    url: string;
    phase: string;
    adsFound: number;
  }) => void | Promise<void>;
  onAds: (ads: ScrapedAd[]) => void | Promise<void>;
};

export async function scrapeUrls(
  urls: string[],
  limitPerUrl: number,
  signal: AbortSignal | undefined,
  handlers: ScrapeHandlers,
): Promise<{ ads: ScrapedAd[]; results: UrlResult[]; cancelled: boolean }> {
  const seenIds = new Set<string>();
  const allAds: ScrapedAd[] = [];
  const results: UrlResult[] = [];
  let browser: Browser | null = null;
  let cancelled = false;

  const emitNew = async (nodes: Map<string, Record<string, unknown>>, sourceUrl: string) => {
    const scrapedAt = new Date().toISOString();
    const fresh = normalizeNodes(nodes, sourceUrl, scrapedAt).filter((ad) => {
      if (seenIds.has(ad.id)) return false;
      seenIds.add(ad.id);
      return true;
    });
    if (fresh.length) {
      allAds.push(...fresh);
      await handlers.onAds(fresh);
    }
    return fresh.length;
  };

  try {
    const launchArgs = ["--disable-blink-features=AutomationControlled"];
    try {
      browser = await chromium.launch({ headless: true, args: launchArgs });
    } catch {
      browser = await chromium.launch({
        channel: "chrome",
        headless: true,
        args: launchArgs,
      });
    }
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: "en-US",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const bucket = new Map<string, Record<string, unknown>>();

    page.on("response", (response) => {
      void ingestResponse(response, bucket);
    });

    for (const [index, url] of urls.entries()) {
      if (signal?.aborted) {
        cancelled = true;
        break;
      }
      if (index > 0) {
        try {
          await sleep(BETWEEN_URL_MS, signal);
        } catch {
          cancelled = true;
          break;
        }
      }

      const urlCount = urls.length;
      const report = async (phase: string) => {
        await handlers.onProgress({
          urlIndex: index + 1,
          urlCount,
          url,
          phase,
          adsFound: allAds.length,
        });
      };

      const beforeCount = allAds.length;
      bucket.clear();

      try {
        await report("opening");
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: GOTO_TIMEOUT_MS,
        });
        if (response) await ingestResponse(response, bucket);
        await dismissCookies(page);
        await sleep(800, signal);
        ingestPayload(await page.content(), bucket);
        const scripts = await page.locator("script").allTextContents();
        for (const script of scripts) ingestPayload(script, bucket);
        await emitNew(bucket, url);
        await report("ssr");

        let empty = 0;
        let urlAds = allAds.length - beforeCount;
        while (urlAds < limitPerUrl && empty < EMPTY_SCROLLS) {
          if (signal?.aborted) {
            cancelled = true;
            break;
          }
          await report("scrolling");
          const sizeBefore = bucket.size;
          await page.mouse.wheel(0, 2800);
          await sleep(SCROLL_PAUSE_MS, signal);
          ingestPayload(await page.content(), bucket);
          await emitNew(bucket, url);
          urlAds = allAds.length - beforeCount;
          if (urlAds >= limitPerUrl || bucket.size === sizeBefore) empty += 1;
          else empty = 0;
        }

        if (cancelled) {
          results.push({
            url,
            ok: urlAds > 0,
            adCount: urlAds,
            error: urlAds > 0 ? undefined : "cancelled",
          });
          break;
        }

        if (urlAds === 0) {
          results.push({
            url,
            ok: false,
            adCount: 0,
            error: "scrape returned 0 ads",
          });
        } else {
          results.push({ url, ok: true, adCount: urlAds });
        }
        await report("done");
      } catch (error) {
        if (signal?.aborted) {
          cancelled = true;
          const urlAds = allAds.length - beforeCount;
          results.push({
            url,
            ok: urlAds > 0,
            adCount: urlAds,
            error: urlAds > 0 ? undefined : "cancelled",
          });
          break;
        }
        const message = error instanceof Error ? error.message : "scrape failed";
        results.push({
          url,
          ok: false,
          adCount: allAds.length - beforeCount,
          error: message.slice(0, 180),
        });
        await report("failed");
      }
    }
  } finally {
    await browser?.close().catch(() => undefined);
  }

  return { ads: allAds, results, cancelled };
}
