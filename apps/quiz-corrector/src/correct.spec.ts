import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PendingReviewAttempt } from "@quizzeira/shared";
import {
  buildMcqQuestions,
  codeMcqCorrect,
  correctAttempt,
  isKeyedMcq,
  mcqCorrectionFromChoice,
} from "./correct";

const attempt: PendingReviewAttempt = {
  attemptId: "a1",
  levelSlug: "easy",
  levelLabel: "Easy",
  locale: "pt-BR",
  questions: [
    {
      questionId: "q1",
      type: "MULTIPLE_CHOICE",
      prompt: "2+2?",
      options: ["3", "4", "5"],
      correctIndex: 1,
      referenceAnswer: null,
      explanation: null,
      selectedIndex: 1,
      openText: null,
    },
    {
      questionId: "q2",
      type: "OPEN",
      prompt: "Explain gravity",
      options: null,
      correctIndex: null,
      referenceAnswer: "attraction",
      explanation: null,
      selectedIndex: null,
      openText: "pull",
    },
  ],
};

describe("corrector helpers", () => {
  it("detects keyed MCQ", () => {
    assert.equal(isKeyedMcq(attempt.questions[0]!), true);
    assert.equal(isKeyedMcq(attempt.questions[1]!), false);
    assert.equal(codeMcqCorrect(attempt.questions[0]!), true);
  });

  it("builds one Choice per MCQ", () => {
    const qs = buildMcqQuestions(attempt.questions.filter(isKeyedMcq));
    assert.deepEqual(Object.keys(qs), ["q1"]);
    assert.equal(qs.q1?.type, "choice");
  });

  it("maps JEV choice to AnswerCorrection", () => {
    const c = mcqCorrectionFromChoice(attempt.questions[0]!, "correct", 0.9, "pt-BR");
    assert.equal(c.isCorrect, true);
    assert.equal(c.grade, 1);
    assert.equal(c.comment, "Resposta correta.");
  });
});

describe("correctAttempt active", () => {
  it("uses JEV for MCQ and Gemini for open + comment", async () => {
    const result = await correctAttempt(attempt, {
      mode: "active",
      jev: async () =>
        ({
          answers: {
            q1: {
              type: "choice" as const,
              choice: "correct",
              probabilities: { correct: 0.9, incorrect: 0.1 },
              confidence: 0.9,
            },
          },
          meta: {
            task: "corrector" as const,
            provider: "jev" as const,
            mode: "active" as const,
            requestedModel: "jev-1.13.0",
            returnedModel: "jev-1.13.0",
            durationMs: 1,
            attempts: 1,
            usage: { inputTokens: 100, outputTokens: 0, totalTokens: 100 },
            estimatedUsd: 0.0000042,
            costStatus: "estimated" as const,
            errorCode: null,
          },
        }) as never,
      loadPromptFn: async () => "system",
      generate: async () => ({
        answers: [
          {
            questionId: "q2",
            grade: 0.5,
            isCorrect: false,
            comment: "Parcial",
          },
        ],
        generalComment: "Bom esforço.",
      }),
    });
    assert.equal(result.answers.length, 2);
    assert.equal(result.answers.find((a) => a.questionId === "q1")?.isCorrect, true);
    assert.equal(result.answers.find((a) => a.questionId === "q2")?.comment, "Parcial");
    assert.equal(result.generalComment, "Bom esforço.");
  });
});
