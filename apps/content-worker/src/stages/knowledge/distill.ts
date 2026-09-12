/**
 * Knowledge-unit distillation (§23).
 * Deterministic heuristic path always runs; LLM path is optional/cached later.
 */

import { contentHash, metadataProbability } from "@quizzeira/shared";

export type KuKind =
  | "rule"
  | "definition"
  | "exception"
  | "formula"
  | "procedure"
  | "classification"
  | "fact"
  | "example";

export interface DistilledUnit {
  kind: KuKind;
  statement: string;
  example: string | null;
  qualifiers: string[];
  confidence: number;
  sourceChunkHash: string;
}

const DEFINITION_RE =
  /\b(define-se|consiste\s+em|[eé]\s+(o|a)\s+\w[\w\s]{2,40}\s+que)\b/i;
const RULE_RE = /\b(deve|n[aã]o\s+deve|regra|sempre|nunca|exige|obrigat[oó]rio)\b/i;
const EXCEPTION_RE = /\b(exce[cç][aã]o|salvo|exceto|ressalva)\b/i;
const EXAMPLE_RE = /\b(por\s+exemplo|ex\.?:)\b/i;
const FORMULA_RE = /[=≈]|%\s|R\$|\d+\s*[+\-*/]\s*\d+/;

function classifyKind(sentence: string): KuKind {
  if (EXCEPTION_RE.test(sentence)) return "exception";
  if (DEFINITION_RE.test(sentence)) return "definition";
  if (EXAMPLE_RE.test(sentence)) return "example";
  if (FORMULA_RE.test(sentence)) return "formula";
  if (RULE_RE.test(sentence)) return "rule";
  return "fact";
}

/** Split into declarative sentences suitable as KU statements. */
export function distillChunkToUnits(
  chunkText: string,
  opts: { maxUnits?: number } = {},
): DistilledUnit[] {
  const maxUnits = opts.maxUnits ?? 4;
  if (metadataProbability(chunkText) > 0.45) return [];

  const sentences = chunkText
    .split(/(?<=[.!;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 300);

  const units: DistilledUnit[] = [];
  const chunkHash = contentHash(chunkText);

  for (const sentence of sentences) {
    if (metadataProbability(sentence) > 0.5) continue;
    if (!/[.!?]$/.test(sentence) && sentence.length < 50) continue;
    const kind = classifyKind(sentence);
    const confidence =
      kind === "definition" || kind === "rule" ? 0.85 : kind === "fact" ? 0.7 : 0.75;
    if (confidence < 0.6) continue;
    units.push({
      kind,
      statement: sentence.replace(/\s+/g, " ").trim(),
      example: EXAMPLE_RE.test(sentence) ? sentence : null,
      qualifiers: [],
      confidence,
      sourceChunkHash: chunkHash,
    });
    if (units.length >= maxUnits) break;
  }
  return units;
}

export function distillChunks(
  chunks: Array<{ id: string; text: string }>,
  opts: { maxPerChunk?: number } = {},
): Array<DistilledUnit & { chunkId: string }> {
  const out: Array<DistilledUnit & { chunkId: string }> = [];
  for (const chunk of chunks) {
    for (const unit of distillChunkToUnits(chunk.text, { maxUnits: opts.maxPerChunk ?? 4 })) {
      out.push({ ...unit, chunkId: chunk.id });
    }
  }
  return out;
}
