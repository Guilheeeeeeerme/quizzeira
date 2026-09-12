// Concept: Extraction (parsed OAB documents → draft question items)
//
// This is the join the rest of the platform does not need: a caderno carries the
// questions but no answers, and the gabarito carries the answers but no text, so
// neither document alone yields a publishable item. Here they are matched — via
// the correspondence table when the booklet is not Tipo 1 — and the result is a
// question that was never written by a model: prompt, options and key all come
// from the banca.
import {
  oabSubjectForQuestion,
  OAB_OBJECTIVE_QUESTION_COUNT,
  type GeneratedQuestionInput,
} from "@quizzeira/shared";
import type { CadernoParseResult } from "./caderno.js";
import { answersInCanonicalOrder, type GabaritoParseResult } from "./gabarito.js";
import type { PadraoParseResult } from "./padrao.js";

/** Draft items sharing one subject, which is how Content's draft endpoint keys. */
export interface OabDraftGroup {
  subject: string;
  subjectSlug: string;
  questions: GeneratedQuestionInput[];
}

export interface ObjectiveDraftResult {
  groups: OabDraftGroup[];
  /** Parsed questions dropped because the definitive key does not list them. */
  annulled: number[];
  /** Parsed questions dropped because the key covers no such number. */
  unkeyed: number[];
}

/**
 * Builds draft items from one booklet plus the edition's answer key.
 *
 * Everything is canonicalized to Tipo 1 numbering. A booklet whose numbering
 * cannot be canonicalized (no correspondence table) contributes nothing rather
 * than duplicating Tipo 1's questions under shuffled subjects.
 */
export function objectiveDrafts(
  caderno: CadernoParseResult,
  gabarito: GabaritoParseResult,
): ObjectiveDraftResult {
  const empty: ObjectiveDraftResult = { groups: [], annulled: [], unkeyed: [] };
  const bookletType = caderno.bookletType;
  if (bookletType == null) return empty;

  const answers = answersInCanonicalOrder(gabarito, bookletType);
  if (!answers) return empty;

  const toCanonical = canonicalNumbering(gabarito, bookletType);
  if (!toCanonical) return empty;

  const bySubject = new Map<string, OabDraftGroup>();
  const annulled: number[] = [];
  const unkeyed: number[] = [];

  for (const question of caderno.questions) {
    const tipo1 = toCanonical(question.number);
    if (tipo1 == null || tipo1 < 1 || tipo1 > OAB_OBJECTIVE_QUESTION_COUNT) {
      unkeyed.push(question.number);
      continue;
    }
    const correctIndex = answers.get(tipo1);
    // Absent from the definitive key means the Banca Recursal annulled it.
    if (correctIndex == null) {
      annulled.push(tipo1);
      continue;
    }

    const subject = oabSubjectForQuestion(tipo1);
    const group = bySubject.get(subject.slug) ?? {
      subject: subject.name,
      subjectSlug: subject.slug,
      questions: [],
    };
    group.questions.push({
      type: "MULTIPLE_CHOICE",
      prompt: question.prompt,
      options: question.options,
      correctIndex,
      referenceAnswer: null,
      explanation: null,
    });
    bySubject.set(subject.slug, group);
  }

  annulled.sort((a, b) => a - b);
  unkeyed.sort((a, b) => a - b);
  return { groups: [...bySubject.values()], annulled, unkeyed };
}

/** Booklet number → Tipo 1 number, for the booklet we are reading. */
function canonicalNumbering(
  gabarito: GabaritoParseResult,
  bookletType: number,
): ((n: number) => number | null) | null {
  if (bookletType === 1) return (n) => n;
  if (gabarito.correspondence.size === 0) return null;
  const reverse = new Map<number, number>();
  for (const [tipo1, row] of gabarito.correspondence) {
    const numberInBooklet = row.get(bookletType);
    if (numberInBooklet != null) reverse.set(numberInBooklet, tipo1);
  }
  return (n) => reverse.get(n) ?? null;
}

/**
 * Builds draft items from a 2ª fase padrão de respostas. These are open
 * questions whose reference answer is the banca's own model answer, so the
 * corrector grades against the official text rather than a generated rubric.
 *
 * Items whose enunciado the padrão omits are skipped: an open question with no
 * statement is unanswerable, and the statement lives in the caderno, which is a
 * separate document.
 */
export function practicalDrafts(padrao: PadraoParseResult): OabDraftGroup[] {
  const area = padrao.area;
  const questions: GeneratedQuestionInput[] = [];

  for (const item of padrao.items) {
    if (item.enunciado.length < 40) continue;
    const label =
      item.kind === "peca"
        ? "Peça prático-profissional"
        : `Questão ${String(item.number ?? "").padStart(2, "0")}`;
    const value = item.value == null ? "" : ` (Valor: ${item.value.toFixed(2).replace(".", ",")})`;
    questions.push({
      type: "OPEN",
      prompt: `${label}${value}\n\n${item.enunciado}`,
      options: null,
      correctIndex: null,
      referenceAnswer: item.answer,
      explanation: null,
    });
  }

  if (questions.length === 0) return [];
  return [
    {
      subject: area?.name ?? "Geral",
      subjectSlug: area?.slug ?? "geral",
      questions,
    },
  ];
}
