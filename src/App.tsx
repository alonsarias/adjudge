import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { displayValue, isEmptyValue, NO_VALUE } from "../shared/empty.ts";
import {
  FILTER_LABELS,
  HEADLINE_TACTIC_OPTIONS,
  HOOK_OPTIONS,
  INTENDED_AUDIENCE_OPTIONS,
  MESSAGING_ANGLE_OPTIONS,
  OFFER_TYPE_OPTIONS,
  PHASE_LABELS,
  SEASONALITY_OPTIONS,
  TACTIC_OPTIONS,
  choiceFilterKeys,
  friendlyLabel,
} from "../shared/labels.ts";
import {
  META_SECTIONS,
  pickerKeys,
  unsectionedMetaKeys,
} from "../shared/meta.ts";
import type {
  ChoiceAnswer,
  ClassifiedAd,
  Health,
  UrlResult,
} from "../shared/types.ts";
import {
  DEFAULT_WINNER_DAYS_MIN,
  DEFAULT_WINNER_SCORE_MIN,
  WINNER_TOOLTIP,
} from "../shared/winner.ts";
import { classifyAds, fetchHealth, scrapeAds } from "./api.ts";
import { downloadCsv } from "./csv.ts";
import { isAdLibraryUrl } from "../shared/urls.ts";

type Phase = "empty" | "scraping" | "results" | "classifying" | "classified";
type SortDir = "asc" | "desc";
type SortState = { key: string; dir: SortDir };

type Filters = {
  hook: string;
  tactic: string;
  headline_tactic: string;
  messaging_angle: string;
  offer_type: string;
  seasonality: string;
  intended_audience: string;
  platform: string;
  media_type: string;
  sourceUrl: string;
  still_active: string;
  winner: string;
  scoreMin: string;
  scoreMax: string;
  daysMin: string;
  daysMax: string;
  query: string;
};

const emptyFilters = (): Filters => ({
  hook: "",
  tactic: "",
  headline_tactic: "",
  messaging_angle: "",
  offer_type: "",
  seasonality: "",
  intended_audience: "",
  platform: "",
  media_type: "",
  sourceUrl: "",
  still_active: "",
  winner: "",
  scoreMin: "",
  scoreMax: "",
  daysMin: "",
  daysMax: "",
  query: "",
});

const PHASE_LABEL: Record<Phase, string> = PHASE_LABELS;

const CHOICE_COLUMNS = [
  "headline_tactic",
  "messaging_angle",
  "offer_type",
  "seasonality",
  "intended_audience",
] as const;

function parseLines(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
}

function snippet(value: string | null, max = 96): string {
  if (isEmptyValue(value)) return NO_VALUE;
  const text = value as string;
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function formatList(values: string[]): string {
  return displayValue(values.map(friendlyLabel));
}

function choiceLabel(answer: ChoiceAnswer | null | undefined): string {
  return answer?.choice ? friendlyLabel(answer.choice) : NO_VALUE;
}

function columnValue(ad: ClassifiedAd, key: string): unknown {
  switch (key) {
    case "thumb":
      return ad.thumb_url;
    case "page":
      return ad.page_name || ad.id;
    case "body":
      return ad.body;
    case "headline":
      return ad.headline;
    case "cta":
      return ad.cta_text;
    case "platforms":
      return ad.platforms;
    case "hook":
      return ad.classification?.hook?.choice;
    case "tactics":
      return ad.classification?.tactics;
    case "headline_tactic":
      return ad.classification?.headline_tactic?.choice;
    case "messaging_angle":
      return ad.classification?.messaging_angle?.choice;
    case "offer_type":
      return ad.classification?.offer_type?.choice;
    case "seasonality":
      return ad.classification?.seasonality?.choice;
    case "intended_audience":
      return ad.classification?.intended_audience?.choice;
    case "still_active":
      return ad.still_active;
    case "running_days":
      return ad.running_days;
    case "creative_score":
      return ad.creative_score;
    case "winner":
      return ad.winner;
    default:
      return key.startsWith("meta:") ? ad.meta?.[key.slice(5)] : null;
  }
}

function rankValue(
  value: unknown,
): { empty: true } | { empty: false; n: number } | { empty: false; s: string } {
  if (isEmptyValue(value)) return { empty: true };
  if (typeof value === "number" && Number.isFinite(value)) {
    return { empty: false, n: value };
  }
  if (typeof value === "boolean") return { empty: false, n: value ? 1 : 0 };
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed !== "" && Number.isFinite(Number(trimmed))) {
      return { empty: false, n: Number(trimmed) };
    }
    return { empty: false, s: trimmed.toLowerCase() };
  }
  return { empty: false, s: displayValue(value).toLowerCase() };
}

