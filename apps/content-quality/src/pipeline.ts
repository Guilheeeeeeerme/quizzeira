// Concept: Eval (one pass over the draft queue)
import { llmErrorCode, logInfo, logWarn } from "@quizzeira/worker-kit";
import { contentApi } from "./client.js";
import { qualityEnv } from "./env.js";
import { decide } from "./gate.js";
import { judgeItem, type JudgeVerdict } from "./judge.js";
import { validateStructure } from "./structural.js";

const NAME = "content-quality";

interface PendingItem {
  id: string;
  examSlug: string;
  subject: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  origin?: "extraction" | "generation" | string | null;
}

export interface EvalPassResult {
  reviewed: number;
  published: number;
  failed: number;
  needsReview: number;
}

export async function runEvalPass(): Promise<EvalPassResult> {
  const result: EvalPassResult = { reviewed: 0, published: 0, failed: 0, needsReview: 0 };

  const { items } = await contentApi.get<{ items: PendingItem[] }>(
    `/internal/question-items/pending-review?limit=${qualityEnv.itemsPerPass}`,
  );

  for (const item of items) {
    const structural = validateStructure(item);

    // Only items that survived the deterministic gate cost a model call.
    let judge: JudgeVerdict | null = null;
    if (structural.ok) {
      try {
        judge = await judgeItem({
          examSlug: item.examSlug,
          subject: item.subject,
          type: item.type,
          prompt: item.prompt,
          options: item.options,
          correctIndex: item.correctIndex,
          referenceAnswer: item.referenceAnswer,
          explanation: item.explanation,
        });
      } catch (err) {
        const code = llmErrorCode(err);
        logWarn("judge unavailable", { worker: NAME, itemId: item.id, code });
        // Budget exhaustion means every remaining item would park in
        // needs_review; stop instead of flooding the HITL queue.
        if (code === "llm_budget_exceeded") break;
      }
    }

    const verdict = decide({
      structural,
      judge,
      correctIndex: item.correctIndex,
      thresholds: {
        publish: qualityEnv.publishThreshold,
        fail: qualityEnv.failThreshold,
      },
      publishExtractionWithoutJudge: qualityEnv.publishExtractionWithoutJudge,
      origin: item.origin,
    });

    await contentApi.post("/internal/question-items/verdict", {
      itemId: item.id,
      decision: verdict.decision,
      score: verdict.score,
      notes: verdict.notes,
      reasons: verdict.reasons,
      stage: judge
        ? "structural+judge"
        : verdict.decision === "published"
          ? "structural+extraction"
          : "structural",
      model: judge?.model ?? null,
    });

    result.reviewed += 1;
    if (verdict.decision === "published") result.published += 1;
    else if (verdict.decision === "failed") result.failed += 1;
    else result.needsReview += 1;
  }

  if (result.reviewed) logInfo("eval pass", { worker: NAME, ...result });
  return result;
}
