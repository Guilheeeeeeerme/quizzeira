// Concept: Extraction (1ª fase caderno → 80 verbatim multiple-choice questions)
//
// OAB booklets do not use the "1)" / "Questão 1" headers the generic parser
// (../mcq.ts) looks for: a question starts with a bare number alone on its
// line. Option markers also drift between editions — "(A)" from the 43º on,
// "A)" up to the XXXIV. Both shapes are handled here so the whole 2010–2026
// archive parses with one code path.
import {
  OAB_OBJECTIVE_OPTION_COUNT,
  OAB_OBJECTIVE_QUESTION_COUNT,
  OAB_PERCEPTION_HEADING,
} from "@quizzeira/shared";
import { extractLayoutText } from "./pdf-layout.js";

export interface CadernoQuestion {
  /** Number as printed in this booklet type — not necessarily the Tipo 1 number. */
  number: number;
  prompt: string;
  options: string[];
}

export interface CadernoParseResult {
  questions: CadernoQuestion[];
  /** Booklet type read off the cover, or null when the cover is unreadable. */
  bookletType: number | null;
  /** Numbers in 1–80 that failed to parse; empty on a clean booklet. */
  missing: number[];
}

const QUESTION_HEADER_RE = /^\s*(\d{1,3})\s*$/;
const OPTION_RE = /^\s*\(?([A-D])\)\s*(.*)$/;
const OPTION_LETTERS = ["A", "B", "C", "D"];

/**
 * Page furniture that lands on its own line. Dropping it matters: a bare folio
 * ("15") is indistinguishable from a question header once the line is isolated.
 */
const FURNITURE_RE = [
  /^tipo\s+\w+\s*[–-]\s*p[áa]gina\s+\d+/i,
  /^\d{1,3}\s*[ºo°]?\s*exame\s+d[oe]\s+ordem/i,
  /^exame\s+de\s+ordem\s+unificado/i,
  /^ordem\s+dos\s+advogados\s+do\s+brasil/i,
  /^p[áa]gina\s+\d+\s+de\s+\d+/i,
  /^qualquer\s+semelhan[çc]a\s+nominal/i,
  /^tipo\s+\d+\s*[–-]/i,
];

function isFurniture(line: string): boolean {
  return FURNITURE_RE.some((re) => re.test(line));
}

/** Reads "TIPO 1 – BRANCA" / "Tipo 3" off the cover page. */
export function parseBookletType(text: string): number | null {
  const match = /\btipo\s*(\d)\b/i.exec(text.slice(0, 4000));
  if (!match) return null;
  const value = Number(match[1]);
  return value >= 1 && value <= 4 ? value : null;
}

/**
 * Cuts the trailing "Questionário de percepção sobre a prova". Those 10 items
 * are renumbered from 1 and are structurally identical to real questions, so
 * they would otherwise overwrite questions 1–10.
 */
export function stripPerceptionQuestionnaire(text: string): string {
  const match = OAB_PERCEPTION_HEADING.exec(text);
  if (!match || match.index == null) return text;
  // The heading also appears in the cover instructions ("…e o questionário de
  // percepção sobre a prova com 10 itens"). Only a late occurrence is the real
  // section, so require it past the halfway mark.
  if (match.index < text.length / 2) {
    const later = OAB_PERCEPTION_HEADING.exec(text.slice(text.length / 2));
    if (!later || later.index == null) return text;
    return text.slice(0, text.length / 2 + later.index);
  }
  return text.slice(0, match.index);
}

/**
 * Splits booklet text into question blocks.
 *
 * Headers must form a strictly ascending run starting at 1, which is what
 * separates a real header from a folio or a stray numeral: a page number
 * repeats or jumps backwards, a question number never does.
 */
function splitIntoBlocks(lines: string[]): Map<number, string[]> {
  const blocks = new Map<number, string[]>();
  let current: string[] | null = null;
  let expected = 1;

  for (const line of lines) {
    if (isFurniture(line)) continue;
    const header = QUESTION_HEADER_RE.exec(line);
    if (header && Number(header[1]) === expected && expected <= OAB_OBJECTIVE_QUESTION_COUNT) {
      current = [];
      blocks.set(expected, current);
      expected += 1;
      continue;
    }
    if (current && line.trim() !== "") current.push(line);
  }

  return blocks;
}

/** Splits one block into its stem and four options. */
function parseBlock(lines: string[]): { prompt: string; options: string[] } | null {
  const promptLines: string[] = [];
  const options: string[][] = [];
  let expectedLetter = 0;

  for (const line of lines) {
    const option = OPTION_RE.exec(line);
    if (option && option[1] === OPTION_LETTERS[expectedLetter]) {
      options.push([option[2]]);
      expectedLetter += 1;
      continue;
    }
    if (options.length === 0) promptLines.push(line);
    else options[options.length - 1].push(line);
  }

  if (options.length !== OAB_OBJECTIVE_OPTION_COUNT) return null;

  const prompt = promptLines.join(" ").replace(/\s+/g, " ").trim();
  if (prompt.length < 20) return null;

  const texts = options.map((parts) => parts.join(" ").replace(/\s+/g, " ").trim());
  if (texts.some((text) => text === "")) return null;
  // Four identical options means the columns were misread, not a real question.
  if (new Set(texts.map((t) => t.toLowerCase())).size !== texts.length) return null;

  return { prompt, options: texts };
}

/** Parses booklet text that has already been read in reading order. */
export function parseCadernoText(text: string): CadernoParseResult {
  const bookletType = parseBookletType(text);
  const body = stripPerceptionQuestionnaire(text.replace(/\r\n/g, "\n"));
  const lines = body.split(/\n|\f/);

  const questions: CadernoQuestion[] = [];
  const missing: number[] = [];

  for (const [number, block] of splitIntoBlocks(lines)) {
    const parsed = parseBlock(block);
    if (parsed) questions.push({ number, ...parsed });
    else missing.push(number);
  }

  questions.sort((a, b) => a.number - b.number);
  missing.sort((a, b) => a - b);
  return { questions, bookletType, missing };
}

/** Parses a caderno PDF straight from its bytes. */
export function parseCadernoPdf(buffer: Buffer): CadernoParseResult {
  return parseCadernoText(extractLayoutText(buffer));
}