function compareRanked(
  left: ReturnType<typeof rankValue>,
  right: ReturnType<typeof rankValue>,
): number {
  if ("n" in left && "n" in right) return left.n - right.n;
  const leftText = "s" in left ? left.s : "n" in left ? String(left.n) : "";
  const rightText =
    "s" in right ? right.s : "n" in right ? String(right.n) : "";
  return leftText.localeCompare(rightText, undefined, { numeric: true });
}

function sortAds(ads: ClassifiedAd[], sort: SortState | null): ClassifiedAd[] {
  if (!sort) return ads;
  return ads
    .map((ad, index) => ({ ad, index }))
    .sort((a, b) => {
      const left = rankValue(columnValue(a.ad, sort.key));
      const right = rankValue(columnValue(b.ad, sort.key));
      if (left.empty && right.empty) return a.index - b.index;
      if (left.empty) return 1;
      if (right.empty) return -1;
      const cmp = compareRanked(left, right);
      if (cmp !== 0) return sort.dir === "asc" ? cmp : -cmp;
      return a.index - b.index;
    })
    .map((item) => item.ad);
}

function inRange(value: number | null, min: string, max: string): boolean {
  if (min === "" && max === "") return true;
  if (value == null) return false;
  if (min !== "") {
    const low = Number(min);
    if (Number.isFinite(low) && value < low) return false;
  }
  if (max !== "") {
    const high = Number(max);
    if (Number.isFinite(high) && value > high) return false;
  }
  return true;
}

function Ghost({ children }: { children: ReactNode }) {
  return <span className="ghost">{children}</span>;
}

