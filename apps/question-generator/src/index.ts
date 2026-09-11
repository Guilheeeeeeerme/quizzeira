import type {
  GenerationCompleteInput,
  GeneratedQuestionInput,
  InferredSyllabus,
  PendingGenerationAttempt,
} from "@quizzeira/shared";
import { preferBankOverColdGen } from "@quizzeira/shared";
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
import { countMetaMaterialStems } from "./meta-stem.js";

process.env.SERVICE_NAME ||= "quizzeira-questiongenerator";
const NAME = "question-generator";

function hasMaterialsPresent(attempt: PendingGenerationAttempt): boolean {
  const { attachments, links } = attempt.materials;
  return attachments.length > 0 || links.length > 0;
}

function inferencePayload(attempt: PendingGenerationAttempt) {
  return {
    locale: attempt.locale,
    topicId: attempt.topicId,
    topicTitle: attempt.topicTitle,
    presetSlug: attempt.presetSlug,
    guidelines: attempt.guidelines,
    focusText: attempt.focusText,
    materials: attempt.materials,
  };
}

function generationPayload(
  attempt: PendingGenerationAttempt,
  inferredSyllabus: InferredSyllabus,
  extras?: {
    bankAlreadySelected?: GeneratedQuestionInput[];
    coldMin?: number;
    coldMax?: number;
  },
) {
  return {
    locale: attempt.locale,
    topicId: attempt.topicId,
    topicTitle: attempt.topicTitle,
    presetSlug: attempt.presetSlug,
    guidelines: attempt.guidelines,
    focusText: attempt.focusText,
    durationMinutes: attempt.durationMinutes,
    inferredSyllabus,
    materials: attempt.materials,
    recentPerformance: attempt.recentPerformance,
    constraints:
      extras?.coldMin != null && extras?.coldMax != null
        ? {
            ...attempt.constraints,
            minQuestions: extras.coldMin,
            maxQuestions: extras.coldMax,
          }
        : attempt.constraints,
    bankAlreadySelected: extras?.bankAlreadySelected ?? [],
  };
}

async function ensureSyllabus(attempt: PendingGenerationAttempt): Promise<InferredSyllabus> {
  if (attempt.inferredSyllabus?.subjects?.length) {
    return attempt.inferredSyllabus;
  }

  const system = await loadPrompt("topic-inference");
  const user = JSON.stringify(inferencePayload(attempt), null, 2);
  const grounding = attempt.hasLinks && !hasMaterialsPresent(attempt);

  const inferred = await generateJson<InferredSyllabus>(system, user, {
    requiredKeys: ["subjects", "styleNotes", "difficultyNotes", "materialRoles"],
    grounding,
  });
  if (!Array.isArray(inferred.subjects) || inferred.subjects.length === 0) {
    throw new Error("Invalid topic-inference payload from model");
  }

  const normalized: InferredSyllabus = {
    subjects: inferred.subjects.map(String),
    styleNotes: String(inferred.styleNotes ?? ""),
    difficultyNotes: String(inferred.difficultyNotes ?? ""),
    seniority:
      inferred.seniority == null || String(inferred.seniority).trim() === ""
        ? null
        : String(inferred.seniority),
    materialRoles: Array.isArray(inferred.materialRoles)
      ? inferred.materialRoles.map(String)
      : [],
  };

  await dmzPost(`/internal/topics/${attempt.topicId}/inferred-syllabus`, normalized);
  console.log(
    `[${NAME}] inferred ${normalized.subjects.length} subjects for topic=${attempt.topicId}`,
  );
  return normalized;
}

