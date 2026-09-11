import { AttemptStatus, QuestionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { formatUserResponse, toQuizQuestionDto } from "../utils/dto";
import type { QuizResultsDto, SubmitAnswer } from "@quizzeira/shared";

export async function submitQuiz(
  userId: string,
  attemptId: string,
  answers: SubmitAnswer[],
) {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      questions: { include: { question: true } },
    },
  });

  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw Object.assign(new Error("Attempt already submitted"), { statusCode: 400 });
  }

  const questionIds = new Set(attempt.questions.map((q) => q.questionId));
  if (answers.length !== questionIds.size) {
    throw Object.assign(new Error("Must answer all questions"), { statusCode: 400 });
  }

  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) {
      throw Object.assign(new Error("Invalid question in submission"), { statusCode: 400 });
    }
    const question = attempt.questions.find((q) => q.questionId === answer.questionId)!.question;
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const optionCount = Array.isArray(question.options)
        ? (question.options as unknown[]).length
        : 4;
      if (
        answer.selectedIndex === undefined ||
        answer.selectedIndex < 0 ||
        answer.selectedIndex >= Math.max(optionCount, 1)
      ) {
        throw Object.assign(new Error("MCQ requires a valid selectedIndex"), { statusCode: 400 });
      }
    } else if (!answer.openText?.trim()) {
      throw Object.assign(new Error("Open question requires openText"), { statusCode: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const answer of answers) {
      await tx.quizAnswer.create({
        data: {
          attemptId,
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex ?? null,
          openText: answer.openText?.trim() ?? null,
        },
      });
    }

    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.PENDING,
        submittedAt: new Date(),
      },
    });
  });

  return { attemptId, status: AttemptStatus.PENDING };
}

export async function getQuizResults(userId: string, attemptId: string): Promise<QuizResultsDto> {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      answers: { include: { question: true } },
      questions: { include: { question: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }

  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const isCorrected = attempt.status === AttemptStatus.CORRECTED;

  const answers = attempt.questions.map(({ question }) => {
    const answer = answerByQuestion.get(question.id);
    return {
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
      userResponse: formatUserResponse(
        question,
        answer?.selectedIndex,
        answer?.openText,
      ),
      grade: isCorrected ? (answer?.grade ?? null) : null,
      comment: isCorrected ? (answer?.comment ?? null) : null,
      explanation: isCorrected ? (answer?.explanation ?? null) : null,
      correctAnswerSummary: isCorrected ? (answer?.correctAnswerSummary ?? null) : null,
    };
  });

  return {
    attemptId: attempt.id,
    status: attempt.status,
    score: isCorrected ? attempt.score : null,
    maxScore: attempt.maxScore,
    generalComment: isCorrected ? attempt.generalComment : null,
    answers,
  };
}

export async function correctAttempt(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: true } },
    },
  });

  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
  }
  if (attempt.status !== AttemptStatus.PENDING && attempt.status !== AttemptStatus.IN_CORRECTION) {
    throw Object.assign(new Error("Attempt not eligible for correction"), { statusCode: 400 });
  }

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { status: AttemptStatus.IN_CORRECTION },
  });

  let totalScore = 0;
  const comments: string[] = [];

  for (const answer of attempt.answers) {
    const { question } = answer;
    let grade = 0;
    let comment = "";
    let isCorrect = false;

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      isCorrect = answer.selectedIndex === question.correctIndex;
      grade = isCorrect ? 1 : 0;
      comment = isCorrect
        ? (question.explanation ?? "Correct answer.")
        : (question.explanation ?? "Review this topic and try again.");
    } else {
      const text = answer.openText?.toLowerCase() ?? "";
      const ref = question.referenceAnswer?.toLowerCase() ?? "";
      const keywords = ref.split(/\W+/).filter((w) => w.length > 4).slice(0, 5);
      const hits = keywords.filter((k) => text.includes(k)).length;
      isCorrect = hits >= Math.ceil(keywords.length * 0.4);
      grade = isCorrect ? 1 : 0;
      comment = isCorrect
        ? "Good open response covering key concepts."
        : "Your answer could include more detail on core concepts from the reference material.";
    }

    totalScore += grade;
    comments.push(comment);

    await prisma.quizAnswer.update({
      where: { id: answer.id },
      data: {
        grade,
        comment,
        isCorrect,
        correctedAt: new Date(),
      },
    });
  }

  const generalComment =
    totalScore >= 4
      ? "Strong performance overall. Keep building on agent design and workflow skills."
      : totalScore >= 2
        ? "Solid effort. Review explanations for missed items and practice open-ended answers."
        : "Focus on fundamentals: prompts, tools, RAG, and workflow design before retrying.";

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
