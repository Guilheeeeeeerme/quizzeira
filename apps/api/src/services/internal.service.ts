import { AttemptStatus, QuestionType } from "@prisma/client";
import type {
  AttemptCorrectionInput,
  PendingReviewAttempt,
  QuestionUpdateCandidate,
  QuestionUpdateInput,
  ReviewQuestionPayload,
} from "@quizzeira/shared";
import { prisma } from "../lib/prisma";
import { screenPersistedStrings } from "../lib/screen-model";

const STALE_MS = 10 * 60 * 1000;

function asOptions(value: unknown): string[] | null {
  return Array.isArray(value) ? (value as string[]) : null;
}

function toReviewPayload(
  question: {
    id: string;
    type: QuestionType;
    prompt: string;
    options: unknown;
    correctIndex: number | null;
    referenceAnswer: string | null;
    explanation: string | null;
  },
  answer: { selectedIndex: number | null; openText: string | null },
): ReviewQuestionPayload {
  return {
    questionId: question.id,
    type: question.type,
    prompt: question.prompt,
    options: asOptions(question.options),
    correctIndex: question.correctIndex,
    referenceAnswer: question.referenceAnswer,
    explanation: question.explanation,
    selectedIndex: answer.selectedIndex,
    openText: answer.openText,
  };
}

async function loadAttemptForReview(attemptId: string): Promise<PendingReviewAttempt> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      topic: true,
      answers: { include: { question: true } },
      questions: { include: { question: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
  return {
    attemptId: attempt.id,
    levelSlug: "topic",
    levelLabel: attempt.topic?.title ?? "Topic",
    locale: attempt.locale === "pt" || attempt.locale === "pt-BR" ? "pt" : "en",
    questions: attempt.questions.map(({ question }) => {
      const answer = answerByQuestion.get(question.id);
      return toReviewPayload(question, {
        selectedIndex: answer?.selectedIndex ?? null,
        openText: answer?.openText ?? null,
      });
    }),
  };
}

export async function claimNextPendingAttempt(): Promise<PendingReviewAttempt | null> {
  const staleBefore = new Date(Date.now() - STALE_MS);
  const candidate = await prisma.quizAttempt.findFirst({
    where: {
      OR: [
        { status: AttemptStatus.PENDING },
        { status: AttemptStatus.IN_CORRECTION, correctionStartedAt: { lt: staleBefore } },
        { status: AttemptStatus.IN_CORRECTION, correctionStartedAt: null },
      ],
    },
    orderBy: { submittedAt: "asc" },
  });
  if (!candidate) return null;

  const claimed = await prisma.quizAttempt.updateMany({
    where: {
      id: candidate.id,
      OR: [
        { status: AttemptStatus.PENDING },
        { status: AttemptStatus.IN_CORRECTION, correctionStartedAt: { lt: staleBefore } },
        { status: AttemptStatus.IN_CORRECTION, correctionStartedAt: null },
      ],
    },
    data: {
      status: AttemptStatus.IN_CORRECTION,
      correctionStartedAt: new Date(),
    },
  });
  if (claimed.count === 0) return null;
  return loadAttemptForReview(candidate.id);
}

export async function releaseAttempt(attemptId: string): Promise<{ attemptId: string; status: AttemptStatus }> {
  const result = await prisma.quizAttempt.updateMany({
    where: { id: attemptId, status: AttemptStatus.IN_CORRECTION },
    data: { status: AttemptStatus.PENDING, correctionStartedAt: null },
  });
  if (result.count === 0) {
    throw Object.assign(new Error("Attempt not in correction"), { statusCode: 400 });
  }
  return { attemptId, status: AttemptStatus.PENDING };
}

export async function completeAttemptCorrection(
  attemptId: string,
  input: AttemptCorrectionInput,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: { include: { question: true } } },
  });
  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }
  if (attempt.status !== AttemptStatus.IN_CORRECTION) {
    throw Object.assign(new Error("Attempt not in correction"), { statusCode: 400 });
  }

  const incoming = new Map(input.answers.map((a) => [a.questionId, a]));
  for (const answer of attempt.answers) {
    if (!incoming.has(answer.questionId)) {
      throw Object.assign(new Error("Missing correction for a question"), { statusCode: 400 });
    }
  }

  let totalScore = 0;
  for (const answer of attempt.answers) {
    const question = answer.question;
    const proposed = incoming.get(question.id)!;
    let grade = proposed.grade >= 1 ? 1 : 0;
    let isCorrect = Boolean(proposed.isCorrect) && grade === 1;
    let comment = String(proposed.comment ?? "").slice(0, 2000);
    let explanation = String(proposed.explanation ?? "").slice(0, 4000) || null;
    let correctAnswerSummary = String(proposed.correctAnswerSummary ?? "").slice(0, 2000) || null;

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      isCorrect = answer.selectedIndex === question.correctIndex;
      grade = isCorrect ? 1 : 0;
      if (!comment) {
        comment = isCorrect
          ? (question.explanation ?? "Correct answer.")
          : (question.explanation ?? "Review this topic and try again.");
      }
      if (!explanation) explanation = question.explanation;
      if (!correctAnswerSummary && Array.isArray(question.options) && question.correctIndex != null) {
        const options = question.options as string[];
        correctAnswerSummary = options[question.correctIndex] ?? null;
      }
    } else if (!correctAnswerSummary) {
      correctAnswerSummary = question.referenceAnswer;
    }

    screenPersistedStrings(comment, explanation, correctAnswerSummary);

    totalScore += grade;
    await prisma.quizAnswer.update({
      where: { id: answer.id },
      data: {
        grade,
        comment,
        explanation,
        correctAnswerSummary,
        isCorrect,
        correctedAt: new Date(),
      },
    });
  }

  const generalComment = String(input.generalComment ?? "").slice(0, 4000);
  screenPersistedStrings(generalComment);
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: AttemptStatus.CORRECTED,
      score: totalScore,
      generalComment,
      correctedAt: new Date(),
    },
  });

  return { attemptId, status: AttemptStatus.CORRECTED, score: totalScore };
}

