// Concept: Extraction (1ª fase gabarito → answer key + booklet correspondence)
//
// FGV prints one answer key per booklet type plus a "tabela de correspondência"
// mapping every Tipo 1 question to its number in Tipos 2/3/4. That table is
// what keeps the bank honest: the four booklets hold the same 80 questions in
// four orders, so without it the same question is ingested four times under
// four different subjects.
//
// Both artefacts are laid out as a row of numbers over a row of letters, which
// parses deterministically — no LLM is involved anywhere in this file.
import { OAB_BOOKLET_TYPES, OAB_OBJECTIVE_QUESTION_COUNT } from "@quizzeira/shared";
import { extractLayoutText } from "./pdf-layout.js";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export interface GabaritoParseResult {
  /** booklet type → (question number in that booklet → option index 0–3). */
  answersByType: Map<number, Map<number, number>>;
  /**
   * Tipo 1 number → number in each booklet type, keyed by type. Empty when the
   * PDF omits the correspondence table (some older editions do).
   */
  correspondence: Map<number, Map<number, number>>;
  /** True when the heading says the key is post-appeal. */
  definitive: boolean;
}

const TYPE_HEADING_RE = /prova\s+tipo\s*(\d)\b/i;
const CORRESPONDENCE_HEADING_RE = /tabela\s+de\s+correspond[êe]ncia/i;
const DEFINITIVE_RE = /gabaritos?\s+definitivos?/i;

/** A line that is nothing but numbers, e.g. the "1 2 3 … 20" header row. */
function numbersOnly(line: string): number[] | null {
  const trimmed = line.trim();
  if (trimmed === "" || !/^[\d\s]+$/.test(trimmed)) return null;
  const values = trimmed.split(/\s+/).map(Number);
  return values.every(Number.isInteger) ? values : null;
}

/** A line that is nothing but A–D letters, e.g. the "C D C A …" answer row. */
function lettersOnly(line: string): number[] | null {
  const trimmed = line.trim();
  if (trimmed === "" || !/^[A-D\s]+$/i.test(trimmed)) return null;
  const values = trimmed.split(/\s+/).map((letter) => OPTION_LETTERS.indexOf(letter.toUpperCase()));
  return values.every((index) => index >= 0) ? values : null;
}

/**
 * Reads the four answer grids.
 *
 * Bands are matched pairwise — a numbers row immediately followed by a letters
 * row of the same width — rather than by counting columns, because the bands
 * are 20 wide in recent editions and have been narrower before.
 */
function parseAnswerGrids(lines: string[]): Map<number, Map<number, number>> {
  const byType = new Map<number, Map<number, number>>();
  let currentType: number | null = null;
  let pendingNumbers: number[] | null = null;

  for (const line of lines) {
    const heading = TYPE_HEADING_RE.exec(line);
    if (heading) {
      const type = Number(heading[1]);
      currentType = (OAB_BOOKLET_TYPES as readonly number[]).includes(type) ? type : null;
      pendingNumbers = null;
      continue;
    }
    if (currentType == null) continue;

    const numbers = numbersOnly(line);
    if (numbers) {
      pendingNumbers = numbers;
      continue;
    }

    const letters = lettersOnly(line);
    if (letters && pendingNumbers && letters.length === pendingNumbers.length) {
      const answers = byType.get(currentType) ?? new Map<number, number>();
      for (let i = 0; i < letters.length; i += 1) {
        const number = pendingNumbers[i];
        if (number >= 1 && number <= OAB_OBJECTIVE_QUESTION_COUNT) answers.set(number, letters[i]);
      }
      byType.set(currentType, answers);
    }
    pendingNumbers = null;
  }

  return byType;
}

/**
 * Reads the correspondence table. Rows carry four numbers per logical entry,
 * but the table is printed two entries wide, so an eight-number row is two
 * entries and a four-number row is one.
 */
function parseCorrespondence(lines: string[]): Map<number, Map<number, number>> {
  const table = new Map<number, Map<number, number>>();
  let active = false;

  for (const line of lines) {
    if (CORRESPONDENCE_HEADING_RE.test(line)) {
      active = true;
      continue;
    }
    if (!active) continue;

    const numbers = numbersOnly(line);
    if (!numbers || numbers.length % 4 !== 0) continue;

    for (let offset = 0; offset < numbers.length; offset += 4) {
      const entry = numbers.slice(offset, offset + 4);
      const [tipo1] = entry;
      if (tipo1 < 1 || tipo1 > OAB_OBJECTIVE_QUESTION_COUNT) continue;
      if (entry.some((n) => n < 1 || n > OAB_OBJECTIVE_QUESTION_COUNT)) continue;
      const row = new Map<number, number>();
      OAB_BOOKLET_TYPES.forEach((type, index) => row.set(type, entry[index]));
      table.set(tipo1, row);
    }
  }

  return table;
}

export function parseGabaritoText(text: string): GabaritoParseResult {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split(/\n|\f/);
  // The header row of the correspondence table repeats "TIPO 1 … TIPO 4", which
  // would otherwise re-trigger the answer-grid heading match. Split first.
  const cut = lines.findIndex((line) => CORRESPONDENCE_HEADING_RE.test(line));
  const gridLines = cut === -1 ? lines : lines.slice(0, cut);

  return {
    answersByType: parseAnswerGrids(gridLines),
    correspondence: parseCorrespondence(lines),
    definitive: DEFINITIVE_RE.test(normalized),
  };
}

export function parseGabaritoPdf(buffer: Buffer): GabaritoParseResult {
  return parseGabaritoText(extractLayoutText(buffer));
}

/**
 * Answers for one booklet type, re-keyed to Tipo 1 numbering.
 *
 * This is how a Tipo 3 booklet contributes without duplicating the bank: its
 * question 42 is looked up in the correspondence table, found to be Tipo 1's
 * question 17, and stored under 17. Returns null when the table is missing, so
 * callers can fall back to ingesting Tipo 1 alone rather than guessing.
 */
export function answersInCanonicalOrder(
  result: GabaritoParseResult,
  bookletType: number,
): Map<number, number> | null {
  const answers = result.answersByType.get(bookletType);
  if (!answers) return null;
  if (bookletType === 1) return answers;
  if (result.correspondence.size === 0) return null;

  const canonical = new Map<number, number>();
  for (const [tipo1, row] of result.correspondence) {
    const numberInBooklet = row.get(bookletType);
    if (numberInBooklet == null) continue;
    const index = answers.get(numberInBooklet);
    if (index != null) canonical.set(tipo1, index);
  }
  return canonical.size > 0 ? canonical : null;
}
