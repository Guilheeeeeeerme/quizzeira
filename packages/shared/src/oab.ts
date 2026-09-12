// Concept: OAB domain model (Exame de Ordem Unificado).
//
// The OAB is the one exam on the platform whose shape is known in advance: same
// banca since 2010, same 80-question objective paper, same seven 2ª-fase areas,
// and every booklet and answer key published as an official PDF. This file is
// the single place that knowledge lives, so Ingestion, Extraction and Sampling
// all agree on edition identity, subject names and pass marks.
//
// See docs/oab-exam.md for the research this encodes.
import { slugifyKey } from "./slug";

/** Every OAB artifact and exam slug is namespaced under this prefix. */
export const OAB_SLUG_PREFIX = "oab";

export const OAB_DOMAIN = "oab.fgv.br";

/** 1ª fase: 80 questions, four options, 40 correct to pass. */
export const OAB_OBJECTIVE_QUESTION_COUNT = 80;
export const OAB_OBJECTIVE_OPTION_COUNT = 4;
export const OAB_OBJECTIVE_PASS_MARK = 40;
/** Booklets are printed in four shuffled types; Tipo 1 is our canonical order. */
export const OAB_BOOKLET_TYPES = [1, 2, 3, 4] as const;
export const OAB_CANONICAL_BOOKLET_TYPE = 1;

/** 2ª fase: peça (5,00) + four discursivas (1,25 each), 6,00 to pass. */
export const OAB_PRACTICAL_TOTAL = 10;
export const OAB_PRACTICAL_PASS_MARK = 6;
export const OAB_PRACTICAL_PIECE_VALUE = 5;
export const OAB_PRACTICAL_QUESTION_COUNT = 4;

/**
 * Trailing questionnaire every booklet carries. It is renumbered 1–10 and looks
 * exactly like a real question, so extraction has to cut the booklet here.
 */
export const OAB_PERCEPTION_HEADING = /question[áa]rio\s+de\s+percep[çc][ãa]o/i;
export const OAB_PERCEPTION_ITEM_COUNT = 10;

export type OabPhase = "objective" | "practical";

// ---------------------------------------------------------------------------
// Editions
// ---------------------------------------------------------------------------

export interface OabEdition {
  /** Sequential edition number; 1 and 2 are the 2010.2 / 2010.3 exams. */
  number: number;
  /** Label exactly as FGV prints it ("XXXIV", "46º", "2010.2"). */
  label: string;
  /** FGV portal key: https://oab.fgv.br/home.aspx?key=<fgvKey> */
  fgvKey: number;
}

/**
 * Edition → FGV portal key. Captured verbatim rather than computed: the keys are
 * not a clean series (618, 619, 622 and 623 are absent) and older editions sit
 * hundreds apart. Verified against https://oab.fgv.br/ in September 2026.
 */
