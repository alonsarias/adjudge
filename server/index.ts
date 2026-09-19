import { config } from "dotenv";
import { serve } from "@hono/node-server";

config();
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { classifyAd, classifySkipped } from "./classify.ts";
import { hasTypeSafeKey } from "./env.ts";
import { isAdLibraryUrl, scrapeUrls } from "./scrape.ts";
import type { ScrapedAd } from "../shared/types.ts";

const app = new Hono();
const PORT = Number(process.env.PORT ?? 8787);

function writeEvent(
  stream: { writeSSE: (event: { event: string; data: string }) => Promise<void> },
  event: string,
  data: unknown,
) {
  return stream.writeSSE({ event, data: JSON.stringify(data) });
}

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    hasTypeSafeKey: hasTypeSafeKey(),
  }),
);

app.post("/api/scrape", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    urls?: unknown;
    limitPerUrl?: unknown;
  } | null;
  const rawUrls = Array.isArray(body?.urls) ? body.urls : [];
  const urls = rawUrls
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const unique = [...new Set(urls)].slice(0, 5);
  if (!unique.length) {
    return c.json({ error: "Provide 1–5 Ad Library URLs." }, 400);
  }
  const invalid = unique.filter((url) => !isAdLibraryUrl(url));
  if (invalid.length) {
    return c.json({ error: "One or more URLs are not Ad Library links.", invalid }, 400);
  }
  const limitPerUrl =
    typeof body?.limitPerUrl === "number" && body.limitPerUrl > 0
      ? Math.min(Math.floor(body.limitPerUrl), 50)
      : 50;

  const signal = c.req.raw.signal;
  return streamSSE(c, async (stream) => {
    try {
      const { ads, results, cancelled } = await scrapeUrls(unique, limitPerUrl, signal, {
        onProgress: (info) =>
          writeEvent(stream, "progress", { type: "progress", ...info }),
        onAds: (fresh) => writeEvent(stream, "ads", { type: "ads", ads: fresh }),
      });
      for (const result of results) {
        await writeEvent(stream, "url", { type: "url", result });
      }
      await writeEvent(stream, "done", { type: "done", ads, results, cancelled });
    } catch (error) {
      const message = error instanceof Error ? error.message : "scrape failed";
      await writeEvent(stream, "error", { type: "error", error: message });
    }
  });
});

app.post("/api/classify", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { ads?: unknown } | null;
  const ads = Array.isArray(body?.ads) ? (body.ads as ScrapedAd[]) : [];
  if (!ads.length) return c.json({ error: "No ads to classify." }, 400);
  const signal = c.req.raw.signal;

  return streamSSE(c, async (stream) => {
    if (!hasTypeSafeKey()) {
      const skipped = classifySkipped(ads);
      await writeEvent(stream, "done", {
        type: "done",
        ads: skipped,
        skipped: true,
        error: "TYPESAFE_API_KEY is missing. Scraped ads are unchanged.",
      });
      return;
    }

    const out = [];
    try {
      for (const [index, ad] of ads.entries()) {
        if (signal.aborted) {
          await writeEvent(stream, "done", {
            type: "done",
            ads: out,
            cancelled: true,
          });
          return;
        }
        await writeEvent(stream, "progress", {
          type: "progress",
          index: index + 1,
          total: ads.length,
        });
        try {
          const classified = await classifyAd(ad);
          out.push(classified);
          await writeEvent(stream, "ad", { type: "ad", ad: classified });
        } catch (error) {
          const failed = { ...ad, classification: null };
          out.push(failed);
          await writeEvent(stream, "ad", { type: "ad", ad: failed });
          const message = error instanceof Error ? error.message : "classify failed";
          await writeEvent(stream, "progress", {
            type: "progress",
            index: index + 1,
            total: ads.length,
            error: message,
          });
        }
      }
      await writeEvent(stream, "done", { type: "done", ads: out });
    } catch (error) {
      const message = error instanceof Error ? error.message : "classify failed";
      await writeEvent(stream, "done", {
        type: "done",
        ads: out.length ? out : classifySkipped(ads),
        error: message,
      });
    }
  });
});

serve({ fetch: app.fetch, port: PORT, hostname: "127.0.0.1" }, (info) => {
  console.log(`adjudge api http://127.0.0.1:${info.port}`);
});
