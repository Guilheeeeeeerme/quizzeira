import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_CHARS = 40_000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;

const BLOCKED_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata.goog",
  "metadata",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

function linkFetchAllowlist(): Set<string> | null {
  const raw = (process.env.LINK_FETCH_ALLOWLIST ?? "").trim();
  if (!raw) return null;
  return new Set(
    raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inCidr(ip: string, base: string, prefix: number): boolean {
  const shift = 32 - prefix;
  return ipv4ToInt(ip) >>> shift === ipv4ToInt(base) >>> shift;
}

/** Block loopback, RFC1918, link-local, CGNAT, and cloud metadata ranges. */
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    if (inCidr(ip, "0.0.0.0", 8)) return true;
    if (inCidr(ip, "10.0.0.0", 8)) return true;
    if (inCidr(ip, "127.0.0.0", 8)) return true;
    if (inCidr(ip, "169.254.0.0", 16)) return true;
    if (inCidr(ip, "172.16.0.0", 12)) return true;
    if (inCidr(ip, "192.168.0.0", 16)) return true;
    if (inCidr(ip, "100.64.0.0", 10)) return true;
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      if (isIP(mapped) === 4) return isBlockedIp(mapped);
    }
    return false;
  }
  return true;
}

export async function assertSafeFetchUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Blocked hostname");
  }

  const allowlist = linkFetchAllowlist();
  if (allowlist && !allowlist.has(hostname)) {
    throw new Error("Hostname not in LINK_FETCH_ALLOWLIST");
  }

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("Blocked IP address");
    return parsed;
  }

  let records: Array<{ address: string }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("DNS resolution failed");
  }
  if (!records.length) throw new Error("DNS resolution returned no addresses");
  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error("Resolved to a private or metadata address");
    }
  }
  return parsed;
}

function resolveRedirect(current: URL, location: string): string {
  return new URL(location, current).toString();
}

export async function fetchUrlText(url: string): Promise<{ ok: boolean; text: string | null }> {
  try {
    let current = url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertSafeFetchUrl(current);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(current, {
          signal: controller.signal,
          redirect: "manual",
          headers: { "User-Agent": "quizzeira-link-fetch/1.0" },
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return { ok: false, text: null };
        if (hop === MAX_REDIRECTS) return { ok: false, text: null };
        current = resolveRedirect(new URL(current), location);
        continue;
      }

      if (!response.ok) return { ok: false, text: null };
      const contentType = response.headers.get("content-type") ?? "";
      const raw = await response.text();
      const text = contentType.includes("html") ? stripHtml(raw) : raw.trim();
      if (!text) return { ok: false, text: null };
      return { ok: true, text: text.slice(0, MAX_CHARS) };
    }
    return { ok: false, text: null };
  } catch {
    return { ok: false, text: null };
  }
}

export function excerptText(value: string | null | undefined, max = 6000): string | null {
  if (!value?.trim()) return null;
  return value.trim().slice(0, max);
}

/** Strong signals for real study content (Anexo / blueprint body). */
const PRIMARY_SYLLABUS_MARKERS = [
  /l[ií]ngua\s+portuguesa\s*:/i,
  /conte[uú]dos?\s+program[aá]ticos?/i,
  /programa\s+das?\s+provas?/i,
  /job\s+description|responsibilities|requirements|must[- ]have/i,
  /requisitos?\s+(obrigat[oó]rios?|desej[aá]veis?)/i,
];

/**
 * Weak / TOC mentions — appear early in editais long before the real anexo.
 * Only used when no primary marker exists.
 */
const SECONDARY_SYLLABUS_MARKERS = [
  /conhecimentos?\s+(b[aá]sicos?|gerais|espec[ií]ficos?)/i,
];

const VACANCY_TABLE_MARKERS = [
  /quadro\s+de\s+vagas/i,
  /quadro\s+de\s+[eê]nfases/i,
  /cadastro\s+de\s+reserva/i,
  /\bAC\b.*\bPCD\b|\bPcD\b.*\bAC\b/i,
];