export const OAB_EDITIONS: readonly OabEdition[] = [
  { number: 1, label: "2010.2", fgvKey: 112 },
  { number: 2, label: "2010.3", fgvKey: 134 },
  { number: 4, label: "IV", fgvKey: 157 },
  { number: 5, label: "V", fgvKey: 163 },
  { number: 6, label: "VI", fgvKey: 165 },
  { number: 7, label: "VII", fgvKey: 168 },
  { number: 8, label: "VIII", fgvKey: 240 },
  { number: 9, label: "IX", fgvKey: 270 },
  { number: 10, label: "X", fgvKey: 303 },
  { number: 11, label: "XI", fgvKey: 336 },
  { number: 12, label: "XII", fgvKey: 382 },
  { number: 13, label: "XIII", fgvKey: 421 },
  { number: 14, label: "XIV", fgvKey: 461 },
  { number: 15, label: "XV", fgvKey: 513 },
  { number: 16, label: "XVI", fgvKey: 615 },
  { number: 17, label: "XVII", fgvKey: 616 },
  { number: 18, label: "XVIII", fgvKey: 617 },
  { number: 19, label: "XIX", fgvKey: 620 },
  { number: 20, label: "XX", fgvKey: 621 },
  { number: 21, label: "XXI", fgvKey: 624 },
  { number: 22, label: "XXII", fgvKey: 625 },
  { number: 23, label: "XXIII", fgvKey: 626 },
  { number: 24, label: "XXIV", fgvKey: 627 },
  { number: 25, label: "XXV", fgvKey: 628 },
  { number: 26, label: "XXVI", fgvKey: 629 },
  { number: 27, label: "XXVII", fgvKey: 630 },
  { number: 28, label: "XXVIII", fgvKey: 631 },
  { number: 29, label: "XXIX", fgvKey: 632 },
  { number: 30, label: "XXX", fgvKey: 633 },
  { number: 31, label: "XXXI", fgvKey: 634 },
  { number: 32, label: "XXXII", fgvKey: 635 },
  { number: 33, label: "XXXIII", fgvKey: 636 },
  { number: 34, label: "XXXIV", fgvKey: 637 },
  { number: 35, label: "35º", fgvKey: 638 },
  { number: 36, label: "36º", fgvKey: 639 },
  { number: 37, label: "37º", fgvKey: 640 },
  { number: 38, label: "38º", fgvKey: 641 },
  { number: 39, label: "39º", fgvKey: 642 },
  { number: 40, label: "40º", fgvKey: 643 },
  { number: 41, label: "41º", fgvKey: 644 },
  { number: 42, label: "42º", fgvKey: 645 },
  { number: 43, label: "43º", fgvKey: 646 },
  { number: 44, label: "44º", fgvKey: 647 },
  { number: 45, label: "45º", fgvKey: 648 },
  { number: 46, label: "46º", fgvKey: 649 },
  { number: 47, label: "47º", fgvKey: 650 },
];

export function oabEditionPageUrl(fgvKey: number): string {
  return `https://oab.fgv.br/home.aspx?key=${fgvKey}`;
}

export function oabEditionByFgvKey(fgvKey: number): OabEdition | null {
  return OAB_EDITIONS.find((e) => e.fgvKey === fgvKey) ?? null;
}

export function oabEditionByNumber(number: number): OabEdition | null {
  return OAB_EDITIONS.find((e) => e.number === number) ?? null;
}

const ROMAN_VALUES: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 };

function romanToNumber(value: string): number | null {
  const chars = value.toLowerCase().split("");
  if (chars.some((c) => !(c in ROMAN_VALUES))) return null;
  let total = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const current = ROMAN_VALUES[chars[i]];
    const next = i + 1 < chars.length ? ROMAN_VALUES[chars[i + 1]] : 0;
    total += current < next ? -current : current;
  }
  return total > 0 ? total : null;
}

/**
 * Reads an edition out of free text — an anchor label, a page title or a PDF
 * file name. Handles every form FGV uses: "46º EXAME DE ORDEM UNIFICADO",
 * "XXXIV Exame Civil - SEGUNDA FASE", "EXAME DE ORDEM UNIFICADO 2010.2".
 */
export function parseOabEdition(text: string): OabEdition | null {
  const normalized = text.replace(/\s+/g, " ").trim();

  const legacy = /\b(2010)\s*[.\-]\s*([23])\b/.exec(normalized);
  if (legacy) return oabEditionByNumber(legacy[2] === "2" ? 1 : 2);

  const arabic = /\b(\d{1,2})\s*[ºo°]?\s*(?:eou\b|exame\b)/i.exec(normalized);
  if (arabic) {
    const found = oabEditionByNumber(Number(arabic[1]));
    if (found) return found;
  }

  const roman = /\b([IVXLC]{1,8})\s+(?:eou\b|exame\b)/i.exec(normalized);
  if (roman) {
    const number = romanToNumber(roman[1]);
    if (number != null) {
      const found = oabEditionByNumber(number);
      // A bare "V"/"X" also matches ordinary words, so only trust it when the
      // resulting edition actually exists and the label agrees.
      if (found && found.label.toLowerCase() === roman[1].toLowerCase()) return found;
    }
  }

  return null;
}

