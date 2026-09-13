// Concept: Generation — syllabus-leaf unit of work (§24).
// Exam-level subject="geral" generation has been removed (§48.8).

import {
  generateJson,
  hasLlmProvider,
  llmErrorCode,
  logInfo,
  logWarn,
  screenModelStrings,
} from "@quizzeira/worker-kit";
import { parseGeneratedQuestionsV2 } from "@quizzeira/shared";
import { content } from "../clients.js";
import { contentEnv } from "../env.js";
import { buildGenerationBrief } from "./brief.js";
import { buildGenerationPromptV2, GENERATION_SYSTEM_PROMPT_V2 } from "./prompt.js";

const NAME = "content-worker/generation";

interface PlannerQueueItem {
  examSlug: string;
  examTitle: string | null;
  syllabusNodeId: string;
  subject: string;
  pathSlug: string;
  rawText: string;
  path: string[];
  deficit: number;
}

export interface GenerationPassResult {
  runs: number;
  drafted: number;
  failed: number;
}

export async function runGenerationPass(): Promise<GenerationPassResult> {
  const result: GenerationPassResult = { runs: 0, drafted: 0, failed: 0 };
  if (!hasLlmProvider()) {
    logWarn("no LLM provider configured", { worker: NAME });
    return result;
  }

  const { items } = await content.get<{ items: PlannerQueueItem[] }>(
    `/internal/generation/planner-queue?limit=${contentEnv.examsPerGenerationPass}` +
      `&target=${contentEnv.publishedTargetPerExam}&minKu=4`,
  );

  for (const item of items) {
    const count = Math.min(contentEnv.questionsPerGenerationRun, item.deficit);
    if (count <= 0 || !item.syllabusNodeId) continue;
    if (!item.subject?.trim() || item.subject.trim().toLowerCase() === "geral") continue;
    result.runs += 1;
    try {
      result.drafted += await generateForLeaf(item, count);
    } catch (err) {
      result.failed += 1;
      logWarn("generation run failed", {
        worker: NAME,
        examSlug: item.examSlug,
        syllabusNodeId: item.syllabusNodeId,
        code: llmErrorCode(err),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (result.runs) logInfo("generation pass v2", { worker: NAME, ...result });
  return result;
}

async function generateForLeaf(item: PlannerQueueItem, count: number): Promise<number> {
  const { run } = await content.post<{ run: { id: string } }>("/internal/generation/runs", {
    examSlug: item.examSlug,
    subject: item.subject,
    syllabusNodeId: item.syllabusNodeId,
    requested: count,
    promptVersion: "generation.v2",
  });

  try {
    const { units } = await content.get<{
      units: Array<{
        id: string;
        kind: string;
        statement: string;
        example: string | null;
        qualifiers: string[];
        sourceDomain?: string | null;
      }>;
    }>(
      `/internal/knowledge-units?syllabusNodeId=${encodeURIComponent(item.syllabusNodeId)}&limit=24`,
    );

    if (units.length === 0) {
      await finishRun(run.id, 0, 0, "partial");
      return 0;
    }

    const { stems } = await content.get<{ stems: string[] }>(
      `/internal/question-items/stems?syllabusNodeId=${encodeURIComponent(item.syllabusNodeId)}&limit=20`,
    );

    const subjectKey = item.path?.[0] || item.subject;
    const [{ profile }, { exemplars }] = await Promise.all([
      content
        .get<{ profile: Record<string, unknown> | null }>(
          `/internal/style-profiles?examSlug=${encodeURIComponent(item.examSlug)}` +
            `&canonicalSubjectId=${encodeURIComponent(subjectKey)}`,
        )
        .catch(() => ({ profile: null })),
      content
        .get<{
          exemplars: Array<{
            id?: string;
            stem: string;
            options: string[];
            note: "formato apenas";
          }>;
        }>(
          `/internal/previous-questions/stems?examFamily=${encodeURIComponent(item.examSlug)}` +
            `&syllabusNodeId=${encodeURIComponent(item.syllabusNodeId)}&limit=10`,
        )
        .catch(() => ({ exemplars: [] })),
    ]);

    const brief = buildGenerationBrief({
      examTitle: item.examTitle ?? item.examSlug,
      examSlug: item.examSlug,
      syllabusNodeId: item.syllabusNodeId,
      path: item.path,
      rawText: item.rawText,
      knowledgeUnits: units,
      existingStems: stems,
      count,
      style: profile as never,
      exemplars,
    });

    await content
      .put(`/internal/generation/runs/${run.id}/brief`, { brief })
      .catch(() => undefined);

    const prompt = buildGenerationPromptV2(brief);
    const kuIds = brief.knowledge.map((u) => u.id);

    let questions = await generateAndParse(prompt, item.syllabusNodeId, kuIds, 0, "mid");
    // §24.7: shape failure → one retry at next model tier.
    if (questions.length === 0) {
      questions = await generateAndParse(prompt, item.syllabusNodeId, kuIds, 1, "strong");
    }

    for (const q of questions) {
      screenModelStrings(q.prompt, q.explanation, ...(q.options ?? []));
    }

    // §30: previousQuestionId is transcription/OAB provenance only — never send it
    // on generation drafts (API also soft-strips any non-transcription leak).
    const drafted = questions.length
      ? await content.post<{ created: number }>("/internal/question-items/draft", {
          examSlug: item.examSlug,
          subject: item.subject,
          locale: "pt",
          origin: "generation",
          syllabusNodeId: item.syllabusNodeId,
          knowledgeUnitIds: questions[0]?.knowledgeUnitIds ?? kuIds.slice(0, 3),
          generationRunId: run.id,
          previousQuestionId: null,
          questions: questions.map((q) => ({ ...q, previousQuestionId: null })),
        })
      : { created: 0 };

    // §24.7: if shape retry still yields nothing, flag cited KUs as suspect.
    if (questions.length === 0 && kuIds.length > 0) {
      await content
        .post("/internal/knowledge-units/flag-suspect", { ids: kuIds, reason: "ku_suspect" })
        .catch(() => undefined);
    }

    await finishRun(run.id, drafted.created, units.length, drafted.created > 0 ? "ok" : "partial");
    return drafted.created;
  } catch (err) {
    await finishRun(run.id, 0, 0, "failed", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

async function generateAndParse(
  prompt: string,
  syllabusNodeId: string,
  kuIds: string[],
  attempt: number,
  tier: "mid" | "strong",
) {
  const response = await generateJson<{ questions: unknown }>(
    GENERATION_SYSTEM_PROMPT_V2,
    prompt,
    {
      temperature: 0.4,
      requiredKeys: ["questions"],
      tier,
      attempt,
      stage: "generation",
    },
  );
  return normalizeQuestionsV2(response.questions, syllabusNodeId, kuIds);
}

async function finishRun(
  runId: string,
  drafted: number,
  chunksUsed: number,
  status: string,
  error?: string,
): Promise<void> {
  await content.patch(`/internal/generation/runs/${runId}`, {
    status,
    drafted,
    chunksUsed,
    error: error?.slice(0, 500),
    finishedAt: new Date().toISOString(),
  });
}

/** @deprecated Prefer parseGeneratedQuestionsV2 from @quizzeira/shared. */
export function normalizeQuestionsV2(
  raw: unknown,
  syllabusNodeId: string,
  allowedKuIds: string[],
) {
  return parseGeneratedQuestionsV2(raw, syllabusNodeId, allowedKuIds);
}
