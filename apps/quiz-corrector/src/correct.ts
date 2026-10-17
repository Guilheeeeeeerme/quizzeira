// Concept: MCQ grades via JEV Choice; Gemini owns open-text grades + generalComment.
// Mode: JEV_CORRECTOR_MODE off|shadow|active (see docs/llm-ownership.md).
import type {
  AnswerCorrection,
  AttemptCorrectionInput,
  PendingReviewAttempt,
  ReviewQuestionPayload,
} from "@quizzeira/shared";
import {
  generateJson,
  jevDecide,
  jevModeFor,
  jevShadow,
  loadPrompt,
  logInfo,
  screenModelStrings,
  type JevChoiceQuestion,
  type JevMode,
} from "@quizzeira/worker-kit";

export const CORRECTOR_RUBRIC_VERSION = "corrector-mcq-jev-v1";
export const MCQ_CONFIDENCE_FLOOR = 0.55;

const MCQ_CRITERIA = {
  correct:
    "The learner's selected option matches the keyed correct answer for this item.",
  incorrect:
    "The learner's selected option does not match the keyed correct answer.",
} as const;

export type CorrectorMcqQuestions = Record<string, JevChoiceQuestion>;

export function isKeyedMcq(q: ReviewQuestionPayload): boolean {
  return (
    q.type === "MULTIPLE_CHOICE" &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    typeof q.correctIndex === "number" &&
    q.correctIndex >= 0 &&
    q.correctIndex < q.options.length &&
    typeof q.selectedIndex === "number"
  );
}

export function buildMcqState(attempt: PendingReviewAttempt, mcqs: ReviewQuestionPayload[]): unknown {
  return {
    rubric: CORRECTOR_RUBRIC_VERSION,
    attemptId: attempt.attemptId,
    locale: attempt.locale,
    items: mcqs.map((q) => ({
      questionId: q.questionId,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex: q.selectedIndex,
      selectedOption:
        q.options && typeof q.selectedIndex === "number" ? q.options[q.selectedIndex] ?? null : null,
      correctOption:
        q.options && typeof q.correctIndex === "number" ? q.options[q.correctIndex] ?? null : null,
    })),
  };
}

export function buildMcqQuestions(mcqs: ReviewQuestionPayload[]): CorrectorMcqQuestions {
  const questions: CorrectorMcqQuestions = {};
  for (const q of mcqs) {
    questions[q.questionId] = {
      type: "choice",
      instructions:
        "For this quiz item, is the learner's selected option the keyed correct answer? " +
        "Use `correctIndex` / `correctOption` vs `selectedIndex` / `selectedOption` in state.",
      criteria: { ...MCQ_CRITERIA },
    };
  }
  return questions;
}

function templateMcqComment(isCorrect: boolean, locale: string): string {
  if (locale.startsWith("pt")) {
    return isCorrect ? "Resposta correta." : "Resposta incorreta.";
  }
  return isCorrect ? "Correct answer." : "Incorrect answer.";
}

export function mcqCorrectionFromChoice(
  q: ReviewQuestionPayload,
  choice: "correct" | "incorrect",
  confidence: number,
  locale: string,
): AnswerCorrection {
  const isCorrect = choice === "correct";
  return {
    questionId: q.questionId,
    grade: isCorrect ? 1 : 0,
    isCorrect,
    comment: templateMcqComment(isCorrect, locale),
    explanation:
      confidence < MCQ_CONFIDENCE_FLOOR
        ? `Low-confidence grade (confidence=${confidence.toFixed(2)}).`
        : undefined,
  };
}

/** Deterministic keyed compare — shadow agreement baseline. */
export function codeMcqCorrect(q: ReviewQuestionPayload): boolean {
  return q.selectedIndex === q.correctIndex;
}

export interface CorrectDeps {
  generate?: typeof generateJson;
  jev?: typeof jevDecide;
  mode?: JevMode;
  loadPromptFn?: typeof loadPrompt;
}

/**
 * Build an AttemptCorrectionInput:
 * - `off`: full Gemini JSON (legacy).
 * - `shadow`: Gemini decides; JEV MCQ Choice logged beside it.
 * - `active`: JEV owns keyed MCQ grades; Gemini grades OPEN items + generalComment only.
 */
