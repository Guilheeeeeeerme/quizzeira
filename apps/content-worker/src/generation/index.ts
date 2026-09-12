/**
 * Generation v2 — planner-driven leaf runs with brief + KU citations (§24).
 * CONTENT_GENERATION_MODE=fixture uses deterministic grounded items (no API keys).
 */
import {
  generateJson,
  hasLlmProvider,
  llmErrorCode,
  logInfo,
  logWarn,
  screenModelStrings,
} from "@quizzeira/worker-kit";
import type { GeneratedQuestionInput } from "@quizzeira/shared";
import { content } from "../clients.js";
import { contentEnv } from "../env.js";
import { buildGenerationBrief, type GenerationBrief } from "./brief.js";
import { fixtureGenerateFromBrief } from "./fixture.js";
import {
  buildBriefUserPrompt,
  buildGenerationPrompt,
  GENERATION_V2_SYSTEM,
  type RetrievedChunk,
} from "./prompt.js";
import { embedText } from "../embeddings/index.js";

const NAME = "content-worker/generation";

interface LeafQueueItem {
  examSlug: string;
  examTitle: string | null;
  org?: string | null;
  banca?: string | null;
  syllabusNodeId: string;
  canonicalKey: string;
  path: string[];
  title: string;
  rawText: string;
  deficit: number;
  knowledgeUnits: Array<{
    id: string;
    kind: string;
    statement: string;
    example: string | null;
    qualifiers: string[];
  }>;
}

interface LegacyQueueItem {
  examSlug: string;
  examTitle: string | null;
  deficit: number;
}

export interface GenerationPassResult {
  runs: number;
  drafted: number;
  failed: number;
  mode: "leaf" | "legacy-fallback" | "none";
}

