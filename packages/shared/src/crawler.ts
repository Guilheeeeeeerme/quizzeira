import { sha256Hex } from "./sha256";
import { slugifyKey } from "./slug";

export type CrawlerSourceStatus = "active" | "broken" | "proposed" | "disabled";
export type CrawlerSourceTrust = "high" | "medium" | "low";
/**
 * `oab-fgv` is the one exam-specific strategy: the FGV portal renders its
 * document list only after an ASP.NET postback, so a plain listing crawl of
 * oab.fgv.br returns an empty page. See docs/oab-exam.md.
 */
export type CrawlerStrategy = "listing-links" | "banca-portal" | "fixture" | "oab-fgv";

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

export type ExamKind = "concurso" | "oab" | "certification" | "vestibular" | "other";

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
  /** Spec §11 / §29 — concurso vs certification / other. */
  kind?: ExamKind;
  editionKey?: string | null;
  detailUrl?: string | null;
  registrationEnd?: string | null;
  positions?: string[];
}

export interface CrawlerRunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "ok" | "partial" | "failed";
  sourcesOk: number;
  sourcesFailed: number;
  /** Sources whose listing fingerprint was unchanged, so nothing was re-ingested. */
  sourcesSkipped: number;
  openDiscovered: number;
  proposedSources: number;
  /** Artifacts pulled into the Document store during the pass. */
  artifactsStored: number;
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

/** Per-exam pipeline / crawler timeline step (UI detail panel). */
export type ExamActivityStatus = "success" | "error" | "pending" | "skipped" | "running";

export interface ExamActivityEvent {
  id: string;
  examSlug: string;
  at: string;
  status: ExamActivityStatus;
  step: string;
  title: string;
  message: string;
}

export interface ExamActivityTimelineDto {
  examSlug: string;
  examId: string;
  title: string;
  bankQuestionCount: number;
  bankReady: boolean;
  steps: ExamActivityEvent[];
  lastCrawlerRun: CrawlerRunSummary | null;
}

export function examActivityKey(examSlug: string): string {
  return `exam:activity:${slugifyKey(examSlug)}`;
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

const NON_CONCURSO_RE =
  /\b(certifica[cç][aã]o|certifica[cç][aã]o\s+cfp|exame\s+para\s+certifica|processo\s+seletivo\s+de\s+direito|vestibular|mba|p[oó]s-?gradua[cç][aã]o|curso\s+livre)\b/i;

/** Spec §11 — reject certification / non-concurso listings from concurso pipeline. */
export function classifyExamKind(title: string, href = ""): ExamKind {
  const blob = `${title} ${href}`;
  if (/\boab\b|exame\s+de\s+ordem/i.test(blob)) return "oab";
  if (/\bvestibular\b/i.test(blob)) return "vestibular";
  if (NON_CONCURSO_RE.test(blob)) return "certification";
  if (/concurso|edital|tribunal|prefeitura|secretari/i.test(blob)) return "concurso";
  return "other";
}

export function isConcursoEligible(kind: ExamKind): boolean {
  return kind === "concurso" || kind === "oab";
}

/** Build edition key from year / edital number hints. */
export function extractEditionKey(text: string, href = ""): string | null {
  const blob = `${text} ${href}`;
  const edital = blob.match(/edital\s*n[ºo°]?\s*(\d+)\s*\/?\s*(20\d{2})/i);
  if (edital) return `edital-${edital[1]}-${edital[2]}`;
  const year = blob.match(/\b(20\d{2})\b/);
  if (year) {
    const edition = blob.match(/\b(\d{1,2})[ªa]?\s*(edi[cç][aã]o|fase)/i);
    if (edition) return `${year[1]}-${edition[1]}`;
    return year[1];
  }
  return null;
}

/** Exam identity = org + edition (§11.2), not bare anchor text. */
export function examSlugFromIdentity(org: string | null, editionKey: string | null, fallbackTitle: string): string {
  const orgPart = org ? slugifyKey(org) : "";
  const editionPart = editionKey ? slugifyKey(editionKey) : "";
  if (orgPart && editionPart) return `${orgPart}-${editionPart}`;
  // Without an edition key, prefer the listing title so distinct rows do not
  // collapse onto the org slug alone (legacy Transpetro nav poison).
  const titleSlug = slugifyKey(fallbackTitle.slice(0, 80));
  if (titleSlug) return titleSlug;
  if (orgPart) return orgPart;
  return "exam";
}

/** Normalize a discovered listing into bank-friendly identity fields. */
export function normalizeOpenExam(input: {
  title: string;
  href: string;
  sourceId: string;
  sourceDomain: string;
  orgHint?: string | null;
  bancaHint?: string | null;
  editionKey?: string | null;
  detailUrl?: string | null;
  registrationEnd?: string | null;
  positions?: string[];
  kind?: ExamKind;
}): Omit<OpenExamRecord, "id" | "discoveredAt" | "lastSeenAt"> {
  const title = input.title.replace(/\s+/g, " ").trim();
  const org =
    input.orgHint?.trim() ||
    extractKnownOrg(title) ||
    extractKnownOrg(input.sourceDomain);
  const banca = input.bancaHint?.trim() || extractKnownBanca(title);
  const kind = input.kind ?? classifyExamKind(title, input.href);
  const editionKey = input.editionKey ?? extractEditionKey(title, input.href);
  // Prefer /concurso/<slug>/ path, then org+edition identity (§11.2).
  const pathSlug = concursoPathSlug(input.href);
  const examSlug =
    pathSlug ||
    examSlugFromIdentity(org, editionKey, title);
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
    status: looksOpen(title) || looksOpenExamUrl(input.href) ? "open" : "unknown",
    sourceId: input.sourceId,
    sourceDomain: input.sourceDomain,
    kind,
    editionKey,
    detailUrl: input.detailUrl ?? input.href,
    registrationEnd: input.registrationEnd ?? null,
    positions: input.positions ?? [],
  };
}

