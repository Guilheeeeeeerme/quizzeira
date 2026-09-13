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

export type DiscoveryMode = "listing" | "topic_query" | "direct" | "custom";

/** Admin-classified source family (§10 / §29.1). */
export type SourceKind =
  | "banca_portal"
  | "org_portal"
  | "aggregator"
  | "official_gazette"
  | "legislation"
  | "educational_site"
  | "open_textbook"
  | "standards_body"
  | "question_bank_public"
  | "exam_specific"
  | "fixture";

/** Exam family for catalog filtering (§29.1). */
export type ExamKind = "concurso" | "oab" | "certification" | "vestibular" | "other";

/** Crawler hint for artifact document kind (§29.1). */
export type ArtifactKindHint =
  | "edital"
  | "retificacao"
  | "programa"
  | "prova"
  | "gabarito"
  | "padrao_resposta"
  | "apostila"
  | "lei"
  | "artigo"
  | "manual"
  | "listing"
  | "unknown";

/** Crawler hint for expected document role (§29.1). */
export type RoleHint = "specification" | "evidence" | "knowledge" | "administrative" | "unknown";

export interface RegistrationWindow {
  start: string;
  end: string;
}

/** Topic-driven knowledge discovery row (§17, §29.1). */
export interface TopicQueryDto {
  id: string;
  examId: string;
  syllabusNodeId: string;
  canonicalKey: string;
  queries: string[];
  status: "queued" | "running" | "done" | "failed";
  candidatesFound: number;
  candidatesStored: number;
  attempts: number;
  nextRunAt: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface CrawlerSource {
  id: string;
  domain: string;
  name: string;
  startUrls: string[];
  strategy: CrawlerStrategy;
  discoveryMode?: DiscoveryMode;
  kind?: SourceKind;
  /** Roles this source may produce (§10). */
  allowedRoles?: RoleHint[];
  authorityScore?: number | null;
  licenseNote?: string;
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
  /** Edition key when parsed from detail page, e.g. "2026-1" (§11.2). */
  editionKey?: string | null;
  /** Parsed exam family; non-concurso rows excluded from study catalog. */
  kind?: ExamKind;
  /** Detail page URL when distinct from listing anchor. */
  detailUrl?: string | null;
  /** ISO date strings from registration window parser. */
  registrationStart?: string | null;
  registrationEnd?: string | null;
  /** How open status was determined. */
  statusSource?: "date" | "regex" | "llm" | "admin" | null;
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
  /\b(CFP|certifica[çc][ãa]o|vestibular|mestrado|resid[êe]ncia m[ée]dica|processo seletivo de faculdade)\b/i;

/**
 * Parse "inscrições … de DD/MM/AAAA a DD/MM/AAAA" patterns (§11.2).
 * Returns ISO date strings (UTC midnight) or null when not found.
 */
export function parseRegistrationWindow(text: string): RegistrationWindow | null {
  const normalized = text.replace(/\s+/g, " ");

  const rangePatterns = [
    /inscri[çc][õo]es?\s+(?:de\s+)?(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(?:a|at[ée])\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /per[ií]odo\s+de\s+inscri[çc][õo]es?\s*(?:de\s+)?(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(?:a|at[ée])\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /inscri[çc][õo]es?\s+abertas?\s+(?:de\s+)?(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(?:a|at[ée])\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ];

  for (const re of rangePatterns) {
    const m = normalized.match(re);
    if (m?.[1] && m[2]) {
      const start = parseBrDate(m[1]);
      const end = parseBrDate(m[2]);
      if (start && end) return { start, end };
    }
  }

  const untilMatch = normalized.match(
    /inscri[çc][õo]es?\s+(?:abertas\s+)?at[ée]\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  );
  if (untilMatch?.[1]) {
    const end = parseBrDate(untilMatch[1]);
    if (end) return { start: end, end };
  }

  return null;
}

function parseBrDate(value: string): string | null {
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = new Date(Date.UTC(year, month - 1, day)).toISOString();
  return iso.slice(0, 10);
}

function isRegistrationOpen(window: RegistrationWindow, now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  return today >= window.start && today <= window.end;
}

/** Infer exam kind from title and optional detail text (§11.2 non-concurso filter). */
export function inferExamKind(title: string, pageText = ""): ExamKind {
  const blob = `${title} ${pageText}`.replace(/<[^>]+>/g, " ");
  if (/\boab\b|exame\s+de\s+ordem/i.test(blob)) return "oab";
  if (/\bvestibular\b/i.test(blob) && !/\bconcurso\s+p[uú]blico\b/i.test(blob)) {
    return "vestibular";
  }
  if (NON_CONCURSO_RE.test(blob) && !/\bconcurso\s+p[uú]blico\b/i.test(blob)) {
    return "other";
  }
  return "concurso";
}

/** Edition key from URL path or title year (§11.2). */
export function extractEditionKey(title: string, href: string): string | null {
  const pathSlug = concursoPathSlug(href);
  if (pathSlug) {
    const yearInSlug = pathSlug.match(/(20\d{2})/);
    if (yearInSlug?.[1]) return yearInSlug[1];
  }

  const hyphenated = href.match(/\/concursos?\/[^/?#]+-(20\d{2})(?:\/|$)/i);
  if (hyphenated?.[1]) return hyphenated[1];

  const titleYear = title.match(/\b(20\d{2})\b/);
  if (titleYear?.[1]) return titleYear[1];

  return null;
}

/** Build edition-based slug: slugify(org) + "-" + editionKey when possible. */
export function buildEditionSlug(org: string | null, editionKey: string | null, fallback: string): string {
  const orgSlug = org ? slugifyKey(org) : "";
  if (orgSlug && editionKey) return `${orgSlug}-${editionKey}`;
  return fallback;
}

/** Normalize a discovered listing into bank-friendly identity fields. */
export function normalizeOpenExam(input: {
  title: string;
  href: string;
  sourceId: string;
  sourceDomain: string;
  orgHint?: string | null;
  bancaHint?: string | null;
  detailText?: string | null;
}): Omit<OpenExamRecord, "id" | "discoveredAt" | "lastSeenAt"> {
  const title = input.title.replace(/\s+/g, " ").trim();
  const org =
    input.orgHint?.trim() ||
    extractKnownOrg(title) ||
    extractKnownOrg(input.sourceDomain);
  const banca = input.bancaHint?.trim() || extractKnownBanca(title);
  const slugParts = [org, banca].filter(Boolean).map(String);
  const pathSlug = concursoPathSlug(input.href);
  const editionKey = extractEditionKey(title, input.href);
  const titleSlug = slugifyKey(title.slice(0, 80)) || slugifyKey(slugParts.join(" ") || "exam");
  const editionSlug = buildEditionSlug(org, editionKey, "");
  const examSlug = pathSlug || editionSlug || titleSlug;
  const emphasis = extractEmphasisHints(title);
  const editalUrl = /edital|pdf/i.test(input.href) ? input.href : null;
  const kind = inferExamKind(title, input.detailText ?? "");

  const registrationText = [input.detailText, title].filter(Boolean).join(" ");
  const registration = parseRegistrationWindow(registrationText);
  const likelyOpen = looksLikelyOpen(title) || looksOpenExamUrl(input.href);
  let status: "open" | "unknown" = likelyOpen ? "open" : "unknown";
  let statusSource: OpenExamRecord["statusSource"] = likelyOpen ? "regex" : null;

  if (registration) {
    status = isRegistrationOpen(registration) ? "open" : "unknown";
    statusSource = "date";
  }

  return {
    examSlug,
    title,
    org,
    banca,
    emphasis,
    editalUrl,
    listingUrl: input.href,
    status,
    sourceId: input.sourceId,
    sourceDomain: input.sourceDomain,
    editionKey: editionKey ?? null,
    kind,
    detailUrl: input.href,
    registrationStart: registration?.start ?? null,
    registrationEnd: registration?.end ?? null,
    statusSource,
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

/** Regex-only open hint; does not consult registration dates (§11.2). */
export function looksLikelyOpen(text: string): boolean {
  return OPEN_RE.test(text);
}

/** @deprecated Use looksLikelyOpen — kept for backward compatibility. */
export function looksOpen(text: string): boolean {
  return looksLikelyOpen(text);
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

/** Map anchor label + URL to kind/role hints (§14.2 tier 0). */
export function classifyDocumentHints(
  label: string,
  url: string,
): { kindHint: ArtifactKindHint; roleHint: RoleHint } {
  const blob = `${label} ${url}`;
  if (/\bretifica/i.test(blob)) {
    return { kindHint: "retificacao", roleHint: "specification" };
  }
  if (/\bedital\b/i.test(blob)) {
    return { kindHint: "edital", roleHint: "specification" };
  }
  if (/\bprograma\b|conte[úu]do\s+program/i.test(blob)) {
    return { kindHint: "programa", roleHint: "specification" };
  }
  if (/\bgabarito\b/i.test(blob)) {
    return { kindHint: "gabarito", roleHint: "evidence" };
  }
  if (/padr[ãa]o\s+de\s+respostas?/i.test(blob)) {
    return { kindHint: "padrao_resposta", roleHint: "evidence" };
  }
  if (/\bprova\b|\bcaderno\b/i.test(blob)) {
    return { kindHint: "prova", roleHint: "evidence" };
  }
  if (/\bapostila\b/i.test(blob)) {
    return { kindHint: "apostila", roleHint: "knowledge" };
  }
  if (/\blei\b|\bart\.\s*\d+/i.test(blob)) {
    return { kindHint: "lei", roleHint: "knowledge" };
  }
  return { kindHint: "unknown", roleHint: "unknown" };
}

/** Legacy ArtifactKind for discovery-api rows without kindHint mapping. */
export function kindHintToArtifactKind(kindHint: ArtifactKindHint): string {
  switch (kindHint) {
    case "edital":
    case "retificacao":
      return "edital";
    case "prova":
      return "prova";
    case "gabarito":
    case "padrao_resposta":
      return "gabarito";
    case "programa":
      return "programa";
    default:
      return "other";
  }
}
