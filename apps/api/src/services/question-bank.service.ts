import type {
  GeneratedQuestionInput,
  LocaleCode,
  PastExamSearchRequest,
  QuestionBankDepositRequest,
  QuestionBankSampleRequest,
} from "@quizzeira/shared";
import { inferExamIdentity, pickSubjectForDeposit } from "../lib/exam-identity";
import { searchPastExams } from "./past-exam-search";
import {
  getQuestionBankStats,
  listQuestionBankExamSlugs,
  sampleBankQuestions,
  upsertBankQuestions,
} from "./question-bank.store";

export async function sampleForAttempt(input: {
  topicTitle: string;
  guidelines: string;
  focusText?: string | null;
  subjects: string[];
  locale: LocaleCode;
  limit: number;
  excludeIds?: string[];
}) {
  const identity = inferExamIdentity({
    topicTitle: input.topicTitle,
    guidelines: input.guidelines,
    focusText: input.focusText,
  });
  const req: QuestionBankSampleRequest = {
    examSlug: identity.examSlug,
    emphasis: identity.emphasis,
    subjects: input.subjects.length ? input.subjects : identity.emphasis ? [identity.emphasis] : [],
    locale: input.locale,
    limit: input.limit,
    excludeIds: input.excludeIds,
  };
  const sample = await sampleBankQuestions(req);
  return { identity, ...sample };
}

export async function depositGeneratedQuestions(input: {
  topicTitle: string;
  guidelines: string;
  focusText?: string | null;
  subjects: string[];
  locale: LocaleCode;
  questions: GeneratedQuestionInput[];
  sourceKind?: "llm" | "seed";
}) {
  const identity = inferExamIdentity({
    topicTitle: input.topicTitle,
    guidelines: input.guidelines,
    focusText: input.focusText,
  });
  const subject = pickSubjectForDeposit(input.subjects, input.focusText);
  const req: QuestionBankDepositRequest = {
    examSlug: identity.examSlug,
    emphasis: identity.emphasis,
    subject,
    locale: input.locale,
    source: { kind: input.sourceKind ?? "llm" },
    questions: input.questions,
  };
  const result = await upsertBankQuestions(req);
  return { identity, ...result };
}

export async function searchAndEnrichBank(input: PastExamSearchRequest) {
  return searchPastExams(input);
}

export async function questionBankOverview(examSlug?: string) {
  if (examSlug?.trim()) {
    return {
      exams: [await getQuestionBankStats(examSlug.trim())],
    };
  }
  const slugs = await listQuestionBankExamSlugs();
  const exams = [];
  for (const slug of slugs) {
    exams.push(await getQuestionBankStats(slug));
  }
  return { exams };
}
