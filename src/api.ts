import type {
  ClassifyEvent,
  Health,
  ScrapeEvent,
  ScrapedAd,
} from "../shared/types.ts";

async function readSse<T extends { type: string }>(
  response: Response,
  onEvent: (event: T) => void,
): Promise<void> {
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    let message = text || `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      /* raw */
    }
    throw new Error(message);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const dataLine = chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
      if (!dataLine) continue;
      onEvent(JSON.parse(dataLine) as T);
    }
  }
}

export async function fetchHealth(): Promise<Health> {
  const response = await fetch("/api/health");
  if (!response.ok) return { ok: false, hasTypeSafeKey: false };
  return (await response.json()) as Health;
}

export async function scrapeAds(
  urls: string[],
  signal: AbortSignal,
  onEvent: (event: ScrapeEvent) => void,
): Promise<void> {
  const response = await fetch("/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, limitPerUrl: 50 }),
    signal,
  });
  await readSse<ScrapeEvent>(response, onEvent);
}

export async function classifyAds(
  ads: ScrapedAd[],
  signal: AbortSignal,
  onEvent: (event: ClassifyEvent) => void,
): Promise<void> {
  const response = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ads }),
    signal,
  });
  await readSse<ClassifyEvent>(response, onEvent);
}
