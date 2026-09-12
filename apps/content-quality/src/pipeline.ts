// Concept: Eval (one pass over the draft queue)
import { llmErrorCode, logInfo, logWarn } from "@quizzeira/worker-kit";
import { contentApi } from "./client.js";
import { qualityEnv } from "./env.js";
import { validateGrounding } from "./grounding.js";
import { decide } from "./gate.js";
import { judgeItem, type JudgeVerdict } from "./judge.js";
import { validateRelevance } from "./relevance.js";
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
  origin?: "extraction" | "generation" | "transcription" | string | null;
  knowledgeUnitIds?: string[] | null;
  syllabusNodeId?: string | null;
  passage?: string | null;
  distractorRationale?: string[] | null;
}

export interface EvalPassResult {
  reviewed: number;
  published: number;
  failed: number;
  needsReview: number;
}

function ladderStage(
  structuralOk: boolean,
  relevanceOk: boolean | null,
  groundingOk: boolean | null,
  judge: JudgeVerdict | null,
): string {
  if (judge) return "structural+relevance+grounding+judge";
  if (!structuralOk) return "structural";
  if (relevanceOk === false) return "structural+relevance";
  if (groundingOk === false) return "structural+relevance+grounding";
  return "structural+relevance+grounding";
}

async function loadGroundingContext(item: PendingItem): Promise<{
  statements: string[];
  allowedIds: string[];
  path: string[];
  leafValid: boolean | null;
  previousStems: string[];
  leafStems: string[];
}> {
  const kuIds = (item.knowledgeUnitIds ?? []).filter(Boolean);
  let statements: string[] = [];
  let allowedIds: string[] = [];
  let path: string[] = [];
  let leafValid: boolean | null = null;
  let previousStems: string[] = [];
  let leafStems: string[] = [];

  if (item.syllabusNodeId) {
    try {
      const nodeInfo = await contentApi.get<{
        node: { id: string } | null;
        isLeaf: boolean;
        path: string[];
      }>(`/internal/syllabus-nodes/${encodeURIComponent(item.syllabusNodeId)}`);
      leafValid = Boolean(nodeInfo.node && nodeInfo.isLeaf);
      path = nodeInfo.path ?? [];
      const { units } = await contentApi.get<{
        units: Array<{ id: string; statement: string }>;
      }>(
        `/internal/knowledge-units?syllabusNodeId=${encodeURIComponent(item.syllabusNodeId)}&limit=50`,
      );
      allowedIds = units.map((u) => u.id);
    } catch {
      leafValid = false;
    }
    try {
      const { stems } = await contentApi.get<{ stems: string[] }>(
        `/internal/question-items/stems?syllabusNodeId=${encodeURIComponent(item.syllabusNodeId)}&limit=40`,
      );
      leafStems = (stems ?? []).filter((s) => s && s !== item.prompt);
    } catch {
      leafStems = [];
    }
  }

  try {
    const { stems } = await contentApi.get<{ stems: string[] }>(
      `/internal/previous-questions/stems?examFamily=${encodeURIComponent(item.examSlug)}&limit=40`,
    );
    previousStems = stems ?? [];
  } catch {
    previousStems = [];
  }

  if (kuIds.length > 0) {
    try {
      const { units } = await contentApi.get<{
        units: Array<{ id: string; statement: string }>;
      }>(`/internal/knowledge-units?ids=${kuIds.map(encodeURIComponent).join(",")}`);
      statements = units.map((u) => u.statement).filter(Boolean);
    } catch {
      statements = [];
    }
  }

  return { statements, allowedIds, path, leafValid, previousStems, leafStems };
}

export async function runEvalPass(): Promise<EvalPassResult> {
  const result: EvalPassResult = { reviewed: 0, published: 0, failed: 0, needsReview: 0 };

  const { items } = await contentApi.get<{ items: PendingItem[] }>(
    `/internal/question-items/pending-review?limit=${qualityEnv.itemsPerPass}`,
  );

  for (const item of items) {
    const requiresPassage = /interpreta[cç][aã]o|compreens[aã]o de texto/i.test(item.subject);
    const structural = validateStructure({
      ...item,
      origin: item.origin,
      passage: item.passage,
      requiresPassage,
      distractorRationale: item.distractorRationale,
      knowledgeUnitIds: item.knowledgeUnitIds,
    });
    const ctx =
      structural.ok
        ? await loadGroundingContext(item)
        : {
            statements: [],
            allowedIds: [],
            path: [] as string[],
            leafValid: null as boolean | null,
            previousStems: [] as string[],
            leafStems: [] as string[],
          };

    const relevance = structural.ok
      ? validateRelevance({
          origin: item.origin,
          prompt: item.prompt,
          options: item.options,
          explanation: item.explanation,
          knowledgeUnitIds: item.knowledgeUnitIds,
          syllabusNodeId: item.syllabusNodeId,
          syllabusLeafValid: ctx.leafValid,
          previousQuestionStems: ctx.previousStems,
          leafStems: ctx.leafStems,
        })
      : null;

    const grounding =
      structural.ok && relevance?.ok
        ? validateGrounding({
            origin: item.origin,
            knowledgeUnitIds: item.knowledgeUnitIds,
            allowedKnowledgeUnitIds: ctx.allowedIds.length ? ctx.allowedIds : null,
            knowledgeUnitStatements: ctx.statements,
            prompt: item.prompt,
            options: item.options,
            correctIndex: item.correctIndex,
          })
        : null;

    let judge: JudgeVerdict | null = null;
    if (structural.ok && relevance?.ok && grounding?.ok) {
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
          syllabusPath: ctx.path.length ? ctx.path : null,
          knowledgeUnitStatements: ctx.statements.length ? ctx.statements : null,
        });
      } catch (err) {
        const code = llmErrorCode(err);
        logWarn("judge unavailable", { worker: NAME, itemId: item.id, code });
        if (code === "llm_budget_exceeded") break;
      }
    }

    let verdict = decide({
      structural,
      relevance,
      grounding,
      judge,
      correctIndex: item.correctIndex,
      thresholds: {
        publish: qualityEnv.publishThreshold,
        fail: qualityEnv.failThreshold,
      },
      publishExtractionWithoutJudge: qualityEnv.publishExtractionWithoutJudge,
      origin: item.origin,
    });

    // Soft temporal flags → needs_review rather than publish (§25.2).
    if (
      verdict.decision === "published" &&
      relevance?.reviewReasons?.includes("temporally_dependent")
    ) {
      verdict = {
        decision: "needs_review",
        score: verdict.score,
        reasons: [...verdict.reasons, "temporally_dependent"],
        notes: "temporal dependence without stable legal citation",
      };
    }

    await contentApi.post("/internal/question-items/verdict", {
      itemId: item.id,
      decision: verdict.decision,
      score: verdict.score,
      notes: verdict.notes,
      reasons: verdict.reasons,
      stage:
        verdict.decision === "published" &&
        !judge &&
        qualityEnv.publishExtractionWithoutJudge &&
        (item.origin === "extraction" || item.origin === "transcription")
          ? "structural+relevance+grounding+extraction"
          : ladderStage(structural.ok, relevance?.ok ?? null, grounding?.ok ?? null, judge),
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