async function questionPerformance(questionId: string) {
  const answers = await prisma.quizAnswer.findMany({
    where: { questionId, isCorrect: { not: null } },
    select: { isCorrect: true, grade: true },
  });
  const gradedCount = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const grades = answers.map((a) => a.grade).filter((g): g is number => g !== null);
  return {
    answerCount: gradedCount,
    gradedCount,
    correctCount,
    correctRate: gradedCount ? correctCount / gradedCount : null,
    avgGrade: grades.length ? grades.reduce((s, g) => s + g, 0) / grades.length : null,
  };
}

export async function nextQuestionForUpdate(): Promise<QuestionUpdateCandidate | null> {
  // Classic level updater removed — content-quality owns bank Eval.
  return null;
}

export async function updateQuestion(id: string, input: QuestionUpdateInput) {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) {
    throw Object.assign(new Error("Question not found"), { statusCode: 404 });
  }

  const data: {
    prompt?: string;
    options?: string[];
    correctIndex?: number | null;
    referenceAnswer?: string | null;
    explanation?: string | null;
    isActive?: boolean;
    lastReviewedAt: Date;
  } = { lastReviewedAt: new Date() };

  if (input.prompt !== undefined) data.prompt = input.prompt;
  if (input.referenceAnswer !== undefined) data.referenceAnswer = input.referenceAnswer;
  if (input.explanation !== undefined) data.explanation = input.explanation;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    if (input.options !== undefined) {
      if (!Array.isArray(input.options) || input.options.length !== 4) {
        throw Object.assign(new Error("MCQ requires exactly 4 options"), { statusCode: 400 });
      }
      data.options = input.options;
    }
    if (input.correctIndex !== undefined) {
      if (input.correctIndex === null || input.correctIndex < 0 || input.correctIndex > 3) {
        throw Object.assign(new Error("MCQ correctIndex must be 0-3"), { statusCode: 400 });
      }
      data.correctIndex = input.correctIndex;
    }
  }

  const updated = await prisma.question.update({
    where: { id },
    data,
  });

  return {
    id: updated.id,
    type: updated.type,
    prompt: updated.prompt,
    options: asOptions(updated.options),
    correctIndex: updated.correctIndex,
    referenceAnswer: updated.referenceAnswer,
    explanation: updated.explanation,
    levelSlug: "topic",
    lastReviewedAt: updated.lastReviewedAt?.toISOString() ?? null,
  };
}

export async function proposeQuestionUpdate(
  questionId: string,
  input: QuestionUpdateInput,
  _reason?: string,
) {
  // Updater / level proposals removed — touch review timestamp only.
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw Object.assign(new Error("Question not found"), { statusCode: 404 });
  }
  await prisma.question.update({
    where: { id: questionId },
    data: { lastReviewedAt: new Date() },
  });
  if (
    input.prompt !== undefined ||
    input.options !== undefined ||
    input.correctIndex !== undefined ||
    input.referenceAnswer !== undefined ||
    input.explanation !== undefined
  ) {
    screenPersistedStrings(
      input.prompt,
      input.explanation,
      input.referenceAnswer,
      ...(input.options ?? []),
    );
    return updateQuestion(questionId, input).then((result) => ({
      id: null as string | null,
      reviewedOnly: false,
      result,
    }));
  }
  return { id: null as string | null, reviewedOnly: true };
}

export async function listQuestionProposals(_status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING") {
  return [] as Array<Record<string, unknown>>;
}

export async function approveQuestionProposal(_id: string, _reviewerId: string) {
  throw Object.assign(new Error("Question update proposals removed"), { statusCode: 410 });
}

export async function rejectQuestionProposal(_id: string, _reviewerId: string) {
  throw Object.assign(new Error("Question update proposals removed"), { statusCode: 410 });
}
