// Concept: Syllabus mapping tier 3 — residue for ambiguous lexical scores (§21.3).
//
// Owner (JEV audit plan §4): batched JEV Choice — one question per ambiguous
// chunk over a shared state of ≤12 candidate leaves, with an explicit "none"
// option. Staged by JEV_MAPPING_MODE: `off` keeps Gemini JSON, `shadow` logs
// JEV beside Gemini, `active` decides with JEV only (no Gemini substitute).

import { createHash } from "node:crypto";
import {
  generateJson,
  hasLlmProvider,
  jevDecide,
  jevModeFor,
  jevShadow,
  topChoice,
  type JevChoiceQuestion,
  type JevMode,
} from "@quizzeira/worker-kit";
import type { KnowledgeChunkDraft } from "./chunker.js";
import type { ChunkMapResult, SyllabusLeafRef } from "./mapping.js";
import type { ShadowLog } from "../classify-llm.js";

const PROMPT_VERSION = "map-t3-v1";
export const MAPPING_RUBRIC_VERSION = "map-t3-jev-v1";
/** Ambiguity band handed to tier 3 (§21.3). */
export const AMBIGUOUS_BAND: readonly [number, number] = [0.45, 0.62];
export const MAX_CHUNKS_PER_BATCH = 8;
export const MAX_LEAF_CANDIDATES = 12;
/** Minimum confidence for a residue assignment to count. */
const MIN_CONFIDENCE = 0.6;
export const NONE_OPTION = "none";

export interface MappingAssignment {
  chunkIndex: number;
  leafIndex: number | null;
  confidence: number;
}

export interface MappingResidueDeps {
  generate?: typeof generateJson;
  jev?: typeof jevDecide;
  mode?: JevMode;
  hasProvider?: () => boolean;
  log?: ShadowLog;
}

export function selectAmbiguous(
  chunks: KnowledgeChunkDraft[],
  existing: ChunkMapResult[],
): KnowledgeChunkDraft[] {
  const best = new Map<number, number>();
  for (const m of existing) {
    const prev = best.get(m.chunkOrdinal) ?? 0;
    if (m.score > prev) best.set(m.chunkOrdinal, m.score);
  }
  return chunks
    .filter((c) => {
      const score = best.get(c.ordinal) ?? 0;
      return score >= AMBIGUOUS_BAND[0] && score < AMBIGUOUS_BAND[1];
    })
    .slice(0, MAX_CHUNKS_PER_BATCH);
}

/** One Choice question per chunk; criteria are leaf indices from the shared state plus "none". */
export function buildMappingQuestions(
  ambiguous: readonly KnowledgeChunkDraft[],
  candidates: readonly SyllabusLeafRef[],
): Record<string, JevChoiceQuestion> {
  const criteria: Record<string, string> = {};
  candidates.forEach((leaf, i) => {
    criteria[String(i)] = `${leaf.title} (${leaf.canonicalKey})`;
  });
  criteria[NONE_OPTION] = "Nenhuma folha candidata descreve o trecho.";
  const questions: Record<string, JevChoiceQuestion> = {};
  ambiguous.forEach((_, i) => {
    questions[`chunk_${i}`] = {
      type: "choice",
      instructions: `A qual folha do conteúdo programático pertence o trecho [${i}]? Escolha o índice da folha ou "${NONE_OPTION}".`,
      criteria,
    };
  });
  return questions;
}

export function buildMappingState(
  ambiguous: readonly KnowledgeChunkDraft[],
  candidates: readonly SyllabusLeafRef[],
): unknown {
  return {
    rubric: MAPPING_RUBRIC_VERSION,
    leaves: candidates.map((l, i) => ({ index: i, title: l.title, key: l.canonicalKey })),
    chunks: ambiguous.map((c, i) => ({ index: i, text: c.text.slice(0, 800) })),
  };
}

/** Validated JEV Choice answers → assignments (leaf indices only from the candidate set). */
export function assignmentsFromJev(
  answers: Record<string, { choice: string; probabilities: Record<string, number>; confidence: number }>,
  chunkCount: number,
  leafCount: number,
): MappingAssignment[] {
  const out: MappingAssignment[] = [];
  for (let i = 0; i < chunkCount; i += 1) {
    const answer = answers[`chunk_${i}`];
    if (!answer) continue;
    const top = topChoice(answer.probabilities) ?? answer.choice;
    const confidence = answer.probabilities[top] ?? answer.confidence;
    if (top === NONE_OPTION) {
      out.push({ chunkIndex: i, leafIndex: null, confidence });
      continue;
    }
    const leafIndex = Number(top);
    if (!Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex >= leafCount) continue;
    out.push({ chunkIndex: i, leafIndex, confidence });
  }
  return out;
}

