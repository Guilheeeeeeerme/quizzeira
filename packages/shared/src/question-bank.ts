import { sha256Hex } from "./sha256";
import type { GeneratedQuestionInput, LocaleCode, QuestionType } from "./types";

export type QuestionBankSourceKind = "llm" | "past_exam" | "seed" | "crawl";

export interface QuestionBankSourceMeta {
  kind: QuestionBankSourceKind;
  url?: string;
  urlHash?: string;
  title?: string;
  fetchedAt?: string;
}

export interface QuestionBankItem {
  id: string;
  examSlug: string;
  emphasis: string | null;
  subject: string;
  subjectSlug: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  locale: LocaleCode;
  source: QuestionBankSourceMeta;
  createdAt: string;
  lastSeenAt: string;
}

export interface QuestionBankSampleRequest {
  examSlug: string;
  emphasis?: string | null;
  subjects: string[];
  locale?: LocaleCode;
  limit: number;
  excludeIds?: string[];
}

export interface QuestionBankDepositRequest {
  examSlug: string;
  emphasis?: string | null;
  subject?: string | null;
  locale: LocaleCode;
  source: QuestionBankSourceMeta;
  questions: GeneratedQuestionInput[];
}

export interface QuestionBankStats {
  examSlug: string;
  total: number;
  bySubject: Record<string, number>;
}

export interface PastExamSearchRequest {
  examSlug?: string;
  emphasis?: string | null;
  subjects: string[];
  topicTitle?: string;
  guidelines?: string;
  locale?: LocaleCode;
}

export interface PastExamSearchHit {
  url: string;
  urlHash: string;
  title: string;
  snippet: string;
  queriedAt: string;
}

/** Normalize for Redis keys / identity (ASCII-ish, hyphenated). */
export function slugifyKey(raw: string | null | undefined, maxLen = 64): string {
  const base = String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return base || "unknown";
}

export function hashSourceUrl(url: string): string {
  return sha256Hex(url.trim()).slice(0, 24);
}

export function bankItemId(input: {
  examSlug: string;
  subjectSlug: string;
  prompt: string;
  options?: string[] | null;
}): string {
  const optionsKey = (input.options ?? []).join("\u0001");
  return sha256Hex(
    `${input.examSlug}|${input.subjectSlug}|${input.prompt.trim()}|${optionsKey}`,
  ).slice(0, 32);
}

export function bankItemKey(id: string): string {
  return `qbank:item:${id}`;
}

export function bankSubjectIndexKey(examSlug: string, subjectSlug: string): string {
  return `qbank:idx:${slugifyKey(examSlug)}:${slugifyKey(subjectSlug)}`;
}

export function bankExamIndexKey(examSlug: string): string {
  return `qbank:exam:${slugifyKey(examSlug)}`;
}

export function bankSourceKey(urlHash: string): string {
  return `qbank:source:${urlHash}`;
}

export function bankSearchCooldownKey(examSlug: string): string {
  return `qbank:search-cd:${slugifyKey(examSlug)}`;
}

/**
 * Prefer curated bank hits; only cold-generate enough to reach the session budget.
 * Bank items come first so reuse is stable across users of the same exam.
 */
export function preferBankOverColdGen(
  bank: GeneratedQuestionInput[],
  generated: GeneratedQuestionInput[],
  budget: { minQuestions: number; maxQuestions: number },
): { questions: GeneratedQuestionInput[]; fromBank: number; fromCold: number } {
  const max = Math.max(1, budget.maxQuestions);
  const min = Math.max(1, Math.min(budget.minQuestions, max));
  const bankTake = bank.slice(0, max);
  if (bankTake.length >= min) {
    return {
      questions: bankTake,
      fromBank: bankTake.length,
      fromCold: 0,
    };
  }
  const need = Math.max(min - bankTake.length, 0);
  const cold = generated.slice(0, Math.min(max - bankTake.length, Math.max(need, max - bankTake.length)));
  const merged = [...bankTake, ...cold].slice(0, max);
  return {
    questions: merged,
    fromBank: bankTake.length,
    fromCold: merged.length - bankTake.length,
  };
}

export function toGeneratedQuestion(item: QuestionBankItem): GeneratedQuestionInput {
  return {
    type: item.type,
    prompt: item.prompt,
    options: item.options,
    correctIndex: item.correctIndex,
    referenceAnswer: item.referenceAnswer,
    explanation: item.explanation,
  };
}
