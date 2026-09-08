import { AttemptStatus, QuestionType } from "@prisma/client";
import type {
  GenerationCompleteInput,
  InferredSyllabus,
  LocaleCode,
  PendingGenerationAttempt,
  PillAttemptDto,
  PillStartResponse,
  StartPillInput,
} from "@quizzeira/shared";
import {
  isSessionDurationMinutes,
  normalizeLocale,
  questionBudgetForDuration,
} from "@quizzeira/shared";
import { prisma } from "../lib/prisma";
import { excerptMaterialForGeneration } from "../lib/fetch-url";
import { toQuizQuestionDto } from "../utils/dto";

const STALE_MS = 10 * 60 * 1000;

function parseInferredSyllabus(raw: string | null | undefined): InferredSyllabus | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<InferredSyllabus>;
    if (!Array.isArray(parsed.subjects) || parsed.subjects.length === 0) return null;
    return {
      subjects: parsed.subjects.map(String),
      styleNotes: typeof parsed.styleNotes === "string" ? parsed.styleNotes : "",
      difficultyNotes: typeof parsed.difficultyNotes === "string" ? parsed.difficultyNotes : "",
      seniority: typeof parsed.seniority === "string" ? parsed.seniority : null,
      materialRoles: Array.isArray(parsed.materialRoles)
        ? parsed.materialRoles.map(String)
        : [],
    };
  } catch {
    return null;
  }
}

export async function startPill(
  userId: string,
  topicId: string,
  input: StartPillInput = {},
): Promise<PillStartResponse> {
  const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } });
  if (!topic) {
    throw Object.assign(new Error("Topic not found"), { statusCode: 404 });
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

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      topicId,
      locale,
      focusText,
      durationMinutes,
      status: AttemptStatus.GENERATING,
      generationStartedAt: null,
      maxScore: budget.maxQuestions,
    },
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: {
      preferredLocale: locale,
      lastUsedAt: new Date(),
    },
  });

  return { attemptId: attempt.id, status: AttemptStatus.GENERATING };
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
    questions:
      attempt.status === AttemptStatus.GENERATING
        ? []
        : attempt.questions.map(({ question }) => toQuizQuestionDto(question)),
  };
}

async function loadGenerationPayload(attemptId: string): Promise<PendingGenerationAttempt> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      topic: {
        include: {
          attachments: true,
          links: true,
        },
      },
    },
  });
  if (!attempt?.topic) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }

  const recent = await prisma.quizAttempt.findMany({
    where: {
      topicId: attempt.topicId!,
      status: AttemptStatus.CORRECTED,
      id: { not: attemptId },
    },
    orderBy: { correctedAt: "desc" },
    take: 5,
  });

  const durationMinutes = attempt.durationMinutes ?? null;
  const constraints = questionBudgetForDuration(durationMinutes);

  return {
    attemptId: attempt.id,
    topicId: attempt.topic.id,
    topicTitle: attempt.topic.title,
    guidelines: attempt.topic.guidelines,
    presetSlug: attempt.topic.presetSlug,
    focusText: attempt.focusText,
    durationMinutes,
    inferredSyllabus: parseInferredSyllabus(attempt.topic.inferredSyllabus),
    locale: normalizeLocale(attempt.locale),
    hasLinks: attempt.topic.links.length > 0 || attempt.topic.presetSlug === "entrevista",
    materials: {
      attachments: attempt.topic.attachments.map((a) => ({
        filename: a.filename,
        kind: a.kind,
        excerpt: excerptMaterialForGeneration(a.extractedText, { filename: a.filename }),
      })),
      links: attempt.topic.links.map((l) => ({
        url: l.url,
        label: l.label,
        excerpt: excerptMaterialForGeneration(l.fetchedText, { filename: l.label ?? l.url }),
      })),
    },
    recentPerformance: recent.map((r) => ({
      score: r.score,
      maxScore: r.maxScore,
      focusText: r.focusText,
      correctedAt: r.correctedAt?.toISOString() ?? null,
    })),
    constraints,
  };
}

export async function claimNextGeneratingAttempt(): Promise<PendingGenerationAttempt | null> {
  const staleBefore = new Date(Date.now() - STALE_MS);
  const candidate = await prisma.quizAttempt.findFirst({
    where: {
      status: AttemptStatus.GENERATING,
      OR: [{ generationStartedAt: null }, { generationStartedAt: { lt: staleBefore } }],
    },
    orderBy: { startedAt: "asc" },
  });
  if (!candidate) return null;

  const claimed = await prisma.quizAttempt.updateMany({
    where: {
      id: candidate.id,
      status: AttemptStatus.GENERATING,
      OR: [{ generationStartedAt: null }, { generationStartedAt: { lt: staleBefore } }],
    },
    data: { generationStartedAt: new Date() },
  });
  if (claimed.count === 0) return null;
  return loadGenerationPayload(candidate.id);
}

