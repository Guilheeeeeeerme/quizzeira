import type { AttemptCorrectionInput, PendingReviewAttempt } from "@quizzeira/shared";
import {
  dmzPost,
  generateJson,
  hasLlmProvider,
  llmErrorCode,
  loadPrompt,
  logError,
  logInfo,
  logWarn,
  runLoop,
  workerEnv,
} from "@quizzeira/worker-kit";

process.env.SERVICE_NAME ||= "quizzeira-quizcorrector";
const NAME = "quiz-corrector";

async function tick(): Promise<void> {
  if (!hasLlmProvider()) {
    logWarn("no LLM provider key configured, skipping", { worker: NAME });
    return;
  }

  const { attempt } = await dmzPost<{ attempt: PendingReviewAttempt | null }>(
    "/internal/reviews/claim",
  );
  if (!attempt) {
    logInfo("no pending reviews", { worker: NAME });
    return;
  }

  try {
    const system = await loadPrompt("quiz-correction");
    const user = JSON.stringify(
      {
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
      },
      null,
      2,
    );

    const result = await generateJson<AttemptCorrectionInput>(system, user, {
      requiredKeys: ["answers", "generalComment"],
    });
    if (!Array.isArray(result.answers) || typeof result.generalComment !== "string") {
      throw new Error("Invalid correction payload from model");
    }

    const completed = await dmzPost<{ attemptId: string; score: number }>(
      `/internal/reviews/${attempt.attemptId}/complete`,
      result,
    );
    logInfo("corrected attempt", {
      worker: NAME,
      attemptId: completed.attemptId,
      score: completed.score,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("correction failed", {
      worker: NAME,
      code: llmErrorCode(err) ?? "unknown",
      err: message,
      attemptId: attempt.attemptId,
    });
    await dmzPost(`/internal/reviews/${attempt.attemptId}/release`).catch((releaseErr) => {
      const releaseMessage =
        releaseErr instanceof Error ? releaseErr.message : String(releaseErr);
      logError("release failed", { worker: NAME, err: releaseMessage });
    });
  }
}

logInfo("starting", { worker: NAME, intervalMs: workerEnv.intervalMs });
void runLoop(NAME, workerEnv.intervalMs, tick);
