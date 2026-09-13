// Concept: Syllabus mapping tier 3 — LLM residue for ambiguous lexical scores (§21.3).

import { createHash } from "node:crypto";
import { generateJson, hasLlmProvider } from "@quizzeira/worker-kit";
import type { KnowledgeChunkDraft } from "./chunker.js";
import type { ChunkMapResult, SyllabusLeafRef } from "./mapping.js";

const PROMPT_VERSION = "map-t3-v1";

/**
 * Classify chunks whose best lexical map is in [0.45, 0.62) against ≤12 leaf candidates.
 */
export async function mapChunksLlmResidue(
  chunks: KnowledgeChunkDraft[],
  leaves: SyllabusLeafRef[],
  existing: ChunkMapResult[],
): Promise<ChunkMapResult[]> {
  if (!hasLlmProvider() || chunks.length === 0 || leaves.length === 0) return [];

  const best = new Map<number, number>();
  for (const m of existing) {
    const prev = best.get(m.chunkOrdinal) ?? 0;
    if (m.score > prev) best.set(m.chunkOrdinal, m.score);
  }

  const ambiguous = chunks.filter((c) => {
    const score = best.get(c.ordinal) ?? 0;
    return score >= 0.45 && score < 0.62;
  }).slice(0, 8);

  if (ambiguous.length === 0) return [];

  const candidates = leaves.slice(0, 12);
  const cacheKey = createHash("sha256")
    .update(
      [
        PROMPT_VERSION,
        ...ambiguous.map((c) => c.contentHash),
        ...candidates.map((l) => l.id),
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 40);

  try {
    const response = await generateJson<{ mappings: unknown }>(
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
      {
        temperature: 0,
        requiredKeys: ["mappings"],
        tier: "cheap",
        stage: "mapping",
        cacheKey,
      },
    );

    const out: ChunkMapResult[] = [];
    if (!Array.isArray(response.mappings)) return out;
    for (const entry of response.mappings) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const chunkIndex = Number(row.chunkIndex);
      const leafIndex = row.leafIndex == null ? -1 : Number(row.leafIndex);
      const confidence = Number(row.confidence);
      if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= ambiguous.length) {
        continue;
      }
      if (!Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex >= candidates.length) {
        continue;
      }
      if (!Number.isFinite(confidence) || confidence < 0.6) continue;
      const chunk = ambiguous[chunkIndex]!;
      const leaf = candidates[leafIndex]!;
      out.push({
        chunkOrdinal: chunk.ordinal,
        syllabusNodeId: leaf.id,
        canonicalKey: leaf.canonicalKey,
        score: Math.min(1, confidence),
        method: "llm_t3",
      });
    }
    return out;
  } catch {
    return [];
  }
}