/** `https://banca/concurso/transpetro-2026/` → `transpetro-2026`. */
export function concursoPathSlug(href: string): string | null {
  try {
    const path = new URL(href).pathname;
    const m = path.match(/\/concurso\/([^/]+)\/?$/i);
    if (!m?.[1]) return null;
    const raw = decodeURIComponent(m[1]).replace(/[-_]+/g, " ").trim();
    return raw ? slugifyKey(raw) : null;
  } catch {
    return null;
  }
}

const ORG_RE =
  /\b(transpetro|petrobras|banco\s+do\s+brasil|\bbb\b|caixa(?:\s+econ[oô]mica)?|correios|marinha|inss|receita\s+federal|pol[ií]cia\s+federal|\bpf\b|prefeitura|ibamsp|aneel|anatel|anvisa|ibama|mpm|mpu|tcu|tst|trf|trt|prf)\b/i;
const BANCA_RE =
  /\b(cesgranrio|fgv|fcc|cebraspe|cespe|vunesp|ibfc|iades|fundatec|ibamsp)\b/i;
const OPEN_RE =
  /\b(inscri[cç][oõ]es?\s+abertas?|edital\s+(?:publicado|de\s+abertura)|concurso\s+(?:aberto|p[uú]blico)|aceita\s+inscri|prazo\s+de\s+inscri)/i;
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

/** Banca detail pages like /concurso/transpetro-2026/ or /concursos/pms2026. */
export function looksOpenExamUrl(href: string): boolean {
  const current = new Date().getUTCFullYear();
  const inWindow = (year: number) => year >= current - 1 && year <= current + 1;
  const hyphenated = href.match(/\/concursos?\/[^/?#]+-(20\d{2})(?:\/|$)/i);
  if (hyphenated?.[1] && inWindow(Number(hyphenated[1]))) return true;
  const trailing = href.match(/\/concursos?\/[^/?#]*?(20\d{2})(?:\/|$)/i);
  return Boolean(trailing?.[1] && inWindow(Number(trailing[1])));
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
