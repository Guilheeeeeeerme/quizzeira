import type {
  GenerationCompleteInput,
  PendingGenerationAttempt,
} from "@quizzeira/shared";
import {
  dmzPost,
  generateJson,
  hasLlmProvider,
  llmErrorCode,
  loadPrompt,
  runLoop,
  workerEnv,
} from "@quizzeira/worker-kit";

const NAME = "question-generator";

function hasMaterialExcerpts(attempt: PendingGenerationAttempt): boolean {
  const { attachments, links } = attempt.materials;
  return (
    attachments.some((a) => Boolean(a.excerpt?.trim())) ||
    links.some((l) => Boolean(l.excerpt?.trim()))
  );
}

async function tick(): Promise<void> {
  try {
    const purged = await dmzPost<{ deleted: number }>("/internal/topics/purge-stale");
    if (purged.deleted > 0) {
      console.log(`[${NAME}] purged ${purged.deleted} stale topic(s)`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[${NAME}] purge-stale failed: ${message}`);
  }

  if (!hasLlmProvider()) {
    console.warn(`[${NAME}] no LLM provider key configured, skipping`);
    return;
  }

  const { attempt } = await dmzPost<{ attempt: PendingGenerationAttempt | null }>(
    "/internal/pills/claim",
  );
  if (!attempt) {
    console.log(`[${NAME}] no pending pill generation`);
    return;
  }

  try {
    const system = await loadPrompt("question-generation");
    const user = JSON.stringify(
      {
        locale: attempt.locale,
        topicId: attempt.topicId,
        topicTitle: attempt.topicTitle,
        presetSlug: attempt.presetSlug,
        guidelines: attempt.guidelines,
        focusText: attempt.focusText,
        materials: attempt.materials,
        recentPerformance: attempt.recentPerformance,
        constraints: { minQuestions: 3, maxQuestions: 6 },
      },
      null,
      2,
    );

    // Never combine Google Search grounding with untrusted attachment/link excerpts (LLM01/LLM07).
    const grounding = attempt.hasLinks && !hasMaterialExcerpts(attempt);

    const result = await generateJson<GenerationCompleteInput>(system, user, {
      requiredKeys: ["questions"],
      grounding,
    });
    if (!Array.isArray(result.questions) || result.questions.length < 3) {
      throw new Error("Invalid generation payload from model");
    }

    const completed = await dmzPost<{ attemptId: string; questionCount: number }>(
      `/internal/pills/${attempt.attemptId}/complete`,
      { questions: result.questions },
    );
    console.log(
      `[${NAME}] generated ${completed.questionCount} questions for ${completed.attemptId} grounding=${grounding}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[${NAME}] generation failed: code=${llmErrorCode(err) ?? "unknown"} message=${message}`,
    );
    await dmzPost(`/internal/pills/${attempt.attemptId}/release`).catch((releaseErr) => {
      const releaseMessage =
        releaseErr instanceof Error ? releaseErr.message : String(releaseErr);
      console.error(`[${NAME}] release failed: ${releaseMessage}`);
    });
  }
}

console.log(`[${NAME}] starting intervalMs=${workerEnv.intervalMs}`);
void runLoop(NAME, workerEnv.intervalMs, tick);