export async function correctAttempt(
  attempt: PendingReviewAttempt,
  deps: CorrectDeps = {},
): Promise<AttemptCorrectionInput> {
  const mode = deps.mode ?? jevModeFor("corrector");
  const generate = deps.generate ?? generateJson;
  const jev = deps.jev ?? jevDecide;
  const load = deps.loadPromptFn ?? loadPrompt;
  const mcqs = attempt.questions.filter(isKeyedMcq);
  const opens = attempt.questions.filter((q) => !isKeyedMcq(q));

  if (mode === "off") {
    return fullGeminiCorrection(attempt, generate, load);
  }

  if (mode === "shadow") {
    const gemini = await fullGeminiCorrection(attempt, generate, load);
    if (mcqs.length > 0) {
      const questions = buildMcqQuestions(mcqs);
      await jevShadow(
        {
          task: "corrector",
          state: buildMcqState(attempt, mcqs),
          questions,
        },
        (decision) => {
          let agree = 0;
          for (const q of mcqs) {
            const ans = decision.answers[q.questionId];
            if (!ans || ans.type !== "choice") continue;
            const jevCorrect = ans.choice === "correct";
            const geminiAns = gemini.answers.find((a) => a.questionId === q.questionId);
            const geminiCorrect = geminiAns?.isCorrect ?? codeMcqCorrect(q);
            if (jevCorrect === geminiCorrect) agree += 1;
          }
          return {
            agreeCount: agree,
            mcqCount: mcqs.length,
            estimatedUsd: decision.meta.estimatedUsd,
            durationMs: decision.meta.durationMs,
          };
        },
        { decide: jev },
      );
    }
    return gemini;
  }

  // active: JEV MCQ + Gemini for OPEN + generalComment
  const answers: AnswerCorrection[] = [];
  if (mcqs.length > 0) {
    const questions = buildMcqQuestions(mcqs);
    const decision = await jev({
      task: "corrector",
      state: buildMcqState(attempt, mcqs),
      questions,
      mode: "active",
    });
    logInfo("jev corrector decision", {
      event: "jev_decision",
      task: "corrector",
      mode: "active",
      estimatedUsd: decision.meta.estimatedUsd,
      durationMs: decision.meta.durationMs,
      inputTokens: decision.meta.usage?.inputTokens ?? null,
      model: decision.meta.returnedModel ?? decision.meta.requestedModel,
      mcqCount: mcqs.length,
    });
    for (const q of mcqs) {
      const ans = decision.answers[q.questionId];
      if (!ans || ans.type !== "choice" || (ans.choice !== "correct" && ans.choice !== "incorrect")) {
        throw new Error(`jev corrector: missing choice for ${q.questionId}`);
      }
      answers.push(mcqCorrectionFromChoice(q, ans.choice, ans.confidence, attempt.locale));
    }
  }

  const geminiSlice = await geminiOpenAndComment(attempt, opens, generate, load);
  answers.push(...geminiSlice.answers);
  const result: AttemptCorrectionInput = {
    answers,
    generalComment: geminiSlice.generalComment,
  };
  screenModelStrings(
    result.generalComment,
    ...result.answers.flatMap((a) => [a.comment, a.explanation, a.correctAnswerSummary]),
  );
  return result;
}

async function fullGeminiCorrection(
  attempt: PendingReviewAttempt,
  generate: typeof generateJson,
  load: typeof loadPrompt,
): Promise<AttemptCorrectionInput> {
  const system = await load("quiz-correction");
  const user = JSON.stringify(correctionUserPayload(attempt), null, 2);
  const result = await generate<AttemptCorrectionInput>(system, user, {
    requiredKeys: ["answers", "generalComment"],
    tier: "cheap",
    stage: "corrector",
  });
  if (!Array.isArray(result.answers) || typeof result.generalComment !== "string") {
    throw new Error("Invalid correction payload from model");
  }
  screenModelStrings(
    result.generalComment,
    ...result.answers.flatMap((a) => [a.comment, a.explanation, a.correctAnswerSummary]),
  );
  return result;
}

async function geminiOpenAndComment(
  attempt: PendingReviewAttempt,
  opens: ReviewQuestionPayload[],
  generate: typeof generateJson,
  load: typeof loadPrompt,
): Promise<AttemptCorrectionInput> {
  const system = await load("quiz-correction");
  const user = JSON.stringify(
    {
      ...correctionUserPayload({ ...attempt, questions: opens }),
      note:
        opens.length === 0
          ? "All items were graded elsewhere. Return answers:[], and write generalComment only."
          : "Grade only the OPEN (and non-keyed) items listed. Write generalComment for the whole attempt.",
    },
    null,
    2,
  );
  const result = await generate<AttemptCorrectionInput>(system, user, {
    requiredKeys: ["answers", "generalComment"],
    tier: "cheap",
    stage: "corrector",
  });
  if (!Array.isArray(result.answers) || typeof result.generalComment !== "string") {
    throw new Error("Invalid correction payload from model");
  }
  return result;
}

function correctionUserPayload(attempt: PendingReviewAttempt): unknown {
  return {
    attemptId: attempt.attemptId,
    locale: attempt.locale,
    levelSlug: attempt.levelSlug,
    questions: attempt.questions.map((q) => ({
      questionId: q.questionId,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      referenceAnswer: q.referenceAnswer,
      selectedIndex: q.selectedIndex,
      openText: q.openText,
    })),
  };
}
