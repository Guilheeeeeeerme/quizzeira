// Concept: Knowledge unit extraction via LLM (§23) — skip when no provider.

import { hasLlmProvider, generateJson, isDeferrableLlmError, logInfo } from "@quizzeira/worker-kit";
import type { KnowledgeChunkDraft } from "./chunker.js";

export interface KnowledgeUnitDraft {
  syllabusNodeId: string;
  canonicalKey: string;
  kind: string;
  statement: string;
  example: string | null;
  qualifiers: string[];
  evidence: Array<{ chunkOrdinal: number }>;
  quality: { confidence: number; testability: number; sourceRank: number };
}

const NAME = "content-worker/distill";

/** Cost caps (§27): fewer, shorter chunks per LLM call; the cheap tier is enough for extraction. */
export const DISTILL_MAX_CHUNKS = 3;
export const DISTILL_CHUNK_CHARS = 1800;

function significantTokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 5)
    .map((t) => t.slice(0, 6));
}

/**
 * Zero-cost off-topic gate: the material must mention at least one
 * significant word of the leaf (or its parent). Pages fetched for a topic
 * query that never say the topic's name are not worth an LLM call.
 */
export function materialMentionsLeaf(chunks: Array<{ text: string }>, path: string[]): boolean {
  const leafTokens = new Set(significantTokens(path.join(" ")));
  if (leafTokens.size === 0) return true;
  const material = chunks.map((c) => c.text).join(" ");
  const seen = new Set(significantTokens(material));
  for (const t of leafTokens) if (seen.has(t)) return true;
  return false;
}

export async function distillKnowledgeUnits(
  chunks: KnowledgeChunkDraft[],
  leaf: { id: string; canonicalKey: string; path: string[] },
): Promise<KnowledgeUnitDraft[]> {
  if (!hasLlmProvider() || chunks.length === 0) return [];
  chunks = chunks.slice(0, DISTILL_MAX_CHUNKS);
  if (!materialMentionsLeaf(chunks, leaf.path)) {
    logInfo("material never mentions leaf; skipping distill", { worker: NAME, leaf: leaf.id });
    return [];
  }

  const material = chunks.map((c, i) => `[${i}] ${c.text.slice(0, DISTILL_CHUNK_CHARS)}`).join("\n\n");
  const prompt = [
    `Subtópico: ${leaf.path.join(" › ")}`,
    "Extraia unidades de conhecimento testáveis presentes no texto que tratem DIRETAMENTE desse subtópico.",
    "Se o material não for sobre o subtópico (outro assunto, outra disciplina, página de portal), responda { \"onTopic\": false, \"units\": [] }.",
    "JSON: { onTopic: boolean, units: [{ kind, statement, example, confidence }] }",
    material,
  ].join("\n");

  try {
    const response = await generateJson<{ onTopic?: unknown; units: unknown }>(
      "Extraia apenas fatos do material, e apenas os pertinentes ao subtópico indicado. Cada statement é autocontido (sem 'o texto', 'o autor'). Sem metadados de edital.",
      prompt,
      { temperature: 0, requiredKeys: ["units"], tier: "cheap", stage: "ku" },
    );
    if (response.onTopic === false) {
      logInfo("material off-topic for leaf; no KUs", { worker: NAME, leaf: leaf.id, chunks: chunks.length });
      return [];
    }
    const units = Array.isArray(response.units) ? response.units : [];
    const out: KnowledgeUnitDraft[] = [];
    for (const entry of units) {
      if (!entry || typeof entry !== "object") continue;
      const u = entry as Record<string, unknown>;
      const statement = typeof u.statement === "string" ? u.statement.trim() : "";
      if (statement.length < 10 || statement.length > 300) continue;
      out.push({
        syllabusNodeId: leaf.id,
        canonicalKey: leaf.canonicalKey,
        kind: typeof u.kind === "string" ? u.kind : "fact",
        statement,
        example: typeof u.example === "string" ? u.example : null,
        qualifiers: [],
        evidence: chunks.map((c) => ({ chunkOrdinal: c.ordinal })),
        quality: {
          confidence: Number(u.confidence) || 0.7,
          testability: 0.6,
          sourceRank: 0.5,
        },
      });
    }
    if (out.length) logInfo("distilled KUs", { worker: NAME, count: out.length, leaf: leaf.id });
    return out;
  } catch (err) {
    // Budget/provider outages must defer the document, not silently lose its KUs.
    if (isDeferrableLlmError(err)) throw err;
    return [];
  }
}