export async function runGenerationPass(): Promise<GenerationPassResult> {
  const result: GenerationPassResult = { runs: 0, drafted: 0, failed: 0, mode: "none" };
  const mode = contentEnv.generationMode;

  if (mode !== "fixture" && !hasLlmProvider()) {
    logWarn("no LLM provider configured", { worker: NAME });
    return result;
  }

  // Prefer leaf/syllabus queue (§24.1). Fall back only when empty and legacy enabled.
  const leafQueue = await content
    .get<{ items: LeafQueueItem[] }>(
      `/internal/generation/leaf-queue?limit=${contentEnv.examsPerGenerationPass}` +
        `&minKu=${contentEnv.minKuPerLeaf}`,
    )
    .catch(() => ({ items: [] as LeafQueueItem[] }));

  if (leafQueue.items.length > 0) {
    result.mode = "leaf";
    for (const item of leafQueue.items) {
      const count = Math.min(contentEnv.questionsPerGenerationRun, item.deficit);
      if (count <= 0) continue;
      result.runs += 1;
      try {
        result.drafted += await generateForLeaf(item, count, mode);
      } catch (err) {
        result.failed += 1;
        logWarn("leaf generation failed", {
          worker: NAME,
          syllabusNodeId: item.syllabusNodeId,
          code: llmErrorCode(err),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (result.runs) logInfo("generation pass", { worker: NAME, ...result });
    return result;
  }

  if (!contentEnv.allowLegacyExamGeneration) {
    logInfo("no leaf targets; legacy exam queue disabled", { worker: NAME });
    return result;
  }

  // Transitional fallback — never uses subject label "geral".
  result.mode = "legacy-fallback";
  const { items } = await content.get<{ items: LegacyQueueItem[] }>(
    `/internal/generation/queue?limit=${contentEnv.examsPerGenerationPass}` +
      `&target=${contentEnv.publishedTargetPerExam}`,
  );

  for (const item of items) {
    const count = Math.min(contentEnv.questionsPerGenerationRun, item.deficit);
    if (count <= 0) continue;
    result.runs += 1;
    try {
      result.drafted += await generateForExamLegacy(item, count, mode);
    } catch (err) {
      result.failed += 1;
      logWarn("legacy generation failed", {
        worker: NAME,
        examSlug: item.examSlug,
        code: llmErrorCode(err),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (result.runs) logInfo("generation pass", { worker: NAME, ...result });
  return result;
}

async function generateForLeaf(
  item: LeafQueueItem,
  count: number,
  mode: "fixture" | "llm",
): Promise<number> {
  const subject = item.path[0] || item.title;
  const { run } = await content.post<{ run: { id: string } }>("/internal/generation/runs", {
    examSlug: item.examSlug,
    subject,
    syllabusNodeId: item.syllabusNodeId,
    requested: count,
    promptVersion: "generation.v2",
  });

  try {
    const brief = buildGenerationBrief({
      examTitle: item.examTitle ?? item.examSlug,
      org: item.org,
      banca: item.banca,
      path: item.path.length ? item.path : [item.title],
      rawText: item.rawText || item.title,
      knowledgeUnits: item.knowledgeUnits,
      count,
    });

    if (brief.knowledge.length < contentEnv.minKuPerLeaf) {
      await content.patch(`/internal/generation/runs/${run.id}`, {
        status: "partial",
        drafted: 0,
        chunksUsed: 0,
        finishedAt: new Date().toISOString(),
        error: "insufficient_knowledge_units",
      });
      return 0;
    }

    const questions = await produceQuestions(brief, mode);
    for (const q of questions) {
      screenModelStrings(q.prompt, q.explanation, ...(q.options ?? []));
    }

    const drafted = questions.length
      ? await content.post<{ created: number }>("/internal/question-items/draft", {
          examSlug: item.examSlug,
          subject,
          locale: "pt",
          origin: "generation",
          generationRunId: run.id,
          syllabusNodeId: item.syllabusNodeId,
          canonicalKey: item.canonicalKey,
          questions: questions.map((q) => ({
            ...q,
            knowledgeUnitIds: (q as { knowledgeUnitIds?: string[] }).knowledgeUnitIds ?? [],
          })),
        })
      : { created: 0 };

    await content.patch(`/internal/generation/runs/${run.id}`, {
      status: drafted.created > 0 ? "ok" : "partial",
      drafted: drafted.created,
      chunksUsed: brief.knowledge.length,
      finishedAt: new Date().toISOString(),
    });
    return drafted.created;
  } catch (err) {
    await content
      .patch(`/internal/generation/runs/${run.id}`, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        finishedAt: new Date().toISOString(),
      })
      .catch(() => undefined);
    throw err;
  }
}

async function produceQuestions(
  brief: GenerationBrief,
  mode: "fixture" | "llm",
): Promise<Array<GeneratedQuestionInput & { knowledgeUnitIds?: string[] }>> {
  if (mode === "fixture") {
    return fixtureGenerateFromBrief(brief).questions;
  }

  const response = await generateJson<{ questions: unknown }>(
    GENERATION_V2_SYSTEM,
    buildBriefUserPrompt(brief),
    { temperature: 0.4, requiredKeys: ["questions"] },
  );
  return normalizeQuestions(response.questions, brief.knowledge.map((k) => k.id));
}

async function generateForExamLegacy(
  item: LegacyQueueItem,
  count: number,
  mode: "fixture" | "llm",
): Promise<number> {
  const subject = "conhecimento";
  const { run } = await content.post<{ run: { id: string } }>("/internal/generation/runs", {
    examSlug: item.examSlug,
    subject,
    requested: count,
    promptVersion: "generation.v2-legacy",
  });

  try {
    if (mode === "fixture") {
      await content.patch(`/internal/generation/runs/${run.id}`, {
        status: "ok",
        drafted: 0,
        chunksUsed: 0,
        finishedAt: new Date().toISOString(),
        error: "fixture_requires_leaf_brief",
      });
      return 0;
    }

    const chunks = await retrieveChunks(item, subject);
    if (chunks.length === 0) {
      await content.patch(`/internal/generation/runs/${run.id}`, {
        status: "ok",
        drafted: 0,
        chunksUsed: 0,
        finishedAt: new Date().toISOString(),
      });
      return 0;
    }

    const prompt = buildGenerationPrompt({
      examSlug: item.examSlug,
      examTitle: item.examTitle,
      subject,
      locale: "pt",
      count,
      chunks,
    });

    const response = await generateJson<{ questions: unknown }>(
      GENERATION_V2_SYSTEM,
      prompt,
      { temperature: 0.4, requiredKeys: ["questions"] },
    );
    const questions = normalizeQuestions(response.questions);
    for (const q of questions) {
      screenModelStrings(q.prompt, q.explanation, ...(q.options ?? []));
    }

    const drafted = questions.length
      ? await content.post<{ created: number }>("/internal/question-items/draft", {
          examSlug: item.examSlug,
          subject,
          locale: "pt",
          origin: "generation",
          generationRunId: run.id,
          questions,
        })
      : { created: 0 };

    await content.patch(`/internal/generation/runs/${run.id}`, {
      status: drafted.created > 0 ? "ok" : "partial",
      drafted: drafted.created,
      chunksUsed: chunks.length,
      finishedAt: new Date().toISOString(),
    });
    return drafted.created;
  } catch (err) {
    await content
      .patch(`/internal/generation/runs/${run.id}`, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        finishedAt: new Date().toISOString(),
      })
      .catch(() => undefined);
    throw err;
  }
}

async function retrieveChunks(item: LegacyQueueItem, subject: string): Promise<RetrievedChunk[]> {
  const query = [item.examTitle ?? item.examSlug, subject, "conceitos regras exemplos definição"]
    .filter(Boolean)
    .join(" — ");
  const embedding = await embedText(query);
  const { matches } = await content.post<{ matches: RetrievedChunk[] }>(
    "/internal/chunks/search",
    { embedding, examSlug: item.examSlug, limit: contentEnv.retrievalTopK },
  );
  return matches;
}

export function normalizeQuestions(
  raw: unknown,
  allowedKuIds: string[] = [],
): Array<GeneratedQuestionInput & { knowledgeUnitIds?: string[] }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<GeneratedQuestionInput & { knowledgeUnitIds?: string[] }> = [];
  const allowed = new Set(allowedKuIds);

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
    if (prompt.length < 20) continue;

    const options = Array.isArray(record.options)
      ? record.options.map((o) => String(o).trim()).filter(Boolean)
      : [];
    if (options.length < 2) continue;

    const correctIndex = Number(record.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      continue;
    }

    let knowledgeUnitIds = Array.isArray(record.knowledgeUnitIds)
      ? record.knowledgeUnitIds.map(String)
      : [];
    if (allowed.size > 0) {
      knowledgeUnitIds = knowledgeUnitIds.filter((id) => allowed.has(id));
    }

    out.push({
      type: "MULTIPLE_CHOICE",
      prompt,
      options,
      correctIndex,
      referenceAnswer: null,
      explanation:
        typeof record.explanation === "string" ? record.explanation.trim() || null : null,
      knowledgeUnitIds,
    });
  }

  return out;
}
