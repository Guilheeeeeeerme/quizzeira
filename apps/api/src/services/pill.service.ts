import { AttemptStatus, QuestionType } from "@prisma/client";
import type { PillAttemptDto, PillStartResponse, StartPillInput } from "@quizzeira/shared";
import {
  isSessionDurationMinutes,
  normalizeLocale,
  normalizeQuestionPresentation,
  questionBudgetForDuration,
} from "@quizzeira/shared";
import { prisma } from "../lib/prisma";
import { samplePublishedForAttempt } from "../lib/pipeline-clients";
import { screenGeneratedQuestions } from "../lib/screen-model";
import { toQuizQuestionDto } from "../utils/dto";
import { examSlugFromGuidelines } from "./exam-catalog.service";

const BANK_EMPTY_MESSAGE =
  "This exam's question bank is still being built. Questions appear here once they pass the publish gate.";

/**
 * Start a study pill. Questions are sampled synchronously from content-api's
 * published set — study never generates. An exam with nothing published yet
 * fails fast with a friendly message instead of parking an attempt forever.
 */
export async function startPill(
  userId: string,
  topicId: string,
  input: StartPillInput = {},
): Promise<PillStartResponse> {
  const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } });
  if (!topic) {
    throw Object.assign(new Error("Topic not found"), { statusCode: 404 });
  }

  const examSlug = examSlugFromGuidelines(topic.guidelines);
  if (!examSlug) {
    throw Object.assign(
      new Error("This study config is not linked to an open exam. Re-open it from the catalog."),
      { statusCode: 409 },
    );
  }

  const locale = normalizeLocale(input.locale ?? topic.preferredLocale ?? "en");
  const focusText = input.focusText?.trim() || null;
  const durationMinutes =
    input.durationMinutes === null || input.durationMinutes === undefined
      ? null
      : isSessionDurationMinutes(input.durationMinutes)
        ? input.durationMinutes
        : (() => {
            throw Object.assign(new Error("Invalid durationMinutes"), { statusCode: 400 });
          })();
  const budget = questionBudgetForDuration(durationMinutes);

  const sampled = await samplePublishedForAttempt({
    examSlug,
    locale,
    limit: budget.maxQuestions,
    syllabusNodeIds: input.syllabusNodeIds?.filter(Boolean) ?? [],
  });
  if (sampled.length === 0) {
    throw Object.assign(new Error(BANK_EMPTY_MESSAGE), { statusCode: 409 });
  }
  screenGeneratedQuestions(sampled);

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.quizAttempt.create({
      data: {
        userId,
        topicId,
        locale,
        focusText,
        durationMinutes,
        status: AttemptStatus.IN_PROGRESS,
        maxScore: sampled.length,
      },
    });

    for (const [index, q] of sampled.entries()) {
      const normalized = normalizeQuestionPresentation({
        prompt: q.prompt,
        options: q.type === "MULTIPLE_CHOICE" ? q.options : null,
        promptMedia: q.promptMedia,
        optionMedia: q.optionMedia,
      });
      const question = await tx.question.create({
        data: {
          topicId,
          sourceAttemptId: created.id,
          type: q.type === "OPEN" ? QuestionType.OPEN : QuestionType.MULTIPLE_CHOICE,
          prompt: normalized.prompt,
          options: q.type === "MULTIPLE_CHOICE" ? (normalized.options ?? []) : undefined,
          promptMedia: normalized.promptMedia.length ? normalized.promptMedia : undefined,
          optionMedia:
            q.type === "MULTIPLE_CHOICE" && normalized.optionMedia?.some(Boolean)
              ? normalized.optionMedia
              : undefined,
          correctIndex: q.type === "MULTIPLE_CHOICE" ? q.correctIndex : null,
          referenceAnswer: q.type === "OPEN" ? q.referenceAnswer : null,
          explanation: q.explanation?.trim() || null,
          isActive: true,
          lastReviewedAt: new Date(),
        },
      });
      await tx.attemptQuestion.create({
        data: { attemptId: created.id, questionId: question.id, sortOrder: index },
      });
    }

    return created;
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { preferredLocale: locale, lastUsedAt: new Date() },
  });

  return { attemptId: attempt.id, status: AttemptStatus.IN_PROGRESS };
}

export async function getPillAttempt(userId: string, attemptId: string): Promise<PillAttemptDto> {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      topic: true,
      questions: { include: { question: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!attempt || !attempt.topicId || !attempt.topic) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }

  return {
    attemptId: attempt.id,
    status: attempt.status,
    topicId: attempt.topicId,
    topicTitle: attempt.topic.title,
    focusText: attempt.focusText,
    locale: normalizeLocale(attempt.locale),
    questions: attempt.questions.map(({ question }) => toQuizQuestionDto(question)),
  };
}
