import type { PendingReviewAttempt } from "@quizzeira/shared";
import {
  checkProviderReadiness,
  dmzPost,
  hasLlmProvider,
  llmErrorCode,
  logError,
  logInfo,
  logWarn,
  runLoop,
  workerEnv,
} from "@quizzeira/worker-kit";
import { correctAttempt } from "./correct";

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
    const result = await correctAttempt(attempt);
    const completed = await dmzPost<{ attemptId: string; score: number }>(
      `/internal/reviews/${attempt.attemptId}/complete`,
      result,
    );
    logInfo("corrected attempt", {
      worker: NAME,
      attemptId: completed.attemptId,
      score: completed.score,
      event: "corrector_complete",
      jevCorrectorMode: workerEnv.jevCorrectorMode,
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

/** Startup readiness (§9): grading is provider-dependent end to end. */
checkProviderReadiness().then((readiness) => {
  if (!readiness.ready) {
    logWarn("provider readiness check failed at startup", {
      worker: NAME,
      event: "readiness_unhealthy",
      reason: readiness.reason,
      providers: readiness.providers,
    });
  } else {
    logInfo("provider readiness ok", { worker: NAME, providers: readiness.providers });
  }
});

void runLoop(NAME, workerEnv.intervalMs, tick);
