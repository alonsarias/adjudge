import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FILTER_LABELS, HOOK_OPTIONS, TACTIC_OPTIONS } from "../shared/labels.ts";
import type { ClassifiedAd, Health, UrlResult } from "../shared/types.ts";
import { classifyAds, fetchHealth, scrapeAds } from "./api.ts";
import { downloadCsv } from "./csv.ts";
import { isAdLibraryUrl } from "../shared/urls.ts";

type Phase = "empty" | "pulling" | "holdings" | "tagging" | "tagged";

type Filters = {
  hook: string;
  tactic: string;
  platform: string;
  media_type: string;
  sourceUrl: string;
  active: string;
  query: string;
};

const emptyFilters = (): Filters => ({
  hook: "",
  tactic: "",
  platform: "",
  media_type: "",
  sourceUrl: "",
  active: "",
  query: "",
});

const PHASE_LABEL: Record<Phase, string> = {
  empty: "empty wall",
  pulling: "pulling",
  holdings: "on the wall",
  tagging: "tagging",
  tagged: "tagged",
};

const CHIP_TONES = ["forest", "steel", "violet", "brick"] as const;

function chipTone(value: string): (typeof CHIP_TONES)[number] {
  let n = 0;
  for (const ch of value) n += ch.charCodeAt(0);
  return CHIP_TONES[n % CHIP_TONES.length];
}