export async function releaseGeneratingAttempt(attemptId: string) {
  const result = await prisma.quizAttempt.updateMany({
    where: { id: attemptId, status: AttemptStatus.GENERATING },
    data: { generationStartedAt: null },
  });
  if (result.count === 0) {
    throw Object.assign(new Error("Attempt not generating"), { statusCode: 400 });
  }
  return { attemptId, status: AttemptStatus.GENERATING };
}

export async function saveTopicInferredSyllabus(
  topicId: string,
  syllabus: InferredSyllabus,
): Promise<{ topicId: string; saved: true }> {
  if (!Array.isArray(syllabus.subjects) || syllabus.subjects.length === 0) {
    throw Object.assign(new Error("subjects required"), { statusCode: 400 });
  }
  const normalized: InferredSyllabus = {
    subjects: syllabus.subjects.map((s) => String(s).trim()).filter(Boolean),
    styleNotes: String(syllabus.styleNotes ?? "").trim(),
    difficultyNotes: String(syllabus.difficultyNotes ?? "").trim(),
    seniority:
      syllabus.seniority == null || String(syllabus.seniority).trim() === ""
        ? null
        : String(syllabus.seniority).trim(),
    materialRoles: Array.isArray(syllabus.materialRoles)
      ? syllabus.materialRoles.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
  if (normalized.subjects.length === 0) {
    throw Object.assign(new Error("subjects required"), { statusCode: 400 });
  }

  const result = await prisma.topic.updateMany({
    where: { id: topicId },
    data: { inferredSyllabus: JSON.stringify(normalized) },
  });
  if (result.count === 0) {
    throw Object.assign(new Error("Topic not found"), { statusCode: 404 });
  }
  return { topicId, saved: true };
}

export async function completePillGeneration(
  attemptId: string,
  input: GenerationCompleteInput,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { questions: true },
  });
  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }
  if (attempt.status !== AttemptStatus.GENERATING) {
    throw Object.assign(new Error("Attempt not generating"), { statusCode: 400 });
  }
  if (attempt.questions.length > 0) {
    throw Object.assign(new Error("Attempt already has questions"), { statusCode: 400 });
  }

  const budget = questionBudgetForDuration(attempt.durationMinutes);
  const questions = input.questions ?? [];
  if (questions.length < budget.minQuestions || questions.length > budget.maxQuestions) {
    throw Object.assign(
      new Error(
        `questions must contain ${budget.minQuestions}-${budget.maxQuestions} items`,
      ),
      { statusCode: 400 },
    );
  }

  for (const q of questions) {
    if (!q.prompt?.trim()) {
      throw Object.assign(new Error("Each question needs a prompt"), { statusCode: 400 });
    }
    if (q.type === "MULTIPLE_CHOICE") {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
        throw Object.assign(new Error("MCQ needs 2-6 options"), { statusCode: 400 });
      }
      if (
        q.correctIndex === null ||
        q.correctIndex === undefined ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length
      ) {
        throw Object.assign(new Error("MCQ correctIndex out of range"), { statusCode: 400 });
      }
    } else if (!q.referenceAnswer?.trim()) {
      throw Object.assign(new Error("OPEN questions need referenceAnswer"), { statusCode: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const [index, q] of questions.entries()) {
      const created = await tx.question.create({
        data: {
          topicId: attempt.topicId,
          sourceAttemptId: attemptId,
          type: q.type === "OPEN" ? QuestionType.OPEN : QuestionType.MULTIPLE_CHOICE,
          prompt: q.prompt.trim(),
          options: q.type === "MULTIPLE_CHOICE" ? (q.options ?? []) : undefined,
          correctIndex: q.type === "MULTIPLE_CHOICE" ? q.correctIndex : null,
          referenceAnswer: q.type === "OPEN" ? q.referenceAnswer : null,
          explanation: q.explanation?.trim() || null,
          isActive: true,
          lastReviewedAt: new Date(),
        },
      });
      await tx.attemptQuestion.create({
        data: {
          attemptId,
          questionId: created.id,
          sortOrder: index,
        },
      });
    }

    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.IN_PROGRESS,
        maxScore: questions.length,
        generationStartedAt: null,
      },
    });
  });

  return { attemptId, status: AttemptStatus.IN_PROGRESS, questionCount: questions.length };
}
