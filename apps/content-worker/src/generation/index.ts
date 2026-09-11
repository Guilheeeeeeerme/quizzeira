// Concept: Generation (grounded draft questions from retrieved chunks)
//
// Retrieval here is genuine RAG: embed a subject query, k-NN over chunk vectors,
// feed the hits to the model. Note this is the *only* place retrieval happens —
// the study runtime samples finished questions and never retrieves.
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
import { embedText } from "../embeddings/index.js";
import {
  buildGenerationPrompt,
  GENERATION_SYSTEM_PROMPT,
  type RetrievedChunk,
} from "./prompt.js";

const NAME = "content-worker/generation";

interface QueueItem {
  examSlug: string;
  examTitle: string | null;
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

  const { items } = await content.get<{ items: QueueItem[] }>(
    `/internal/generation/queue?limit=${contentEnv.examsPerGenerationPass}` +
      `&target=${contentEnv.publishedTargetPerExam}`,
  );

  for (const item of items) {
    const count = Math.min(contentEnv.questionsPerGenerationRun, item.deficit);
    if (count <= 0) continue;
    result.runs += 1;
    try {
      const drafted = await generateForExam(item, count);
      result.drafted += drafted;
    } catch (err) {
      result.failed += 1;
      logWarn("generation run failed", {
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

async function generateForExam(item: QueueItem, count: number): Promise<number> {
  const subject = "geral";
  const { run } = await content.post<{ run: { id: string } }>("/internal/generation/runs", {
    examSlug: item.examSlug,
    subject,
    requested: count,
  });

  try {
    const chunks = await retrieveChunks(item, subject);
    if (chunks.length === 0) {
      // No embedded material yet: the embedding pass has not caught up. Not an
      // error — the run closes empty and the queue will offer it again.
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
      GENERATION_SYSTEM_PROMPT,
      prompt,
      { temperature: 0.4, requiredKeys: ["questions"] },
    );
    const questions = normalizeQuestions(response.questions);

    // Output-side guardrail (OWASP LLM10) before anything is persisted.
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

async function retrieveChunks(item: QueueItem, subject: string): Promise<RetrievedChunk[]> {
  const query = [item.examTitle ?? item.examSlug, subject, "conteúdo programático e requisitos"]
    .filter(Boolean)
    .join(" — ");
  const embedding = await embedText(query);
  const { matches } = await content.post<{ matches: RetrievedChunk[] }>(
    "/internal/chunks/search",
    { embedding, examSlug: item.examSlug, limit: contentEnv.retrievalTopK },
  );
  return matches;
}

/**
 * Model output is untrusted shape-wise too: drop anything that is not a
 * well-formed multiple-choice item rather than letting Eval reject it later.
 */
export function normalizeQuestions(raw: unknown): GeneratedQuestionInput[] {
  if (!Array.isArray(raw)) return [];
  const out: GeneratedQuestionInput[] = [];

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

    out.push({
      type: "MULTIPLE_CHOICE",
      prompt,
      options,
      correctIndex,
      referenceAnswer: null,
      explanation:
        typeof record.explanation === "string" ? record.explanation.trim() || null : null,
    });
  }

  return out;
}