function parseLines(value: string): string[] {
  return [...new Set(value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
}

function snippet(value: string | null, max = 96): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max).trim()}…` : value;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}

function formatList(values: string[]): string {
  return values.length ? values.join(" · ") : "—";
}

function padCount(value: number): string {
  return String(value).padStart(3, "0");
}

export function App() {
  const [draft, setDraft] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [phase, setPhase] = useState<Phase>("empty");
  const [progress, setProgress] = useState("");
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [results, setResults] = useState<UrlResult[]>([]);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void fetchHealth().then(setHealth);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parsed = useMemo(() => parseLines(draft), [draft]);
  const invalid = parsed.filter((url) => !isAdLibraryUrl(url));
  const valid = parsed.filter((url) => isAdLibraryUrl(url)).slice(0, 5);
  const overflow = parsed.length > 5;

  const selected = ads.find((ad) => ad.id === selectedId) ?? null;

  const platforms = useMemo(
    () => [...new Set(ads.flatMap((ad) => ad.platforms))].sort(),
    [ads],
  );
  const mediaTypes = useMemo(
    () => [...new Set(ads.map((ad) => ad.media_type).filter((item): item is string => Boolean(item)))].sort(),
    [ads],
  );
  const sources = useMemo(
    () => [...new Set(ads.map((ad) => ad.sourceUrl))].sort(),
    [ads],
  );

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return ads.filter((ad) => {
      if (filters.hook && ad.classification?.hook?.choice !== filters.hook) return false;
      if (filters.tactic && !ad.classification?.tactics.includes(filters.tactic)) return false;
      if (filters.platform && !ad.platforms.includes(filters.platform)) return false;
      if (filters.media_type && ad.media_type !== filters.media_type) return false;
      if (filters.sourceUrl && ad.sourceUrl !== filters.sourceUrl) return false;
      if (filters.active === "yes" && ad.is_active !== true) return false;
      if (filters.active === "no" && ad.is_active !== false) return false;
      if (!q) return true;
      const hay = [ad.page_name, ad.body, ad.headline, ad.cta_text, ad.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [ads, filters]);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  async function run() {
    setInputError(null);
    if (!draft.trim()) {
      setInputError("Paste 1–5 Ad Library URLs, one per line.");
      setPhase("empty");
      return;
    }
    if (!valid.length) {
      setInputError("Every line must be a facebook.com/ads/library URL.");
      return;
    }
    if (invalid.length) {
      setInputError("Non-library URLs were ignored. Only Ad Library links can run.");
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setAds([]);
    setResults([]);
    setSelectedId(null);
    setClassifyError(null);
    setPhase("pulling");
    setProgress(`URL 1/${valid.length} · opening · 0 ads`);

    const collected: ClassifiedAd[] = [];
    try {
      await scrapeAds(valid, controller.signal, (event) => {
        if (event.type === "progress") {
          setProgress(
            `URL ${event.urlIndex}/${event.urlCount} · ${event.phase} · ${event.adsFound} ads`,
          );
        }
        if (event.type === "ads") {
          const next = event.ads.map((ad) => ({ ...ad, classification: null }));
          collected.push(...next);
          setAds([...collected]);
          if (next.length) setPhase("holdings");
        }
        if (event.type === "url") {
          setResults((current) => {
            const rest = current.filter((item) => item.url !== event.result.url);
            return [...rest, event.result];
          });
        }
        if (event.type === "error") {
          setClassifyError(event.error);
        }
      });
    } catch (error) {
      if (controller.signal.aborted) {
        setProgress("cancelled · boxes kept");
        setBusy(false);
        setPhase(collected.length ? "holdings" : "empty");
        return;
      }
      const message = error instanceof Error ? error.message : "scrape failed";
      setProgress(message);
      setBusy(false);
      setPhase(collected.length ? "holdings" : "empty");
      return;
    }

    if (controller.signal.aborted) {
      setBusy(false);
      setPhase(collected.length ? "holdings" : "empty");
      return;
    }

    if (!collected.length) {
      setBusy(false);
      setPhase("empty");
      setProgress("scrape returned 0 ads");
      return;
    }

    setPhase("tagging");
    setProgress(`classifying 1/${collected.length}`);
    try {
      await classifyAds(collected, controller.signal, (event) => {
        if (event.type === "progress") {
          setProgress(`classifying ${event.index}/${event.total}`);
        }
        if (event.type === "ad") {
          setAds((current) =>
            current.map((ad) => (ad.id === event.ad.id ? event.ad : ad)),
          );
        }
        if (event.type === "done") {
          if (event.skipped || event.error) {
            setClassifyError(event.error ?? "Classification skipped.");
            setProgress(event.skipped ? "classify skipped · boxes kept" : event.error ?? "classify failed");
          } else {
            setProgress(`classified ${event.ads.length}`);
          }
          if (event.ads.length) setAds(event.ads);
        }
      });
      setPhase("tagged");
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : "classify failed";
        setClassifyError(message);
      }
      setPhase("holdings");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const allFailed = results.length > 0 && results.every((item) => !item.ok) && ads.length === 0;
  const emptyHoldings = !busy && ads.length === 0 && results.length > 0;
  const noFilterMatch = ads.length > 0 && filtered.length === 0;

  return (
    <div className="wall">
      <header className="mast">
        <div className="brand">
          <h1>adjudge</h1>
          <p className="lede">Public Ad Library lots, pulled onto the wall.</p>
        </div>
        <div>
          <p className="size-run" aria-label={`${ads.length} ads on the wall`}>
            {padCount(filtered.length)}
            <span aria-hidden="true"> / {padCount(ads.length)}</span>
          </p>
          <p className={`phase phase-${phase}`} data-phase={phase}>
            <span className="stamp">{PHASE_LABEL[phase]}</span>
            {progress ? <span>{progress}</span> : null}
          </p>
        </div>
      </header>

      <section className="intake">
        <label className="field">
          <span>Ad Library URLs · one per line · 5 max</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={5}
            spellCheck={false}
            placeholder="https://www.facebook.com/ads/library/?view_all_page_id=…"
          />
        </label>
        <div className="actions">
          <button type="button" className="run" onClick={() => void run()} disabled={busy}>
            Run
          </button>
          <button type="button" className="cancel" onClick={stop} disabled={!busy}>
            Cancel
          </button>
          <button
            type="button"
            className="export"
            onClick={() => downloadCsv(filtered)}
            disabled={!filtered.length}
          >
            CSV
          </button>
        </div>
        {overflow ? <p className="note">Only the first 5 unique URLs will run.</p> : null}
        {invalid.length ? (
          <ul className="inline-errors">
            {invalid.map((url) => (
              <li key={url}>Not an Ad Library URL: {url}</li>
            ))}
          </ul>
        ) : null}
        {inputError ? <p className="banner warn">{inputError}</p> : null}
        {classifyError ? <p className="banner warn">{classifyError}</p> : null}
        {health && !health.hasTypeSafeKey && !classifyError ? (
          <p className="banner blink">
            TypeSafe key missing. Boxes stay visible; classify will skip.
          </p>
        ) : null}
      </section>

      <ol className="chips" aria-label="URL stacks">
        {Array.from({ length: 5 }, (_, index) => {
          const result = results[index];
          const className = result ? (result.ok ? "lit" : "struck") : "";
          return (
            <li key={index} className={className}>
              <span className="swatch" />
              <span className="code">STACK {String(index + 1).padStart(2, "0")}</span>
            </li>
          );
        })}
      </ol>

      {results.length ? (
        <ol className="stacks">
          {results.map((result, index) => (
            <li key={result.url} className={result.ok ? "ok" : "fail"}>
              <span className="code">STACK {String(index + 1).padStart(2, "0")}</span>
              <span className="url">{result.url}</span>
              <span className="mark">
                {result.ok ? `${result.adCount} ads` : result.error ?? "failed"}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <section className="colorway">
        <label className="search">
          <span>Search colorway</span>
          <input
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
          />
        </label>
        <div className="dials">
        <label>
          <span>{FILTER_LABELS.hook}</span>
          <select
            value={filters.hook}
            onChange={(event) => setFilters({ ...filters, hook: event.target.value })}
          >
            <option value="">All</option>
            {Object.keys(HOOK_OPTIONS)
              .filter((key) => key !== "none")
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>{FILTER_LABELS.tactic}</span>
          <select
            value={filters.tactic}
            onChange={(event) => setFilters({ ...filters, tactic: event.target.value })}
          >
            <option value="">All</option>
            {TACTIC_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{FILTER_LABELS.platform}</span>
          <select
            value={filters.platform}
            onChange={(event) => setFilters({ ...filters, platform: event.target.value })}
          >
            <option value="">All</option>
            {platforms.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{FILTER_LABELS.media_type}</span>
          <select
            value={filters.media_type}
            onChange={(event) => setFilters({ ...filters, media_type: event.target.value })}
          >
            <option value="">All</option>
            {mediaTypes.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{FILTER_LABELS.sourceUrl}</span>
          <select
            value={filters.sourceUrl}
            onChange={(event) => setFilters({ ...filters, sourceUrl: event.target.value })}
          >
            <option value="">All</option>
            {sources.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{FILTER_LABELS.active}</span>
          <select
            value={filters.active}
            onChange={(event) => setFilters({ ...filters, active: event.target.value })}
          >
            <option value="">All</option>
            <option value="yes">Active</option>
            <option value="no">Inactive</option>
          </select>
        </label>
        </div>
      </section>

      {allFailed ? (
        <EmptyWall>All stacks failed. The wall is empty.</EmptyWall>
      ) : emptyHoldings ? (
        <EmptyWall>Scrape returned 0 ads. Nothing was invented.</EmptyWall>
      ) : !ads.length && !busy ? (
        <EmptyWall>
          {valid.length
            ? "Ready to pull. Run when the stacks look right."
            : draft.trim()
              ? "Those lines are not Ad Library URLs."
              : "Empty wall. Paste Ad Library URLs to start a stack."}
        </EmptyWall>
      ) : noFilterMatch ? (
        <EmptyWall>No boxes match these filters.</EmptyWall>
      ) : (
        <div className="table-wrap">
          <table className="holdings">
            <thead>
              <tr>
                <th>Thumb</th>
                <th>Page</th>
                <th>Body</th>
                <th>Headline</th>
                <th>CTA</th>
                <th>Platforms</th>
                <th>Active</th>
                <th>Started</th>
                <th>Source</th>
                <th>Hook</th>
                <th>Tactics</th>
                <th>Media</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad) => (
                <tr
                  key={ad.id}
                  className={ad.id === selectedId ? "lead" : undefined}
                  role="button"
                  tabIndex={0}
                  aria-pressed={ad.id === selectedId}
                  onClick={() => setSelectedId(ad.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(ad.id);
                    }
                  }}
                >
                  <td>
                    <Thumb url={ad.thumb_url} name={ad.page_name ?? ad.id} />
                  </td>
                  <td>
                    <span className="code">{ad.id}</span>
                    <strong>{ad.page_name ?? "—"}</strong>
                  </td>
                  <td>{snippet(ad.body)}</td>
                  <td>{ad.headline ?? "—"}</td>
                  <td>{ad.cta_text ?? "—"}</td>
                  <td className="code">{formatList(ad.platforms)}</td>
                  <td>{ad.is_active == null ? "—" : ad.is_active ? "yes" : "no"}</td>
                  <td className="code">{formatDate(ad.started_at)}</td>
                  <td className="src">{snippet(ad.sourceUrl, 42)}</td>
                  <td>
                    {ad.classification?.hook?.choice ? (
                      <span className={`tag ${chipTone(ad.classification.hook.choice)}`}>
                        {ad.classification.hook.choice}
                      </span>
                    ) : (
                      <span className="ghost">—</span>
                    )}
                  </td>
                  <td>
                    {ad.classification?.tactics.length ? (
                      ad.classification.tactics.map((tactic) => (
                        <span key={tactic} className={`tag ${chipTone(tactic)}`}>
                          {tactic}
                        </span>
                      ))
                    ) : (
                      <span className="ghost">—</span>
                    )}
                  </td>
                  <td>{ad.media_type ?? <span className="ghost">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <aside className="drawer" role="dialog" aria-label="Open box">
          <div className="lid" aria-hidden="true" />
          <div className="tissue">
            <button type="button" className="close" onClick={() => setSelectedId(null)}>
              Close
            </button>
            <p className="code">BOX {selected.id}</p>
            <h2>{selected.page_name ?? "Untitled page"}</h2>
            <Thumb url={selected.thumb_url} name={selected.page_name ?? selected.id} large />
            {selected.video_urls[0] ? (
              <p className="note">Video URL on file. Poster shown; CDN may expire.</p>
            ) : null}
            <p className="body">{selected.body ?? "No body text in the snapshot."}</p>
            <dl>
              <div>
                <dt>Headline</dt>
                <dd>{selected.headline ?? "—"}</dd>
              </div>
              <div>
                <dt>CTA</dt>
                <dd>
                  {selected.cta_text ?? "—"} {selected.cta_type ? `(${selected.cta_type})` : ""}
                </dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>{formatDate(selected.started_at)}</dd>
              </div>
              <div>
                <dt>Stopped</dt>
                <dd>{formatDate(selected.stopped_at)}</dd>
              </div>
            </dl>
            <p>
              {selected.link_url ? (
                <a href={selected.link_url} target="_blank" rel="noreferrer">
                  Outbound link
                </a>
              ) : null}
              {" · "}
              <a href={selected.ad_library_url} target="_blank" rel="noreferrer">
                Ad Library
              </a>
            </p>
            <pre className="raw">{JSON.stringify(selected.raw, null, 2)}</pre>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function EmptyWall({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap empty-wall">
      <div className="end-slots" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="end-slot" key={index}>
            <span className="well" />
            <span className="rib" />
            <span className="runout" />
          </div>
        ))}
      </div>
      <p className="empty-copy">{children}</p>
    </div>
  );
}

function Thumb({
  url,
  large,
}: {
  url: string | null;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(!url);
  if (failed || !url) {
    return <span className={`thumb placeholder ${large ? "large" : ""}`} aria-hidden="true" />;
  }
  return (
    <img
      className={`thumb ${large ? "large" : ""}`}
      src={url}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
