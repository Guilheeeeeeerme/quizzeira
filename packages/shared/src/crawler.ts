import { sha256Hex } from "./sha256";
import { slugifyKey } from "./slug";
import type { ArtifactKindHint, RoleHint } from "./pipeline/roles";

export type CrawlerSourceStatus = "active" | "broken" | "proposed" | "disabled";
export type CrawlerSourceTrust = "high" | "medium" | "low";
/**
 * `oab-fgv` is the one exam-specific strategy: the FGV portal renders its
 * document list only after an ASP.NET postback, so a plain listing crawl of
 * oab.fgv.br returns an empty page. See docs/oab-exam.md.
 */
export type CrawlerStrategy = "listing-links" | "banca-portal" | "fixture" | "oab-fgv";

/** Nature of the publisher; crawl policy lives here (§6.2). */
export const SOURCE_KINDS = [
  "banca_portal",
  "org_portal",
  "aggregator",
  "official_gazette",
  "legislation",
  "educational_site",
  "open_textbook",
  "standards_body",
  "question_bank_public",
  "exam_specific",
  "fixture",
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export const DISCOVERY_MODES = ["listing", "topic_query", "direct", "custom"] as const;
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

export const EXAM_KINDS = ["concurso", "oab", "certification", "vestibular", "other"] as const;
export type ExamKind = (typeof EXAM_KINDS)[number];

export type ExamStatusSource = "date" | "regex" | "llm" | "admin";

/** Default domain authority per source kind (§19.1). */
export const SOURCE_KIND_AUTHORITY: Record<SourceKind, number> = {
  legislation: 0.95,
  standards_body: 0.9,
  banca_portal: 0.9,
  official_gazette: 0.9,
  org_portal: 0.85,
  exam_specific: 0.9,
  open_textbook: 0.75,
  educational_site: 0.5,
  question_bank_public: 0.5,
  aggregator: 0.3,
  fixture: 0.5,
};

/** Roles a source of this kind may produce (§6.2). */
export const SOURCE_KIND_DEFAULT_ROLES: Record<SourceKind, readonly RoleHint[]> = {
  banca_portal: ["specification", "evidence", "administrative"],
  org_portal: ["specification", "administrative"],
  aggregator: ["administrative", "evidence"],
  official_gazette: ["specification"],
  legislation: ["knowledge"],
  educational_site: ["knowledge"],
  open_textbook: ["knowledge"],
  standards_body: ["knowledge"],
  question_bank_public: ["evidence"],
  exam_specific: ["specification", "evidence"],
  fixture: ["specification", "evidence", "knowledge", "administrative"],
};

export interface CrawlerSource {
  id: string;
  domain: string;
  name: string;
  startUrls: string[];
  strategy: CrawlerStrategy;
  kind: SourceKind;
  discoveryMode: DiscoveryMode;
  allowedRoles: RoleHint[];
  /** Admin override of the per-kind default authority. */
  authorityScore?: number | null;
  licenseNote?: string | null;
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
  robotsCache?: { fetchedAt: string; disallow: string[]; allowAll?: boolean } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenExamRecord {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  kind: ExamKind;
  editionKey: string | null;
  detailUrl: string | null;
  registrationEnd: string | null;
  statusSource: ExamStatusSource | null;
  /** Cargos discovered on the detail page; the authoritative list is the Syllabus. */
  positions: string[];
  editalUrl: string | null;
  listingUrl: string;
  status: "open" | "unknown";
  sourceId: string;
  sourceDomain: string;
  discoveredAt: string;
  lastSeenAt: string;
}

export interface TopicQueryDto {
  id: string;
  examId: string;
  examSlug: string;
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

export interface ArtifactFetchSignals {
  provider?: string;
  rank?: number;
  query?: string;
  searchTitle?: string;
  authority?: number;
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
  /** Topic queries processed in topic-query mode. */
  topicQueriesRun: number;
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
    | "kind"
    | "editionKey"
    | "editalUrl"
    | "listingUrl"
    | "status"
    | "sourceId"
    | "sourceDomain"
  >,
): string {
  return sha256Hex(
    [
      record.examSlug,
      record.title,
      record.org ?? "",
      record.banca ?? "",
      record.kind,
      record.editionKey ?? "",
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

// ---------------------------------------------------------------------------
// Exam identity, kind and open detection (§11.2)
// ---------------------------------------------------------------------------

const MONTHS_PT: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, março: 3, abril: 4, maio: 5, junho: 6, julho: 7,
  agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

function toIsoDate(day: string, month: string, year: string): string | null {
  const d = Number(day);
  const m = /^\d+$/.test(month) ? Number(month) : MONTHS_PT[month.toLowerCase()] ?? NaN;
  let y = Number(year);
  if (year.length === 2) y += 2000;
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const DATE_TOKEN = String.raw`(\d{1,2})[ºo°]?\s*(?:\/|de\s+)\s*(\d{1,2}|janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:\/|de\s+)\s*(\d{2,4})`;
const WINDOW_RE = new RegExp(
  String.raw`inscri[çc][õo]es?[^.\n]{0,80}?(?:de|entre|per[íi]odo:?|a\s+partir\s+de)?\s*${DATE_TOKEN}\s*(?:a|at[ée]|e|até\s+o\s+dia)\s*(?:o\s+dia\s+)?${DATE_TOKEN}`,
  "i",
);
const END_ONLY_RE = new RegExp(
  String.raw`inscri[çc][õo]es?[^.\n]{0,80}?(?:at[ée]|encerram(?:-se)?\s+(?:em|no\s+dia)|t[ée]rmino:?|prazo\s+final:?|fim:?)\s*(?:o\s+dia\s+)?${DATE_TOKEN}`,
  "i",
);

export interface RegistrationWindow {
  start: string | null;
  /** ISO date (YYYY-MM-DD). */
  end: string;
}

/**
 * "inscrições … de 10/03/2026 a 25/03/2026" / "inscrições até 25 de março de 2026".
 * Returns null when no end date is parseable.
 */
export function parseRegistrationWindow(text: string): RegistrationWindow | null {
  const flat = text.replace(/\s+/g, " ");
  const both = WINDOW_RE.exec(flat);
  if (both) {
    const start = toIsoDate(both[1], both[2], both[3]);
    const end = toIsoDate(both[4], both[5], both[6]);
    if (end) return { start, end };
  }
  const endOnly = END_ONLY_RE.exec(flat);
  if (endOnly) {
    const end = toIsoDate(endOnly[1], endOnly[2], endOnly[3]);
    if (end) return { start: null, end };
  }
  return null;
}

/** `open` iff today ≤ registration end (§11.2 item 4). */
export function isRegistrationOpen(window: RegistrationWindow | null, today: Date = new Date()): boolean {
  if (!window) return false;
  const todayIso = today.toISOString().slice(0, 10);
  return todayIso <= window.end;
}

const NON_CONCURSO_RE =
  /\b(certifica[çc][ãa]o|\bcfp\b|\bcpa-?\d+\b|\bcea\b|vestibular|\bENEM\b|mestrado|doutorado|p[óo]s-gradua[çc][ãa]o|resid[êe]ncia\s+(m[ée]dica|multiprofissional)|processo\s+seletivo\s+(?:de|para)\s+(?:alunos|ingresso|gradua[çc][ãa]o|curso)|est[áa]gio|trainee|bolsa\s+de\s+estudos)\b/i;
const CONCURSO_RE = /\bconcurso\s+p[úu]blico\b|\bconcurso\b|\bedital\b.*\bcargo/i;
const OAB_RE = /exame\s+de\s+ordem|\boab\b/i;

/** Non-concurso filter (§11.2 item 5). Screenshot #2 and #6 were this bug. */
export function classifyExamKind(text: string): ExamKind {
  const flat = text.replace(/\s+/g, " ");
  if (OAB_RE.test(flat)) return "oab";
  if (/\bvestibular\b|\bENEM\b/i.test(flat)) return "vestibular";
  if (/\bcertifica[çc][ãa]o\b|\bcfp\b|\bcpa-?\d+\b|\bcea\b/i.test(flat) && !CONCURSO_RE.test(flat)) {
    return "certification";
  }
  if (NON_CONCURSO_RE.test(flat) && !CONCURSO_RE.test(flat)) return "other";
  return "concurso";
}

/** "Edital nº 01/2026" → "edital-01-2026"; "2026" → "2026"; else null. */
export function extractEditionKey(text: string): string | null {
  const flat = text.replace(/\s+/g, " ");
  const edital = /edital\s+(?:de\s+abertura\s+)?n?[ºo°.]?\s*(\d{1,4})\s*\/\s*(20\d{2})/i.exec(flat);
  if (edital) return `edital-${edital[1].padStart(2, "0")}-${edital[2]}`;
  const numbered = /\b(\d{1,3})[ºo°]\s+(?:concurso|exame|edi[çc][ãa]o)/i.exec(flat);
  const year = /\b(20\d{2})\b/.exec(flat);
  if (numbered && year) return `${numbered[1]}-${year[1]}`;
  if (year) return year[1];
  return null;
}

/** Exam slug = slug(org) + "-" + editionKey (§11.2 item 2). */
export function examSlugFromIdentity(org: string, editionKey: string): string {
  return `${slugifyKey(org, 40)}-${slugifyKey(editionKey, 20)}`;
}

/**
 * Normalize a discovered listing row into a *candidate* exam. Identity prefers
 * the concurso detail path, then (org, edition); anchor text is never a slug.
 */
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
  const editionKey = extractEditionKey(`${title} ${input.href}`);
  const pathSlug = concursoPathSlug(input.href);
  const identityOrg = org ?? domainFromUrl(input.href) ?? input.sourceDomain;
  const examSlug =
    pathSlug ??
    examSlugFromIdentity(identityOrg, editionKey ?? sha256Hex(input.href).slice(0, 8));
  const editalUrl = /edital|\.pdf(\?|#|$)/i.test(input.href) ? input.href : null;
  const kind = classifyExamKind(title);
  const likelyOpen = looksLikelyOpen(title) || looksOpenExamUrl(input.href);

  return {
    examSlug,
    title,
    org,
    banca,
    kind,
    editionKey,
    detailUrl: editalUrl ? null : input.href,
    registrationEnd: null,
    statusSource: likelyOpen ? "regex" : null,
    positions: [],
    editalUrl,
    listingUrl: input.href,
    status: likelyOpen && kind === "concurso" ? "open" : "unknown",
    sourceId: input.sourceId,
    sourceDomain: input.sourceDomain,
  };
}

/** `https://banca/concurso/transpetro-2026/` → `transpetro-2026`. */
export function concursoPathSlug(href: string): string | null {
  try {
    const path = new URL(href).pathname;
    const m = path.match(/\/concursos?\/([^/]+)\/?$/i);
    if (!m?.[1]) return null;
    const raw = decodeURIComponent(m[1]).replace(/[-_]+/g, " ").trim();
    if (!raw || /\.(pdf|html?)$/i.test(raw)) return null;
    // A bare id ("/concursos/1") or a two-letter code is not an identity; fall
    // back to (org, edition) so unrelated portals never share an examSlug.
    if (!/\p{L}/u.test(raw) || raw.length < 3) return null;
    return slugifyKey(raw);
  } catch {
    return null;
  }
}

const ORG_RE =
  /\b(transpetro|petrobras|banco\s+do\s+brasil|\bbb\b|caixa(?:\s+econ[oô]mica)?|correios|marinha|inss|receita\s+federal|pol[ií]cia\s+federal|\bpf\b|prefeitura(?:\s+(?:municipal\s+)?de\s+[\p{L}\s]{3,30})?|tribunal\s+de\s+contas(?:\s+d[oa]\s+(?:estado\s+)?(?:d[eo]\s+)?[\p{L}\s]{3,30})?|secretaria\s+de\s+estado\s+da\s+fazenda(?:\s+de\s+[\p{L}\s]{3,30})?|ibamsp|aneel|anatel|anvisa|ibama|mpm|mpu|tcu|tst|trf\s*\d?|trt\s*\d{0,2}|tre-?[a-z]{2}|tce-?[a-z]{2}|tj-?[a-z]{2}|prf|sefaz-?[a-z]{2}|sef-?[a-z]{2})\b/iu;
const BANCA_RE =
  /\b(cesgranrio|fgv|fcc|cebraspe|cespe|vunesp|ibfc|iades|fundatec|ibamsp|idecan|aocp|quadrix|consulplan|instituto\s+a[o]cp|funcab|cetro|ibade)\b/i;
const LIKELY_OPEN_RE =
  /\b(inscri[cç][oõ]es?\s+abertas?|edital\s+(?:publicado|de\s+abertura)|concurso\s+(?:aberto|p[uú]blico)|aceita\s+inscri|prazo\s+de\s+inscri|per[íi]odo\s+de\s+inscri)/i;

export function extractKnownOrg(text: string): string | null {
  const m = text.match(ORG_RE);
  return m?.[0]?.replace(/\s+/g, " ").trim() ?? null;
}

export function extractKnownBanca(text: string): string | null {
  const m = text.match(BANCA_RE);
  return m?.[0]?.trim() ?? null;
}

/** Regex-only signal: "likely open", never "open" on its own (§11.2 item 4). */
export function looksLikelyOpen(text: string): boolean {
  return LIKELY_OPEN_RE.test(text);
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

/** "para o cargo de Analista" / "para os cargos de A, B e C" (§15.1 item 3). */
export function extractPositionsFromText(text: string): string[] {
  const flat = text.replace(/\s+/g, " ");
  const out = new Set<string>();
  for (const m of flat.matchAll(/cargos?\s+de\s+([^.;:\n(]{3,120})/gi)) {
    for (const part of m[1].split(/\s*(?:,|\se\s|\/)\s*/)) {
      const cleaned = part.replace(/\s+(?:do|da|no|na|para|com)\s.*$/i, "").trim();
      if (cleaned.length >= 3 && cleaned.length <= 60 && !/\d{2}\/\d{2}/.test(cleaned)) {
        out.add(cleaned.replace(/^(?:o|a|os|as)\s+/i, ""));
      }
    }
  }
  return [...out].slice(0, 20);
}

export function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function kindHintFromLabel(label: string, href: string): ArtifactKindHint {
  const text = `${label} ${decodeURIComponent(href)}`.toLowerCase();
  if (/retifica/.test(text)) return "retificacao";
  if (/padr[ãa]o\s+de\s+resposta/.test(text)) return "padrao_resposta";
  if (/gabarito/.test(text)) return "gabarito";
  if (/caderno|\bprova\b|provas\s+anteriores/.test(text)) return "prova";
  if (/conte[úu]do\s+program|programa|ementa/.test(text)) return "programa";
  if (/edital/.test(text)) return "edital";
  if (/apostila/.test(text)) return "apostila";
  if (/\blei\b|decreto|s[úu]mula|constitui/.test(text)) return "lei";
  if (/manual/.test(text)) return "manual";
  return "unknown";
}

export function roleHintFromKind(kind: ArtifactKindHint): RoleHint {
  switch (kind) {
    case "edital":
    case "retificacao":
    case "programa":
      return "specification";
    case "prova":
    case "gabarito":
    case "padrao_resposta":
      return "evidence";
    case "apostila":
    case "lei":
    case "artigo":
    case "manual":
      return "knowledge";
    case "listing":
      return "administrative";
    default:
      return "unknown";
  }
}
