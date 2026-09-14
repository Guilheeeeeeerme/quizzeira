// Concept: Knowledge unit extraction via LLM (§23) — skip when no provider.

import { hasLlmProvider, generateJson, logInfo } from "@quizzeira/worker-kit";
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

export async function distillKnowledgeUnits(
  chunks: KnowledgeChunkDraft[],
  leaf: { id: string; canonicalKey: string; path: string[] },
): Promise<KnowledgeUnitDraft[]> {
  if (!hasLlmProvider() || chunks.length === 0) return [];

  const material = chunks.map((c, i) => `[${i}] ${c.text.slice(0, 2500)}`).join("\n\n");
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
      { temperature: 0, requiredKeys: ["units"] },
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
  } catch {
    return [];
  }
}