function Tags({ values }: { values: string[] }) {
  if (!values.length) return <Ghost>{NO_VALUE}</Ghost>;
  return (
    <>
      {values.map((value) => (
        <span key={value} className="tag">
          {friendlyLabel(value)}
        </span>
      ))}
    </>
  );
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
  const [extraColumns, setExtraColumns] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState | null>(null);
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

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-proof]"),
    );
    if (!nodes.length) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      for (const node of nodes) node.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    for (const node of nodes) {
      if (node.classList.contains("is-in")) continue;
      node.classList.add("is-pending");
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, [ads.length, results.length, phase]);

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
    () =>
      [
        ...new Set(
          ads
            .map((ad) => ad.media_type)
            .filter((item): item is string => Boolean(item)),
        ),
      ].sort(),
    [ads],
  );
  const sources = useMemo(
    () => [...new Set(ads.map((ad) => ad.sourceUrl))].sort(),
    [ads],
  );
  const availableExtra = useMemo(
    () => pickerKeys(ads.map((ad) => ad.meta)),
    [ads],
  );

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return ads.filter((ad) => {
      if (filters.hook && ad.classification?.hook?.choice !== filters.hook)
        return false;
      if (
        filters.tactic &&
        !ad.classification?.tactics.includes(filters.tactic)
      )
        return false;
      for (const key of CHOICE_COLUMNS) {
        if (filters[key] && ad.classification?.[key]?.choice !== filters[key])
          return false;
      }
      if (filters.platform && !ad.platforms.includes(filters.platform))
        return false;
      if (filters.media_type && ad.media_type !== filters.media_type)
        return false;
      if (filters.sourceUrl && ad.sourceUrl !== filters.sourceUrl) return false;
      if (filters.still_active === "yes" && ad.still_active !== true)
        return false;
      if (filters.still_active === "no" && ad.still_active !== false)
        return false;
      if (filters.winner === "yes" && ad.winner !== true) return false;
      if (filters.winner === "no" && ad.winner !== false) return false;
      if (!inRange(ad.creative_score, filters.scoreMin, filters.scoreMax))
        return false;
      if (!inRange(ad.running_days, filters.daysMin, filters.daysMax))
        return false;
      if (!q) return true;
      const hay = [ad.page_name, ad.body, ad.headline, ad.cta_text, ad.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [ads, filters]);

  const visible = useMemo(() => sortAds(filtered, sort), [filtered, sort]);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  function toggleColumn(key: string) {
    setExtraColumns((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      if (!next.includes(key)) {
        setSort((currentSort) =>
          currentSort?.key === `meta:${key}` ? null : currentSort,
        );
      }
      return next;
    });
  }

  function cycleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: "asc" };
      if (current.dir === "asc") return { key, dir: "desc" };
      return null;
    });
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
      setInputError(
        "Non-library URLs were ignored. Only Ad Library links can run.",
      );
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setAds([]);
    setResults([]);
    setSelectedId(null);
    setClassifyError(null);
    setPhase("scraping");
    setProgress(`URL 1/${valid.length} · ${friendlyLabel("opening")} · 0 ads`);

    const collected: ClassifiedAd[] = [];
    try {
      await scrapeAds(valid, controller.signal, (event) => {
        if (event.type === "progress") {
          setProgress(
            `URL ${event.urlIndex}/${event.urlCount} · ${friendlyLabel(event.phase)} · ${event.adsFound} ads`,
          );
        }
        if (event.type === "ads") {
          const next = event.ads.map((ad) => ({
            ...ad,
            classification: null,
          }));
          collected.push(...next);
          setAds([...collected]);
          if (next.length) setPhase("results");
        }
        if (event.type === "url") {
          setResults((current) => {
            const rest = current.filter(
              (item) => item.url !== event.result.url,
            );
            return [...rest, event.result];
          });
        }
        if (event.type === "error") {
          setClassifyError(event.error);
        }
      });
    } catch (error) {
      if (controller.signal.aborted) {
        setProgress("Cancelled · ads kept");
        setBusy(false);
        setPhase(collected.length ? "results" : "empty");
        return;
      }
      const message = error instanceof Error ? error.message : "Scrape failed";
      setProgress(message);
      setBusy(false);
      setPhase(collected.length ? "results" : "empty");
      return;
    }

    if (controller.signal.aborted) {
      setBusy(false);
      setPhase(collected.length ? "results" : "empty");
      return;
    }

    if (!collected.length) {
      setBusy(false);
      setPhase("empty");
      setProgress("Scrape returned 0 ads");
      return;
    }

    setPhase("classifying");
    setProgress(`Classifying 1/${collected.length}`);
    try {
      await classifyAds(collected, controller.signal, (event) => {
        if (event.type === "progress") {
          setProgress(`Classifying ${event.index}/${event.total}`);
        }
        if (event.type === "ad") {
          setAds((current) =>
            current.map((ad) => (ad.id === event.ad.id ? event.ad : ad)),
          );
        }
        if (event.type === "done") {
          if (event.skipped || event.error) {
            setClassifyError(event.error ?? "Classification skipped.");
            setProgress(
              event.skipped
                ? "Classify skipped · ads kept"
                : (event.error ?? "Classify failed"),
            );
          } else {
            setProgress(`Classified ${event.ads.length}`);
          }
          if (event.ads.length) setAds(event.ads);
        }
      });
      setPhase("classified");
    } catch (error) {
      if (!controller.signal.aborted) {
        const message =
          error instanceof Error ? error.message : "Classify failed";
        setClassifyError(message);
      }
      setPhase("results");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const allFailed =
    results.length > 0 && results.every((item) => !item.ok) && ads.length === 0;
  const emptyResults = !busy && ads.length === 0 && results.length > 0;
  const noFilterMatch = ads.length > 0 && filtered.length === 0;
  const scoreMin = health?.winnerScoreMin ?? DEFAULT_WINNER_SCORE_MIN;
  const daysMin = health?.winnerDaysMin ?? DEFAULT_WINNER_DAYS_MIN;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>adjudge</h1>
          <p className="lede">
            Paste Ad Library URLs. Scrape real ads. Classify. Filter. Export.
          </p>
        </div>
        <div>
          <p className="count" aria-label={`${ads.length} ads`}>
            {filtered.length} / {ads.length}
          </p>
          <p className="phase">
            <span>{PHASE_LABEL[phase]}</span>
            {progress ? <span> · {progress}</span> : null}
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
          <button
            type="button"
            className="run"
            onClick={() => void run()}
            disabled={busy}
          >
            Run
          </button>
          <button
            type="button"
            className="cancel"
            onClick={stop}
            disabled={!busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="export"
            onClick={() => downloadCsv(visible)}
            disabled={!visible.length}
          >
            CSV
          </button>
        </div>
        {overflow ? (
          <p className="note">Only the first 5 unique URLs will run.</p>
        ) : null}
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
          <p className="banner">
            TypeSafe key missing. Ads stay visible; classify will skip.
          </p>
        ) : null}
      </section>

      <ol className="slots" aria-label="URL slots">
        {Array.from({ length: 5 }, (_, index) => {
          const result = results[index];
          const className = result ? (result.ok ? "ok" : "fail") : "";
          return (
            <li key={index} className={className}>
              URL {String(index + 1).padStart(2, "0")}
            </li>
          );
        })}
      </ol>

      {results.length ? (
        <ol className="url-results proof" data-proof>
          {results.map((result, index) => (
            <li key={result.url} className={result.ok ? "ok" : "fail"}>
              <span>URL {String(index + 1).padStart(2, "0")}</span>
              <span className="url">{result.url}</span>
              <span>
                {result.ok
                  ? `${result.adCount} ads`
                  : friendlyLabel(result.error ?? "failed")}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <section className="filters">
        <label className="search">
          <span>Search</span>
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters({ ...filters, query: event.target.value })
            }
          />
        </label>
        <div className="dials">
          <FilterSelect
            label={FILTER_LABELS.hook}
            value={filters.hook}
            onChange={(hook) => setFilters({ ...filters, hook })}
            options={choiceFilterKeys(HOOK_OPTIONS)}
          />
          <FilterSelect
            label={FILTER_LABELS.tactic}
            value={filters.tactic}
            onChange={(tactic) => setFilters({ ...filters, tactic })}
            options={[...TACTIC_OPTIONS]}
          />
          <FilterSelect
            label={FILTER_LABELS.headline_tactic}
            value={filters.headline_tactic}
            onChange={(headline_tactic) =>
              setFilters({ ...filters, headline_tactic })
            }
            options={choiceFilterKeys(HEADLINE_TACTIC_OPTIONS)}
          />
          <FilterSelect
            label={FILTER_LABELS.messaging_angle}
            value={filters.messaging_angle}
            onChange={(messaging_angle) =>
              setFilters({ ...filters, messaging_angle })
            }
            options={choiceFilterKeys(MESSAGING_ANGLE_OPTIONS)}
          />
          <FilterSelect
            label={FILTER_LABELS.offer_type}
            value={filters.offer_type}
            onChange={(offer_type) => setFilters({ ...filters, offer_type })}
            options={choiceFilterKeys(OFFER_TYPE_OPTIONS)}
          />
          <FilterSelect
            label={FILTER_LABELS.seasonality}
            value={filters.seasonality}
            onChange={(seasonality) => setFilters({ ...filters, seasonality })}
            options={choiceFilterKeys(SEASONALITY_OPTIONS)}
          />
          <FilterSelect
            label={FILTER_LABELS.intended_audience}
            value={filters.intended_audience}
            onChange={(intended_audience) =>
              setFilters({ ...filters, intended_audience })
            }
            options={choiceFilterKeys(INTENDED_AUDIENCE_OPTIONS)}
          />
          <FilterSelect
            label={FILTER_LABELS.platform}
            value={filters.platform}
            onChange={(platform) => setFilters({ ...filters, platform })}
            options={platforms}
          />
          <FilterSelect
            label={FILTER_LABELS.media_type}
            value={filters.media_type}
            onChange={(media_type) => setFilters({ ...filters, media_type })}
            options={mediaTypes}
          />
          <FilterSelect
            label={FILTER_LABELS.sourceUrl}
            value={filters.sourceUrl}
            onChange={(sourceUrl) => setFilters({ ...filters, sourceUrl })}
            options={sources}
          />
          <FilterSelect
            label={FILTER_LABELS.still_active}
            value={filters.still_active}
            onChange={(still_active) =>
              setFilters({ ...filters, still_active })
            }
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <FilterSelect
            label={FILTER_LABELS.winner}
            value={filters.winner}
            onChange={(winner) => setFilters({ ...filters, winner })}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
          <label className="range">
            <span>{FILTER_LABELS.creative_score}</span>
            <span className="range-inputs">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                value={filters.scoreMin}
                onChange={(event) =>
                  setFilters({ ...filters, scoreMin: event.target.value })
                }
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                value={filters.scoreMax}
                onChange={(event) =>
                  setFilters({ ...filters, scoreMax: event.target.value })
                }
              />
            </span>
          </label>
          <label className="range">
            <span>{FILTER_LABELS.running_days}</span>
            <span className="range-inputs">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                value={filters.daysMin}
                onChange={(event) =>
                  setFilters({ ...filters, daysMin: event.target.value })
                }
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                value={filters.daysMax}
                onChange={(event) =>
                  setFilters({ ...filters, daysMax: event.target.value })
                }
              />
            </span>
          </label>
        </div>
      </section>

      {ads.length ? (
        <details className="picker">
          <summary>Meta columns</summary>
          <div className="choices">
            {availableExtra.map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={extraColumns.includes(key)}
                  onChange={() => toggleColumn(key)}
                />
                {friendlyLabel(key)}
              </label>
            ))}
          </div>
        </details>
      ) : null}

      {allFailed ? (
        <EmptyState>All URLs failed. No ads were invented.</EmptyState>
      ) : emptyResults ? (
        <EmptyState>Scrape returned 0 ads. Nothing was invented.</EmptyState>
      ) : !ads.length && !busy ? (
        <EmptyState>
          {valid.length
            ? "Ready to run."
            : draft.trim()
              ? "Those lines are not Ad Library URLs."
              : "Paste Ad Library URLs to start."}
        </EmptyState>
      ) : noFilterMatch ? (
        <EmptyState>No rows match these filters.</EmptyState>
      ) : (
        <div className="table-wrap proof" data-proof>
          <table className="results">
            <thead>
              <tr>
                <SortHeader
                  label="Thumb"
                  column="thumb"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="Page"
                  column="page"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="Body"
                  column="body"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="Headline"
                  column="headline"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="CTA"
                  column="cta"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="Platforms"
                  column="platforms"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="Hook"
                  column="hook"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label="Tactics"
                  column="tactics"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.headline_tactic}
                  column="headline_tactic"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.messaging_angle}
                  column="messaging_angle"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.offer_type}
                  column="offer_type"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.seasonality}
                  column="seasonality"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.intended_audience}
                  column="intended_audience"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.still_active}
                  column="still_active"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.running_days}
                  column="running_days"
                  sort={sort}
                  onSort={cycleSort}
                />
                <SortHeader
                  label={FILTER_LABELS.creative_score}
                  column="creative_score"
                  sort={sort}
                  onSort={cycleSort}
                  title={WINNER_TOOLTIP}
                />
                <SortHeader
                  label={FILTER_LABELS.winner}
                  column="winner"
                  sort={sort}
                  onSort={cycleSort}
                  title={WINNER_TOOLTIP}
                />
                {extraColumns.map((key) => (
                  <SortHeader
                    key={key}
                    label={friendlyLabel(key)}
                    column={`meta:${key}`}
                    sort={sort}
                    onSort={cycleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((ad) => (
                <tr
                  key={ad.id}
                  className={ad.id === selectedId ? "selected" : undefined}
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
                    <span>{ad.id}</span>
                    <strong>{displayValue(ad.page_name)}</strong>
                  </td>
                  <td>{snippet(ad.body)}</td>
                  <td>{displayValue(ad.headline)}</td>
                  <td>{displayValue(ad.cta_text)}</td>
                  <td>{formatList(ad.platforms)}</td>
                  <td>
                    {ad.classification?.hook?.choice ? (
                      <span className="tag">
                        {friendlyLabel(ad.classification.hook.choice)}
                      </span>
                    ) : (
                      <Ghost>{NO_VALUE}</Ghost>
                    )}
                  </td>
                  <td>
                    <Tags values={ad.classification?.tactics ?? []} />
                  </td>
                  {CHOICE_COLUMNS.map((key) => (
                    <td key={key}>
                      {ad.classification?.[key]?.choice ? (
                        <span className="tag">
                          {friendlyLabel(ad.classification[key]?.choice ?? "")}
                        </span>
                      ) : (
                        <Ghost>{NO_VALUE}</Ghost>
                      )}
                    </td>
                  ))}
                  <td>{displayValue(ad.still_active)}</td>
                  <td>{displayValue(ad.running_days)}</td>
                  <td title={WINNER_TOOLTIP}>
                    {displayValue(ad.creative_score)}
                  </td>
                  <td title={WINNER_TOOLTIP}>{displayValue(ad.winner)}</td>
                  {extraColumns.map((key) => (
                    <td key={key}>{displayValue(ad.meta?.[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <Drawer
          ad={selected}
          scoreMin={scoreMin}
          daysMin={daysMin}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  title,
}: {
  label: string;
  column: string;
  sort: SortState | null;
  onSort: (column: string) => void;
  title?: string;
}) {
  const active = sort?.key === column;
  const dir = active ? sort.dir : null;
  const ariaSort = !dir ? "none" : dir === "asc" ? "ascending" : "descending";
  const state =
    dir === "asc"
      ? "sorted ascending"
      : dir === "desc"
        ? "sorted descending"
        : "not sorted";
  return (
    <th scope="col" aria-sort={ariaSort} title={title}>
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-label={`${label}, ${state}. Activate to sort.`}
      >
        <span>{label}</span>
        <svg
          className="sort-mark"
          viewBox="0 0 8 12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className={dir === "asc" ? "on" : dir ? "off" : "idle"}
            d="M4 1.2 7.2 5.4H.8Z"
          />
          <path
            className={dir === "desc" ? "on" : dir ? "off" : "idle"}
            d="M4 10.8 7.2 6.6H.8Z"
          />
        </svg>
      </button>
    </th>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => {
          const key = typeof option === "string" ? option : option.value;
          const text =
            typeof option === "string" ? friendlyLabel(option) : option.label;
          return (
            <option key={key} value={key}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Drawer({
  ad,
  scoreMin,
  daysMin,
  onClose,
}: {
  ad: ClassifiedAd;
  scoreMin: number;
  daysMin: number;
  onClose: () => void;
}) {
  const extraKeys = unsectionedMetaKeys(Object.keys(ad.meta ?? {}));
  const classification = ad.classification;
  return (
    <aside className="drawer" role="dialog" aria-label="Ad detail">
      <button type="button" className="close" onClick={onClose}>
        Close
      </button>
      <p>{ad.id}</p>
      <h2>{displayValue(ad.page_name)}</h2>
      <Thumb url={ad.thumb_url} name={ad.page_name ?? ad.id} large />
      {ad.video_urls[0] ? (
        <p className="note">Video URL on file. Poster shown; CDN may expire.</p>
      ) : null}
      <p className="body">{displayValue(ad.body)}</p>
      <p>
        {ad.link_url ? (
          <a href={ad.link_url} target="_blank" rel="noreferrer">
            Outbound link
          </a>
        ) : (
          <span>{NO_VALUE}</span>
        )}
        {" · "}
        <a href={ad.ad_library_url} target="_blank" rel="noreferrer">
          Ad Library
        </a>
      </p>

      <section>
        <h3>Classification</h3>
        <dl>
          <Field label="Hook" value={choiceLabel(classification?.hook)} />
          <Field
            label="Tactics"
            value={formatList(classification?.tactics ?? [])}
          />
          <Field
            label={FILTER_LABELS.headline_tactic}
            value={choiceLabel(classification?.headline_tactic)}
          />
          <Field
            label={FILTER_LABELS.messaging_angle}
            value={choiceLabel(classification?.messaging_angle)}
          />
          <Field
            label={FILTER_LABELS.offer_type}
            value={choiceLabel(classification?.offer_type)}
          />
          <Field
            label={FILTER_LABELS.seasonality}
            value={choiceLabel(classification?.seasonality)}
          />
          <Field
            label={FILTER_LABELS.intended_audience}
            value={choiceLabel(classification?.intended_audience)}
          />
          <Field
            label="Asset type"
            value={choiceLabel(classification?.asset_type)}
          />
          <Field
            label="Visual format"
            value={choiceLabel(classification?.visual_format)}
          />
        </dl>
      </section>

      <section>
        <h3>Winner signals</h3>
        <p className="note">
          Heuristic only. Winner when creative score is at least {scoreMin} and
          running days is at least {daysMin}. Ad Library usually lacks spend,
          impressions, and ROAS.
        </p>
        <dl>
          <Field
            label={FILTER_LABELS.still_active}
            value={displayValue(ad.still_active)}
          />
          <Field
            label={FILTER_LABELS.running_days}
            value={displayValue(ad.running_days)}
          />
          <Field
            label={FILTER_LABELS.creative_score}
            value={displayValue(ad.creative_score)}
          />
          <Field label={FILTER_LABELS.winner} value={displayValue(ad.winner)} />
        </dl>
      </section>

      {META_SECTIONS.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <dl>
            {section.keys.map((key) => (
              <Field
                key={key}
                label={friendlyLabel(key)}
                value={displayValue(ad.meta?.[key])}
              />
            ))}
          </dl>
        </section>
      ))}

      {extraKeys.length ? (
        <section>
          <h3>Other Meta fields</h3>
          <dl>
            {extraKeys.map((key) => (
              <Field
                key={key}
                label={friendlyLabel(key)}
                value={displayValue(ad.meta?.[key])}
              />
            ))}
          </dl>
        </section>
      ) : null}

      <section>
        <h3>Raw</h3>
        <pre className="raw">{JSON.stringify(ad.raw, null, 2)}</pre>
      </section>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="empty proof" data-proof>
      {children}
    </p>
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
    return (
      <span
        className={`thumb placeholder ${large ? "large" : ""}`}
        aria-hidden="true"
      />
    );
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