async function generateQuestions(
  attempt: PendingGenerationAttempt,
  syllabus: InferredSyllabus,
  extraUserNote?: string,
  extras?: {
    bankAlreadySelected?: GeneratedQuestionInput[];
    coldMin?: number;
    coldMax?: number;
  },
): Promise<GenerationCompleteInput> {
  const system = await loadPrompt("question-generation");
  const payload = generationPayload(attempt, syllabus, extras);
  const user = extraUserNote
    ? `${JSON.stringify(payload, null, 2)}\n\nRETRY NOTE:\n${extraUserNote}`
    : JSON.stringify(payload, null, 2);

  const grounding = attempt.hasLinks && !hasMaterialsPresent(attempt);

  const result = await generateJson<GenerationCompleteInput>(system, user, {
    requiredKeys: ["questions"],
    grounding,
  });
  const minQuestions = extras?.coldMin ?? attempt.constraints.minQuestions;
  const maxQuestions = extras?.coldMax ?? attempt.constraints.maxQuestions;
  if (
    !Array.isArray(result.questions) ||
    result.questions.length < minQuestions ||
    result.questions.length > maxQuestions
  ) {
    throw new Error(
      `Invalid generation payload from model (want ${minQuestions}-${maxQuestions})`,
    );
  }
  return result;
}

function isExamPreset(slug: string | null): boolean {
  return slug === "open_exam" || slug === "vestibular" || slug === "certificacao";
}

async function sampleBank(
  attempt: PendingGenerationAttempt,
  syllabus: InferredSyllabus,
): Promise<{ questions: GeneratedQuestionInput[]; identity?: { examSlug: string } }> {
  if (!isExamPreset(attempt.presetSlug)) {
    return { questions: [] };
  }
  try {
    const result = await dmzPost<{
      questions: GeneratedQuestionInput[];
      identity?: { examSlug: string };
      hitCount?: number;
    }>("/internal/question-bank/sample", {
      topicTitle: attempt.topicTitle,
      guidelines: attempt.guidelines,
      focusText: attempt.focusText,
      subjects: syllabus.subjects,
      locale: attempt.locale,
      limit: attempt.constraints.maxQuestions,
    });
    return {
      questions: Array.isArray(result.questions) ? result.questions : [],
      identity: result.identity,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[${NAME}] question-bank sample failed: ${message}`);
    return { questions: [] };
  }
}

async function maybeSearchPastExams(
  attempt: PendingGenerationAttempt,
  syllabus: InferredSyllabus,
  examSlug?: string,
): Promise<void> {
  if (!isExamPreset(attempt.presetSlug)) return;
  try {
    const result = await dmzPost<{
      skipped?: boolean;
      reason?: string;
      upserted?: number;
      hits?: unknown[];
    }>("/internal/question-bank/search", {
      examSlug,
      topicTitle: attempt.topicTitle,
      guidelines: attempt.guidelines,
      emphasis: attempt.focusText,
      subjects: syllabus.subjects,
      locale: attempt.locale,
    });
    if (result.skipped) {
      console.log(`[${NAME}] past-exam search skipped: ${result.reason ?? "n/a"}`);
    } else {
      console.log(
        `[${NAME}] past-exam search upserted=${result.upserted ?? 0} hits=${result.hits?.length ?? 0}`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[${NAME}] past-exam search failed: ${message}`);
  }
}

