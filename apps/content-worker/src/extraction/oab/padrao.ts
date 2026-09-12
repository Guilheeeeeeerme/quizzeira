// Concept: Extraction (2ª fase padrão de respostas → five open-ended items)
//
// The padrão is the richest document FGV publishes: it reprints the enunciado
// and then gives the banca's own model answer, so a single PDF yields the whole
// prático-profissional paper — one peça plus four questões — with a reference
// answer already attached. Nothing here needs an LLM; the reference answer is
// the banca's text, not a paraphrase of it.
//
// Layout is single-column, so the plain layout reader suffices.
import {
  OAB_PRACTICAL_PIECE_VALUE,
  OAB_PRACTICAL_QUESTION_COUNT,
  parseOabPracticalArea,
  type OabPracticalArea,
} from "@quizzeira/shared";
import { extractLayoutText } from "./pdf-layout.js";

export interface PadraoItem {
  kind: "peca" | "questao";
  /** 1–4 for the questões discursivas; null for the peça. */
  number: number | null;
  /** The statement the candidate answers. Empty when the padrão omits it. */
  enunciado: string;
  /** The banca's model answer ("Gabarito Comentado"). */
  answer: string;
  /** Points the item is worth, as printed in "(Valor: 5,00)". */
  value: number | null;
}

export interface PadraoParseResult {
  items: PadraoItem[];
  area: OabPracticalArea | null;
  /** True when the heading says the padrão is post-appeal. */
  definitive: boolean;
}

const SECTION_RE =
  /^\s*padr[ãa]o\s+de\s+respostas?\s*[–—\-:]?\s*(pe[çc]a|quest[ãa]o)\s*(?:pr[áa]tico[\s-]*profissional|profissional)?\s*(\d{1,2})?/i;
const ENUNCIADO_RE = /^\s*enunciado\b/i;
const ANSWER_RE = /^\s*gabarito\s+comentado\b|^\s*padr[ãa]o\s+de\s+resposta\s*$/i;
const VALUE_RE = /\(\s*valor\s*:?\s*([\d]+[.,]\d{2})\s*\)/i;
const DEFINITIVE_RE = /padr[ãa]o\s+de\s+respostas?\s+definitiv/i;

const FURNITURE_RE = [
  /^\s*p[áa]gina\s+\d+(\s+de\s+\d+)?\s*$/i,
  /^\s*\d{1,3}\s*$/,
  /^\s*exame\s+de\s+ordem\s+unificado/i,
  /^\s*\d{1,3}\s*[ºo°]?\s*exame\s+d[oe]\s+ordem/i,
  /^\s*ordem\s+dos\s+advogados\s+do\s+brasil/i,
];

function isFurniture(line: string): boolean {
  return FURNITURE_RE.some((re) => re.test(line));
}

function join(lines: string[]): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

function parseValue(text: string): number | null {
  const match = VALUE_RE.exec(text);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

interface Section {
  kind: "peca" | "questao";
  number: number | null;
  lines: string[];
}

/**
 * Cuts the document at its section headings. Everything before the first one is
 * cover matter (instructions, banca credits) and is dropped.
 */
function splitSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const heading = SECTION_RE.exec(line);
    if (heading) {
      const kind = /pe[çc]a/i.test(heading[1]) ? "peca" : "questao";
      current = {
        kind,
        number: kind === "questao" && heading[2] ? Number(heading[2]) : null,
        lines: [],
      };
      sections.push(current);
      // The heading line often carries the "(Valor: 5,00)" too, so keep it.
      current.lines.push(line);
      continue;
    }
    if (current && !isFurniture(line) && line.trim() !== "") current.lines.push(line);
  }

  return sections;
}

/**
 * Splits a section into enunciado and model answer. Both markers are optional:
 * some editions print the enunciado only in the caderno, and a few run the
 * answer straight after the heading with no "Gabarito Comentado" label. The
 * answer is whatever follows the last marker, so an unlabelled section still
 * yields its text rather than nothing.
 */
function splitSectionBody(lines: string[]): { enunciado: string; answer: string } {
  const enunciado: string[] = [];
  const answer: string[] = [];
  let target: string[] | null = null;

  for (const line of lines.slice(1)) {
    if (ENUNCIADO_RE.test(line)) {
      target = enunciado;
      continue;
    }
    if (ANSWER_RE.test(line)) {
      target = answer;
      continue;
    }
    (target ?? answer).push(line);
  }

  return { enunciado: join(enunciado), answer: join(answer) };
}

export function parsePadraoText(text: string): PadraoParseResult {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split(/\n|\f/);
  const items: PadraoItem[] = [];
  let nextQuestionNumber = 1;

  for (const section of splitSections(lines)) {
    const { enunciado, answer } = splitSectionBody(section.lines);
    if (answer.length < 40) continue;
    const number =
      section.kind === "peca" ? null : (section.number ?? nextQuestionNumber);
    if (section.kind === "questao") nextQuestionNumber = (number ?? 0) + 1;
    items.push({
      kind: section.kind,
      number,
      enunciado,
      answer,
      value: parseValue(join(section.lines)) ?? defaultValue(section.kind),
    });
  }

  return {
    items,
    area: parseOabPracticalArea(normalized.slice(0, 4000)),
    definitive: DEFINITIVE_RE.test(normalized.slice(0, 4000)),
  };
}

/** Falls back to the values fixed by Provimento 144/2011 when none is printed. */
function defaultValue(kind: "peca" | "questao"): number {
  if (kind === "peca") return OAB_PRACTICAL_PIECE_VALUE;
  return (10 - OAB_PRACTICAL_PIECE_VALUE) / OAB_PRACTICAL_QUESTION_COUNT;
}

export function parsePadraoPdf(buffer: Buffer): PadraoParseResult {
  return parsePadraoText(extractLayoutText(buffer));
}
