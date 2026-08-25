import type { AttemptCorrectionInput, PendingReviewAttempt } from "@quiz-app/shared";
import {
  dmzPost,
  generateJson,
  loadPrompt,
  runLoop,
  workerEnv,
} from "@quiz-app/worker-kit";

const NAME = "quiz-corrector";

async function tick(): Promise<void> {
  if (!workerEnv.geminiApiKey) {
    console.warn(`[${NAME}] GEMINI_API_KEY not set, skipping`);
    return;
  }

  const { attempt } = await dmzPost<{ attempt: PendingReviewAttempt | null }>(
    "/internal/reviews/claim",
  );
  if (!attempt) {
    console.log(`[${NAME}] no pending reviews`);
    return;
  }

  try {
    const system = await loadPrompt("quiz-correction");
    const user = JSON.stringify(
      {
        attemptId: attempt.attemptId,
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
      },
      null,
      2,
    );

    const result = await generateJson<AttemptCorrectionInput>(system, user);
    if (!Array.isArray(result.answers) || typeof result.generalComment !== "string") {
      throw new Error("Invalid correction payload from model");
    }

    const completed = await dmzPost<{ attemptId: string; score: number }>(
      `/internal/reviews/${attempt.attemptId}/complete`,
      result,
    );
    console.log(
      `[${NAME}] corrected ${completed.attemptId} score=${completed.score}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${NAME}] correction failed: ${message}`);
    await dmzPost(`/internal/reviews/${attempt.attemptId}/release`).catch((releaseErr) => {
      const releaseMessage =
        releaseErr instanceof Error ? releaseErr.message : String(releaseErr);
      console.error(`[${NAME}] release failed: ${releaseMessage}`);
    });
  }
}

console.log(
  `[${NAME}] starting model=${workerEnv.geminiModel} intervalMs=${workerEnv.intervalMs}`,
);
void runLoop(NAME, workerEnv.intervalMs, tick);
