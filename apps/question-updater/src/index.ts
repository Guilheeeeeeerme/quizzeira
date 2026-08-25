import type { LevelSlug, QuestionUpdateCandidate, QuestionUpdateInput } from "@quiz-app/shared";
import {
  dmzGet,
  dmzPatch,
  generateJson,
  loadPrompt,
  runLoop,
  workerEnv,
} from "@quiz-app/worker-kit";

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
  if (!workerEnv.geminiApiKey) {
    console.warn(`[${NAME}] GEMINI_API_KEY not set, skipping`);
    return;
  }

  const { question } = await dmzGet<{ question: QuestionUpdateCandidate | null }>(
    "/internal/questions/next-for-update",
  );
  if (!question) {
    console.log(`[${NAME}] no questions to update`);
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

  const modernize = await generateJson<ModernizeResult>(modernizePrompt, payload, {
    googleSearch: true,
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

  await dmzPatch(`/internal/questions/${question.id}`, update);
  console.log(
    `[${NAME}] reviewed ${question.id} updated=${Boolean(modernize.shouldUpdate)} level=${nextLevel} modernize=${modernize.reason ?? ""} relevel=${relevel.reason ?? ""}`,
  );
}

console.log(
  `[${NAME}] starting model=${workerEnv.geminiModel} intervalMs=${workerEnv.intervalMs}`,
);
void runLoop(NAME, workerEnv.intervalMs, tick);
