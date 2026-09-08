import { sha256Hex } from "./sha256";
import { slugifyKey } from "./question-bank";

export type CrawlerSourceStatus = "active" | "broken" | "proposed" | "disabled";
export type CrawlerSourceTrust = "high" | "medium" | "low";
export type CrawlerStrategy = "listing-links" | "banca-portal" | "fixture";

export interface CrawlerSource {
  id: string;
  domain: string;
  name: string;
  startUrls: string[];
  strategy: CrawlerStrategy;
  /** CSS selector for candidate link nodes (defaults to "a[href]"). */
  linkSelector?: string;
  /** Regex strings matched against href or link text to keep candidates. */
  linkPatterns: string[];
  /** Regex strings that hint an open / accepting inscription process. */
  openPatterns: string[];
  trust: CrawlerSourceTrust;
  status: CrawlerSourceStatus;
  politenessMs: number;
  failCount: number;
  lastOkAt?: string | null;
  lastError?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenExamRecord {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  emphasis: string[];
  editalUrl: string | null;
  listingUrl: string;
  status: "open" | "unknown";
  sourceId: string;
  sourceDomain: string;
  discoveredAt: string;
  lastSeenAt: string;
}

export interface CrawlerRunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "ok" | "partial" | "failed";
  sourcesOk: number;
  sourcesFailed: number;
  openDiscovered: number;
  proposedSources: number;
  bankUpserts: number;
  searchTriggered: number;
  errors: string[];
}

export interface CrawlerObservability {
  lastRun: CrawlerRunSummary | null;
  sources: {
    total: number;
    active: number;
    broken: number;
    proposed: number;
    disabled: number;
  };
  openExams: number;
}

export function crawlerSourceId(domain: string, name: string): string {
  return sha256Hex(`${slugifyKey(domain)}|${slugifyKey(name)}`).slice(0, 24);
}

export function openExamId(input: {
  examSlug: string;
  listingUrl: string;
  title: string;
}): string {
  return sha256Hex(`${input.examSlug}|${input.listingUrl}|${input.title}`).slice(0, 24);
}

export function registrySourceKey(id: string): string {
  return `crawl:src:${id}`;
}

export function registryIndexKey(): string {
  return "crawl:src:index";
}

export function openExamKey(id: string): string {
  return `crawl:open:${id}`;
}

export function openExamIndexKey(): string {
  return "crawl:open:index";
}

export function crawlerLastRunKey(): string {
  return "crawl:run:last";
}

export function crawlerRunLockKey(): string {
  return "crawl:run:lock";
}

export function crawlerForceRunKey(): string {
  return "crawl:run:force";
}

export function sourceListingFingerprintKey(sourceId: string): string {
  return `crawl:src:${sourceId}:listingFp`;
}

/** Content identity for an open exam (ignores timestamps / redis id). */
export function openExamFingerprint(
  record: Pick<
    OpenExamRecord,
    | "examSlug"
    | "title"
    | "org"
    | "banca"
    | "emphasis"
    | "editalUrl"
    | "listingUrl"
    | "status"
    | "sourceId"
    | "sourceDomain"
  >,
): string {
  const emphasis = [...record.emphasis].map((e) => e.trim()).filter(Boolean).sort();
  return sha256Hex(
    [
      record.examSlug,
      record.title,
      record.org ?? "",
      record.banca ?? "",
      emphasis.join(","),
      record.editalUrl ?? "",
      record.listingUrl,
      record.status,
      record.sourceId,
      record.sourceDomain,
    ].join("|"),
  );
}

/** Fingerprint of a source listing page discovery set. */
export function listingsFingerprint(
  listings: ReadonlyArray<{ title: string; href: string }>,
): string {
  const rows = listings
    .map((l) => `${l.href.trim()}|${l.title.replace(/\s+/g, " ").trim()}`)
    .sort();
  return sha256Hex(rows.join("\n"));
}

/** Normalize a discovered listing into bank-friendly identity fields. */
export function normalizeOpenExam(input: {
  title: string;
  href: string;
  sourceId: string;
  sourceDomain: string;
  orgHint?: string | null;
  bancaHint?: string | null;
}): Omit<OpenExamRecord, "id" | "discoveredAt" | "lastSeenAt"> {
  const title = input.title.replace(/\s+/g, " ").trim();
  const org =
    input.orgHint?.trim() ||
    extractKnownOrg(title) ||
    extractKnownOrg(input.sourceDomain);
  const banca = input.bancaHint?.trim() || extractKnownBanca(title);
  const slugParts = [org, banca].filter(Boolean).map(String);
  const examSlug = slugifyKey(
    slugParts.length > 0 ? slugParts.join(" ") : title.slice(0, 80),
  );
  const emphasis = extractEmphasisHints(title);
  const editalUrl = /edital|pdf/i.test(input.href) ? input.href : null;

  return {
    examSlug,
    title,
    org,
    banca,
    emphasis,
    editalUrl,
    listingUrl: input.href,
    status: looksOpen(title) ? "open" : "unknown",
    sourceId: input.sourceId,
    sourceDomain: input.sourceDomain,
  };
}

const ORG_RE =
  /\b(transpetro|petrobras|banco\s+do\s+brasil|\bbb\b|caixa(?:\s+econ[oô]mica)?|correios|marinha|inss|receita\s+federal|pol[ií]cia\s+federal|\bpf\b|prefeitura|ibamsp|aneel|anatel|anvisa|ibama|mpm|mpu|tcu|tst|trf|trt|prf)\b/i;
const BANCA_RE =
  /\b(cesgranrio|fgv|fcc|cebraspe|cespe|vunesp|ibfc|iades|fundatec|ibamsp)\b/i;
const OPEN_RE =
  /\b(inscri[cç][oõ]es?\s+abertas?|edital\s+publicado|concurso\s+aberto|aceita\s+inscri|prazo\s+de\s+inscri)/i;
const EMPHASIS_RE =
  /\b(administra[cç][aã]o|engenharia(?:\s+\w+)?|direito|contabilidade|tecnologia\s+da\s+informa[cç][aã]o|\bTI\b|enfermagem|medicina)\b/gi;

export function extractKnownOrg(text: string): string | null {
  const m = text.match(ORG_RE);
  return m?.[0]?.trim() ?? null;
}

export function extractKnownBanca(text: string): string | null {
  const m = text.match(BANCA_RE);
  return m?.[0]?.trim() ?? null;
}

export function looksOpen(text: string): boolean {
  return OPEN_RE.test(text);
}

export function extractEmphasisHints(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(EMPHASIS_RE)) {
    found.add(m[0].replace(/\s+/g, " ").trim());
  }
  return [...found].slice(0, 6);
}

export function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}