export const ATTACHMENT_STORE_MAX_CHARS = 80_000;
export const GENERATION_EXCERPT_MAX_CHARS = 18_000;
export const VACANCY_EXCERPT_MAX_CHARS = 1_200;

function firstMatchIndex(text: string, patterns: RegExp[]): number {
  let best = -1;
  for (const re of patterns) {
    const m = re.exec(text);
    if (m && (best < 0 || m.index < best)) best = m.index;
  }
  return best;
}

/**
 * Prefer the syllabus *body* over early TOC cross-references.
 * e.g. "conteúdos programáticos" may appear in §8 before Anexo IV;
 * "LÍNGUA PORTUGUESA:" marks the actual program.
 */
function findSyllabusAnchor(text: string): number {
  const lingua = /l[ií]ngua\s+portuguesa\s*:/i.exec(text);
  if (lingua) return lingua.index;

  const primaryHits: number[] = [];
  for (const re of PRIMARY_SYLLABUS_MARKERS) {
    const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(global)) primaryHits.push(m.index);
  }
  if (primaryHits.length > 0) {
    // Last primary hit is usually the anexo body, not the forward reference.
    return Math.max(...primaryHits);
  }
  return firstMatchIndex(text, SECONDARY_SYLLABUS_MARKERS);
}

export function looksLikeVacancyTable(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const sample = text.slice(0, 4_000);
  let hits = 0;
  for (const re of VACANCY_TABLE_MARKERS) {
    if (re.test(sample)) hits += 1;
  }
  return hits >= 2 || /QUADRO\s+1\s*[-–]?\s*VAGAS/i.test(sample);
}

/**
 * Build study-context excerpt: prefer syllabus / JD skill sections over document head.
 * Admin edital pages alone produce meta-questions; contents live deep in anexos.
 */
export function excerptStudyContext(
  value: string | null | undefined,
  max = GENERATION_EXCERPT_MAX_CHARS,
): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (text.length <= max) return text;

  const markerAt = findSyllabusAnchor(text);

  if (markerAt < 0) {
    const headBudget = Math.min(2_500, Math.floor(max * 0.15));
    const mid = Math.max(0, Math.floor(text.length / 2) - Math.floor(max / 4));
    const head = text.slice(0, headBudget);
    const body = text.slice(mid, mid + (max - headBudget - 80));
    return `${head}\n\n[…]\n\n${body}`;
  }

  // Keep admin head tiny once real syllabus body is found — logistics drown subject matter.
  const headBudget = Math.min(800, Math.floor(max * 0.05));
  const head = text.slice(0, headBudget);
  const syllabusBudget = max - head.length - 80;
  const syllabusStart = Math.max(0, markerAt - Math.min(200, Math.floor(syllabusBudget * 0.02)));
  const syllabus = text.slice(syllabusStart, syllabusStart + syllabusBudget);
  if (markerAt <= headBudget) {
    return text.slice(0, max);
  }
  return `${head}\n\n[… syllabus / skills section …]\n\n${syllabus}`;
}

/**
 * Persist attachment text for later generation: keep syllabus body, not only PDF head.
 */
export function excerptForAttachmentStore(
  value: string | null | undefined,
  max = ATTACHMENT_STORE_MAX_CHARS,
): string | null {
  return excerptStudyContext(value, max);
}

/**
 * Shrink vacancy / ênfase tables so they cannot drown syllabus context.
 */
export function excerptMaterialForGeneration(
  value: string | null | undefined,
  opts: { filename?: string | null; max?: number } = {},
): string | null {
  const text = value?.trim();
  if (!text) return null;
  const name = opts.filename ?? "";
  const vacancyNamed = /vagas|quadro/i.test(name);
  if (vacancyNamed || looksLikeVacancyTable(text)) {
    const cap = Math.min(opts.max ?? VACANCY_EXCERPT_MAX_CHARS, VACANCY_EXCERPT_MAX_CHARS);
    const head = text.slice(0, cap);
    return `${head}\n\n[… vacancy / ênfase table truncated — use only to know target cargo/ênfase; never quiz vacancy counts, polos, or modalities …]`;
  }
  return excerptStudyContext(text, opts.max ?? GENERATION_EXCERPT_MAX_CHARS);
}
