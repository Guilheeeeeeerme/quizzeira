/**
 * Resolve the calendar year of a Discovery exam for product-inventory GC.
 *
 * Product policy: surfaces only care about the current calendar year and the
 * future. Past-year exams are storage garbage once knowledge is retained
 * elsewhere (or when they have no knowledge value).
 *
 * Fail-closed: missing or conflicting year signals → ambiguous (never purge).
 */

export interface ExamYearSignals {
  examDate?: Date | null;
  registrationEnd?: Date | null;
  editionKey?: string | null;
  examSlug?: string | null;
  title?: string | null;
  listingUrl?: string | null;
}

export type ExamYearResolution =
  | { ok: true; year: number; sources: string[] }
  | { ok: false; reason: "missing_year" | "conflicting_years"; years: number[]; sources: string[] };

const YEAR_RE = /\b(20\d{2})\b/;
const EDITION_YEAR_RE = /^(20\d{2})(?:[.\-_].*)?$/;

function pushYear(
  found: Map<number, string[]>,
  year: number | null | undefined,
  source: string,
): void {
  if (year == null || !Number.isInteger(year)) return;
  // Plausible concurso window only — reject OCR/noise far outside.
  if (year < 2000 || year > 2100) return;
  const list = found.get(year) ?? [];
  list.push(source);
  found.set(year, list);
}

function yearFromDate(d: Date | null | undefined): number | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.getUTCFullYear();
}

function yearFromEditionKey(key: string | null | undefined): number | null {
  if (!key) return null;
  const m = key.trim().match(EDITION_YEAR_RE);
  if (m?.[1]) return Number(m[1]);
  const loose = key.match(YEAR_RE);
  return loose?.[1] ? Number(loose[1]) : null;
}

function yearFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(YEAR_RE);
  return m?.[1] ? Number(m[1]) : null;
}

/**
 * Prefer structured fields; fall back to slug/title/URL. Conflicting years
 * across signals → ambiguous.
 */
export function resolveExamYear(signals: ExamYearSignals): ExamYearResolution {
  const found = new Map<number, string[]>();

  pushYear(found, yearFromDate(signals.examDate ?? null), "examDate");
  pushYear(found, yearFromEditionKey(signals.editionKey ?? null), "editionKey");
  pushYear(found, yearFromText(signals.examSlug ?? null), "examSlug");
  pushYear(found, yearFromText(signals.title ?? null), "title");
  pushYear(found, yearFromText(signals.listingUrl ?? null), "listingUrl");
  // registrationEnd is weaker corroboration only when something else already
  // voted — alone it can be a listing scrape of an old portal page.
  const regYear = yearFromDate(signals.registrationEnd ?? null);
  if (regYear != null && found.size > 0) {
    pushYear(found, regYear, "registrationEnd");
  } else if (regYear != null && found.size === 0) {
    pushYear(found, regYear, "registrationEnd");
  }

  if (found.size === 0) {
    return { ok: false, reason: "missing_year", years: [], sources: [] };
  }

  const years = Array.from(found.keys()).sort((a, b) => a - b);
  const sources = Array.from(found.values()).flat();
  if (years.length > 1) {
    return { ok: false, reason: "conflicting_years", years, sources };
  }

  return { ok: true, year: years[0]!, sources };
}

export function isPastCalendarYear(
  year: number,
  now: Date = new Date(),
): boolean {
  return year < now.getUTCFullYear();
}

export function isProductInventoryYear(
  year: number,
  now: Date = new Date(),
): boolean {
  return year >= now.getUTCFullYear();
}