/**
 * Canonical exam slug. One exam row per edition and phase, so the objective and
 * practical papers never share a question pool.
 */
export function oabExamSlug(edition: OabEdition, phase: OabPhase): string {
  const suffix = phase === "objective" ? "1-fase" : "2-fase";
  return `${OAB_SLUG_PREFIX}-${slugifyKey(edition.label)}-${suffix}`;
}

export function oabExamTitle(edition: OabEdition, phase: OabPhase): string {
  const suffix =
    phase === "objective" ? "1ª fase (prova objetiva)" : "2ª fase (prático-profissional)";
  return `${edition.label} Exame de Ordem Unificado — ${suffix}`;
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export interface OabSubject {
  name: string;
  slug: string;
  /** Inclusive Tipo 1 question range under the observed blueprint. */
  from: number;
  to: number;
}

/**
 * Observed 1ª fase blueprint, stable across editions 43º–46º.
 *
 * FGV does not publish this and is not bound by it — the only published rule is
 * Provimento 144/2011 art. 11 §4º (≥15% on Ética/Estatuto, Direitos Humanos and
 * Filosofia do Direito). Callers must treat a subject derived from it as
 * inferred, which is what `oabSubjectForQuestion` returns.
 */
export const OAB_OBJECTIVE_BLUEPRINT: readonly OabSubject[] = [
  { name: "Ética Profissional e Estatuto da OAB", slug: "etica-profissional", from: 1, to: 8 },
  { name: "Filosofia do Direito", slug: "filosofia-do-direito", from: 9, to: 10 },
  { name: "Direito Constitucional", slug: "direito-constitucional", from: 11, to: 16 },
  { name: "Direitos Humanos", slug: "direitos-humanos", from: 17, to: 18 },
  { name: "Direito Eleitoral", slug: "direito-eleitoral", from: 19, to: 20 },
  { name: "Direito Internacional", slug: "direito-internacional", from: 21, to: 22 },
  { name: "Direito Financeiro", slug: "direito-financeiro", from: 23, to: 24 },
  { name: "Direito Tributário", slug: "direito-tributario", from: 25, to: 29 },
  { name: "Direito Administrativo", slug: "direito-administrativo", from: 30, to: 34 },
  { name: "Direito Ambiental", slug: "direito-ambiental", from: 35, to: 36 },
  { name: "Direito Civil", slug: "direito-civil", from: 37, to: 42 },
  { name: "Estatuto da Criança e do Adolescente", slug: "eca", from: 43, to: 44 },
  { name: "Direito do Consumidor", slug: "direito-do-consumidor", from: 45, to: 46 },
  { name: "Direito Empresarial", slug: "direito-empresarial", from: 47, to: 50 },
  { name: "Direito Processual Civil", slug: "direito-processual-civil", from: 51, to: 56 },
  { name: "Direito Penal", slug: "direito-penal", from: 57, to: 62 },
  { name: "Direito Processual Penal", slug: "direito-processual-penal", from: 63, to: 68 },
  { name: "Direito do Trabalho", slug: "direito-do-trabalho", from: 69, to: 73 },
  { name: "Direito Processual do Trabalho", slug: "direito-processual-do-trabalho", from: 74, to: 78 },
  { name: "Direito Previdenciário", slug: "direito-previdenciario", from: 79, to: 80 },
];

/** Static syllabus leaves for OAB 1ª fase (§47) — mirrors the objective blueprint. */
export const OAB_STATIC_SYLLABUS: readonly {
  subject: string;
  slug: string;
  pathSlug: string;
  from: number;
  to: number;
}[] = OAB_OBJECTIVE_BLUEPRINT.map((s) => ({
  subject: s.name,
  slug: s.slug,
  pathSlug: s.slug,
  from: s.from,
  to: s.to,
}));

export interface OabSubjectGuess {
  name: string;
  slug: string;
  /** False whenever the label came from the unpublished blueprint. */
  official: boolean;
}

const UNKNOWN_SUBJECT: OabSubjectGuess = {
  name: "Geral",
  slug: "geral",
  official: false,
};

/**
 * Maps a **Tipo 1** question number to its likely disciplina. Numbers outside
 * 1–80, or from a non-canonical booklet type, fall back to "Geral" rather than
 * guessing — a shuffled number carries no subject signal.
 */
export function oabSubjectForQuestion(tipo1Number: number): OabSubjectGuess {
  if (!Number.isInteger(tipo1Number)) return UNKNOWN_SUBJECT;
  const subject = OAB_OBJECTIVE_BLUEPRINT.find(
    (s) => tipo1Number >= s.from && tipo1Number <= s.to,
  );
  if (!subject) return UNKNOWN_SUBJECT;
  return { name: subject.name, slug: subject.slug, official: false };
}

// ---------------------------------------------------------------------------
// 2ª fase areas
// ---------------------------------------------------------------------------

export interface OabPracticalArea {
  /** FGV's internal booklet code, present in every 2ª fase file name. */
  code: string;
  name: string;
  slug: string;
}

export const OAB_PRACTICAL_AREAS: readonly OabPracticalArea[] = [
  { code: "B001", name: "Direito Administrativo", slug: "direito-administrativo" },
  { code: "B002", name: "Direito Civil", slug: "direito-civil" },
  { code: "B003", name: "Direito Constitucional", slug: "direito-constitucional" },
  { code: "B004", name: "Direito Empresarial", slug: "direito-empresarial" },
  { code: "B005", name: "Direito Penal", slug: "direito-penal" },
  { code: "B006", name: "Direito Tributário", slug: "direito-tributario" },
  { code: "B007", name: "Direito do Trabalho", slug: "direito-do-trabalho" },
];

/**
 * Finds the 2ª fase area named in a label or file name. Matches FGV's booklet
 * code first (`OAB46 - B002 (DIREITO CIVIL)`) because it survives the accent
 * mangling in their URL-encoded file names, then falls back to the area name.
 */
export function parseOabPracticalArea(text: string): OabPracticalArea | null {
  const normalized = text.replace(/\s+/g, " ").trim();

  const byCode = /\bB00([1-7])\b/i.exec(normalized);
  if (byCode) {
    const found = OAB_PRACTICAL_AREAS.find((a) => a.code === `B00${byCode[1]}`);
    if (found) return found;
  }

  // Slugified without the default length cap: callers pass whole cover pages,
  // not just anchor labels, and the área can sit well past 64 characters in.
  const slug = slugifyKey(normalized, normalized.length);
  // Longest slug first so "direito-processual-civil" never matches "direito-civil".
  const candidates = [...OAB_PRACTICAL_AREAS].sort((a, b) => b.slug.length - a.slug.length);
  return candidates.find((a) => slug.includes(a.slug)) ?? null;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function oabObjectivePassed(correctCount: number): boolean {
  return correctCount >= OAB_OBJECTIVE_PASS_MARK;
}

/** No rounding is permitted: 5,99 fails. */
export function oabPracticalPassed(score: number): boolean {
  return score >= OAB_PRACTICAL_PASS_MARK;
}

// ---------------------------------------------------------------------------
// Document taxonomy
// ---------------------------------------------------------------------------

/** Artifact kinds Content understands; the OAB portal only produces these. */
export type OabArtifactKind = "edital" | "prova" | "gabarito";

export interface OabDocumentClass {
  kind: OabArtifactKind;
  /** Which paper the document belongs to; null for an edital, which covers both. */
  phase: OabPhase | null;
  /** 1ª fase caderno only. */
  bookletType: number | null;
  /** 2ª fase caderno / padrão de respostas only. */
  area: OabPracticalArea | null;
  /** Post-appeal variant. Supersedes the preliminary document of the same slot. */
  definitive: boolean;
}

/**
 * Administrative rows. They sit in the same list as the exam documents and some
 * of them start with "Edital", so they are matched before anything else.
 */
const OAB_IGNORED_LABEL_RE =
  /resultado|comunicado|locais?\s+de\s+(?:prova|aplica)|remarca|isen[çc][ãa]o|\bpne\b|atendimento\s+especial|relat[óo]rio|recursos?\b|inscri[çc]/i;

const OAB_EDITAL_RE = /\bedital\b/i;
const OAB_CADERNO_RE = /caderno\s+de\s+provas?/i;
const OAB_GABARITO_RE = /gabaritos?/i;
const OAB_PADRAO_RE = /padr[ãa]o\s+de\s+respostas?/i;
const OAB_BOOKLET_TYPE_RE = /tipo\s*(\d)\b/i;
const OAB_DEFINITIVE_RE = /definitiv/i;

/**
 * Reads a document off an anchor label (and, as a fallback, its href) on an FGV
 * edition page. Returns null for the administrative rows, which is how the
 * crawler decides what not to download.
 *
 * The labels have been stable in wording since at least the XXXIV exam, so this
 * matches on them rather than on the file names, which carry FGV's internal
 * codes and inconsistent accent encoding.
 */
export function classifyOabDocument(label: string, href = ""): OabDocumentClass | null {
  const text = `${label} ${decodeUriSafe(href)}`.replace(/\s+/g, " ").trim();
  if (text === "") return null;
  if (OAB_IGNORED_LABEL_RE.test(label)) return null;

  const definitive = OAB_DEFINITIVE_RE.test(text);

  if (OAB_PADRAO_RE.test(text)) {
    return {
      kind: "gabarito",
      phase: "practical",
      bookletType: null,
      area: parseOabPracticalArea(text),
      definitive,
    };
  }

  if (OAB_GABARITO_RE.test(text)) {
    return {
      kind: "gabarito",
      phase: "objective",
      bookletType: null,
      area: null,
      definitive,
    };
  }

  if (OAB_CADERNO_RE.test(text)) {
    const type = OAB_BOOKLET_TYPE_RE.exec(text);
    // A booklet type means the 1ª fase; an área means the 2ª fase. A caderno
    // that declares neither is unusable — we would not know which paper it is.
    if (type) {
      return {
        kind: "prova",
        phase: "objective",
        bookletType: Number(type[1]),
        area: null,
        definitive: false,
      };
    }
    const area = parseOabPracticalArea(text);
    if (area) {
      return { kind: "prova", phase: "practical", bookletType: null, area, definitive: false };
    }
    return null;
  }

  if (OAB_EDITAL_RE.test(text)) {
    return { kind: "edital", phase: null, bookletType: null, area: null, definitive: false };
  }

  return null;
}

function decodeUriSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export interface OabClassifiedDocument extends OabDocumentClass {
  label: string;
  url: string;
}

/**
 * Slot key for supersedence: everything that can exist in both a preliminary and
 * a definitive variant. Cadernos have no variants, so they key on themselves.
 */
function documentSlot(doc: OabClassifiedDocument): string {
  return [doc.kind, doc.phase ?? "-", doc.bookletType ?? "-", doc.area?.code ?? "-"].join("/");
}

/**
 * Drops preliminary gabaritos and padrões whenever the definitive one is on the
 * same page. Ingesting both would publish questions the Banca Recursal has since
 * annulled, and mark the wrong option correct on the ones it re-keyed.
 */
export function preferDefinitiveOabDocuments(
  docs: readonly OabClassifiedDocument[],
): OabClassifiedDocument[] {
  const bySlot = new Map<string, OabClassifiedDocument>();
  for (const doc of docs) {
    const slot = documentSlot(doc);
    const current = bySlot.get(slot);
    if (!current || (doc.definitive && !current.definitive)) bySlot.set(slot, doc);
  }
  return [...bySlot.values()];
}

/**
 * Exam slug an OAB document belongs to. An edital covers both papers, so it is
 * filed under the 1ª fase — that is the exam every candidate sits.
 */
export function oabDocumentExamSlug(
  edition: OabEdition,
  doc: OabDocumentClass,
): string {
  return oabExamSlug(edition, doc.phase ?? "objective");
}