export function assignmentsFromGemini(raw: unknown, chunkCount: number, leafCount: number): MappingAssignment[] {
  const out: MappingAssignment[] = [];
  if (!Array.isArray(raw)) return out;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const chunkIndex = Number(row.chunkIndex);
    const leafIndex = row.leafIndex == null ? null : Number(row.leafIndex);
    const confidence = Number(row.confidence);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= chunkCount) continue;
    if (leafIndex != null && (!Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex >= leafCount)) {
      continue;
    }
    if (!Number.isFinite(confidence)) continue;
    out.push({ chunkIndex, leafIndex, confidence });
  }
  return out;
}

function toMapResults(
  assignments: MappingAssignment[],
  ambiguous: readonly KnowledgeChunkDraft[],
  candidates: readonly SyllabusLeafRef[],
): ChunkMapResult[] {
  const out: ChunkMapResult[] = [];
  for (const a of assignments) {
    if (a.leafIndex == null || a.confidence < MIN_CONFIDENCE) continue;
    const chunk = ambiguous[a.chunkIndex];
    const leaf = candidates[a.leafIndex];
    if (!chunk || !leaf) continue;
    out.push({
      chunkOrdinal: chunk.ordinal,
      syllabusNodeId: leaf.id,
      canonicalKey: leaf.canonicalKey,
      score: Math.min(1, a.confidence),
      method: "llm_t3",
    });
  }
  return out;
}

function agreement(a: MappingAssignment[], b: MappingAssignment[]): { compared: number; agree: number } {
  const byChunk = new Map(b.map((x) => [x.chunkIndex, x.leafIndex]));
  let compared = 0;
  let agree = 0;
  for (const x of a) {
    if (!byChunk.has(x.chunkIndex)) continue;
    compared += 1;
    if (byChunk.get(x.chunkIndex) === x.leafIndex) agree += 1;
  }
  return { compared, agree };
}

/**
 * Classify chunks whose best lexical map is in [0.45, 0.62) against ≤12 leaf candidates.
 */
export async function mapChunksLlmResidue(
  chunks: KnowledgeChunkDraft[],
  leaves: SyllabusLeafRef[],
  existing: ChunkMapResult[],
  deps: MappingResidueDeps = {},
): Promise<ChunkMapResult[]> {
  const mode = deps.mode ?? jevModeFor("mapping");
  const hasProvider = deps.hasProvider ?? hasLlmProvider;
  if (mode !== "active" && !hasProvider()) return [];
  if (chunks.length === 0 || leaves.length === 0) return [];

  const ambiguous = selectAmbiguous(chunks, existing);
  if (ambiguous.length === 0) return [];
  const candidates = leaves.slice(0, MAX_LEAF_CANDIDATES);

  const state = buildMappingState(ambiguous, candidates);
  const questions = buildMappingQuestions(ambiguous, candidates);
  const jev = deps.jev ?? jevDecide;
  const generate = deps.generate ?? generateJson;

  if (mode === "active") {
    const decision = await jev({ task: "mapping", state, questions, mode: "active" }, {});
    const assignments = assignmentsFromJev(decision.answers, ambiguous.length, candidates.length);
    return toMapResults(assignments, ambiguous, candidates);
  }

  const cacheKey = createHash("sha256")
    .update(
      [PROMPT_VERSION, ...ambiguous.map((c) => c.contentHash), ...candidates.map((l) => l.id)].join("|"),
    )
    .digest("hex")
    .slice(0, 40);

  let geminiAssignments: MappingAssignment[] = [];
  const production = generate<{ mappings: unknown }>(
    "Classifique trechos educacionais em nós de conteúdo programático. JSON apenas.",
    [
      "Folhas candidatas:",
      ...candidates.map((l, i) => `${i}: ${l.title} (${l.canonicalKey})`),
      "",
      "Trechos:",
      ...ambiguous.map((c, i) => `[${i}] ${c.text.slice(0, 800)}`),
      "",
      'JSON: { "mappings": [{ "chunkIndex": 0, "leafIndex": 0, "confidence": 0.7 }] }',
      "Use leafIndex null quando nenhum encaixe.",
    ].join("\n"),
    { temperature: 0, requiredKeys: ["mappings"], tier: "cheap", stage: "mapping", cacheKey },
  )
    .then((response) => {
      geminiAssignments = assignmentsFromGemini(response.mappings, ambiguous.length, candidates.length);
    })
    .catch(() => {
      geminiAssignments = [];
    });

  if (mode === "shadow") {
    await Promise.all([
      production,
      jevShadow(
        { task: "mapping", state, questions },
        (decision) => {
          const jevAssignments = assignmentsFromJev(decision.answers, ambiguous.length, candidates.length);
          const { compared, agree } = agreement(jevAssignments, geminiAssignments);
          return {
            rubric: MAPPING_RUBRIC_VERSION,
            chunks: ambiguous.length,
            leaves: candidates.length,
            geminiAssigned: geminiAssignments.filter((a) => a.leafIndex != null).length,
            jevAssigned: jevAssignments.filter((a) => a.leafIndex != null).length,
            compared,
            agree,
          };
        },
        { decide: jev, ...(deps.log ? { log: deps.log } : {}) },
      ),
    ]);
  } else {
    await production;
  }
  return toMapResults(geminiAssignments, ambiguous, candidates);
}