async function depositBank(
  attempt: PendingGenerationAttempt,
  syllabus: InferredSyllabus,
  questions: GeneratedQuestionInput[],
): Promise<void> {
  if (!isExamPreset(attempt.presetSlug) || questions.length === 0) return;
  try {
    const result = await dmzPost<{ upserted: number; proposed?: boolean; proposalId?: string }>(
      "/internal/question-bank/deposit",
      {
        topicTitle: attempt.topicTitle,
        guidelines: attempt.guidelines,
        focusText: attempt.focusText,
        subjects: syllabus.subjects,
        locale: attempt.locale,
        questions,
        sourceKind: "llm",
      },
    );
    if (result.proposed) {
      console.log(
        `[${NAME}] staged bank deposit proposal=${result.proposalId} questions=${questions.length}`,
      );
    } else {
      console.log(`[${NAME}] deposited ${result.upserted} question(s) into bank`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[${NAME}] question-bank deposit failed: ${message}`);
  }
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
    logWarn("no LLM provider key configured, skipping", { worker: NAME });
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
    const syllabus = await ensureSyllabus(attempt);
    let bankSample = await sampleBank(attempt, syllabus);

    if (bankSample.questions.length < attempt.constraints.minQuestions) {
      await maybeSearchPastExams(attempt, syllabus, bankSample.identity?.examSlug);
      bankSample = await sampleBank(attempt, syllabus);
    }

    const { minQuestions, maxQuestions } = attempt.constraints;
    let cold: GeneratedQuestionInput[] = [];

    if (bankSample.questions.length < minQuestions) {
      const coldMin = Math.max(1, minQuestions - bankSample.questions.length);
      const coldMax = Math.max(coldMin, maxQuestions - bankSample.questions.length);
      const note =
        bankSample.questions.length > 0
          ? `bankAlreadySelected has ${bankSample.questions.length} curated item(s). Generate ONLY ${coldMin}-${coldMax} NEW subject-matter questions that do not duplicate those prompts.`
          : undefined;

      let result = await generateQuestions(attempt, syllabus, note, {
        bankAlreadySelected: bankSample.questions,
        coldMin,
        coldMax,
      });
      let metaCount = countMetaMaterialStems(result.questions);
      if (metaCount > 0) {
        console.warn(
          `[${NAME}] rejected ${metaCount} meta stem(s); retrying subject-matter only`,
        );
        result = await generateQuestions(
          attempt,
          syllabus,
          "Previous output quizzed the edital/vacancy PDF (organizadora, vagas, polos, CLT, ênfase lists). Produce ONLY subject-matter questions from the conteúdo programático / inferredSyllabus / focusText. Zero logistics.",
          {
            bankAlreadySelected: bankSample.questions,
            coldMin,
            coldMax,
          },
        );
        metaCount = countMetaMaterialStems(result.questions);
        if (metaCount > 0) {
          throw new Error(
            `Generation still contains ${metaCount} meta/material stem(s); refusing to store`,
          );
        }
      }
      cold = result.questions;
    }

    const merged = preferBankOverColdGen(bankSample.questions, cold, {
      minQuestions,
      maxQuestions,
    });

    if (merged.questions.length < minQuestions) {
      throw new Error(
        `Insufficient questions after bank+cold merge (have ${merged.questions.length}, need ${minQuestions})`,
      );
    }

    // Final meta check on bank-sourced stems too.
    const metaCount = countMetaMaterialStems(merged.questions);
    if (metaCount > 0) {
      throw new Error(
        `Merged set contains ${metaCount} meta/material stem(s); refusing to store`,
      );
    }

    console.log(
      `[${NAME}] bank=${merged.fromBank} cold=${merged.fromCold} total=${merged.questions.length}`,
    );

    await depositBank(attempt, syllabus, merged.questions);

    const completed = await dmzPost<{ attemptId: string; questionCount: number }>(
      `/internal/pills/${attempt.attemptId}/complete`,
      { questions: merged.questions },
    );
    logInfo("generated questions", {
      worker: NAME,
      questionCount: completed.questionCount,
      attemptId: completed.attemptId,
      mode: attempt.constraints.mode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("generation failed", {
      worker: NAME,
      code: llmErrorCode(err) ?? "unknown",
      err: message,
    });
    await dmzPost(`/internal/pills/${attempt.attemptId}/release`).catch((releaseErr) => {
      const releaseMessage =
        releaseErr instanceof Error ? releaseErr.message : String(releaseErr);
      logError("release failed", { worker: NAME, err: releaseMessage });
    });
  }
}

logInfo("starting", { worker: NAME, intervalMs: workerEnv.intervalMs });
void runLoop(NAME, workerEnv.intervalMs, tick);
