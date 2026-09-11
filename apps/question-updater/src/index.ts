import type { LevelSlug, QuestionUpdateCandidate, QuestionUpdateInput } from "@quizzeira/shared";
import {
  dmzGet,
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

process.env.SERVICE_NAME ||= "quizzeira-questionupdater";
const NAME = "question-updater";
const LEVELS: LevelSlug[] = [
  "beginner",
  "novice",
  "intermediate",
  "advanced",
  "pro",
];

interface ModernizeResult {
  shouldUpdate: boolean;
  prompt?: string;
  options?: string[] | null;
  correctIndex?: number | null;
  referenceAnswer?: string | null;
  explanation?: string | null;
  reason?: string;
}

interface RelevelResult {
  levelSlug?: LevelSlug;
  reason?: string;
}

function adjacentLevel(current: LevelSlug, proposed?: LevelSlug): LevelSlug {
  if (!proposed || !LEVELS.includes(proposed)) return current;
  const from = LEVELS.indexOf(current);
  const to = LEVELS.indexOf(proposed);
  if (to === from) return current;
  return LEVELS[from + Math.sign(to - from)]!;
}

async function tick(): Promise<void> {
  if (!hasLlmProvider()) {
    logWarn("no LLM provider key configured, skipping", { worker: NAME });
    return;
  }

  const { question } = await dmzGet<{ question: QuestionUpdateCandidate | null }>(
    "/internal/questions/next-for-update",
  );
  if (!question) {
    logInfo("no questions to update", { worker: NAME });
    return;
  }

  const [modernizePrompt, relevelPrompt] = await Promise.all([
    loadPrompt("question-modernization"),
    loadPrompt("difficulty-releveling"),
  ]);

  const payload = JSON.stringify(
    {
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      referenceAnswer: question.referenceAnswer,
      explanation: question.explanation,
      levelSlug: question.levelSlug,
      levels: question.levels,
      performance: question.performance,
    },
    null,
    2,
  );

  try {
    const modernize = await generateJson<ModernizeResult>(modernizePrompt, payload, {
      grounding: workerEnv.questionUpdateGrounding,
      requiredKeys: ["shouldUpdate"],
    });

    const relevel = await generateJson<RelevelResult>(relevelPrompt, payload);
    const nextLevel = adjacentLevel(question.levelSlug, relevel.levelSlug);

    const update: QuestionUpdateInput = {};
    if (modernize.shouldUpdate) {
      if (modernize.prompt) update.prompt = modernize.prompt;
      if (question.type === "MULTIPLE_CHOICE") {
        if (Array.isArray(modernize.options) && modernize.options.length === 4) {
          update.options = modernize.options;
        }
        if (
          typeof modernize.correctIndex === "number" &&
          modernize.correctIndex >= 0 &&
          modernize.correctIndex <= 3
        ) {
          update.correctIndex = modernize.correctIndex;
        }
        if (modernize.explanation) update.explanation = modernize.explanation;
      } else if (modernize.referenceAnswer) {
        update.referenceAnswer = modernize.referenceAnswer;
      }
    }
    if (nextLevel !== question.levelSlug) {
      update.levelSlug = nextLevel;
    }

    const reason = [modernize.reason, relevel.reason].filter(Boolean).join(" | ") || null;

    // Always HITL: never live-patch curriculum questions.
    const proposal = await dmzPost<{ id: string | null; reviewedOnly: boolean }>(
      `/internal/questions/${question.id}/proposals`,
      { proposedPatch: update, reason },
    );
    logInfo("reviewed question", {
      worker: NAME,
      questionId: question.id,
      proposalId: proposal.id ?? "none",
      reviewedOnly: proposal.reviewedOnly,
      updated: Boolean(modernize.shouldUpdate),
      level: nextLevel,
      grounding: workerEnv.questionUpdateGrounding,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("question skipped", {
      worker: NAME,
      code: llmErrorCode(err) ?? "unknown",
      err: message,
    });
  }
}

logInfo("starting", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  grounding: workerEnv.questionUpdateGrounding,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
