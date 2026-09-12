// Concept: Deterministic KU distillation from eligible chunk text (§23 heuristic fallback).
// Full LLM distill is preferred in production; this path enables fixture/offline generation.
import { createHash } from "node:crypto";
import type { KuKind } from "../../generation/brief.js";
import { metadataProbability } from "@quizzeira/shared";

export interface DistilledUnit {
  id: string;
  kind: KuKind;
  statement: string;
  example: string | null;
  qualifiers: string[];
  confidence: number;
  sourceChunkHash: string;
}

const DEFINITION_RE =
  /(?<!\p{L})(?:é|são|define-se|consiste em|entende-se por|denomina-se)\b/iu;
const RULE_RE = /\b(?:deve|devem|deverá|sempre|nunca|obrigat|proib|regra|exceção)\b/i;
const EXCEPTION_RE = /\b(?:exceto|salvo|ressalva|exceção)\b/i;
const EXAMPLE_RE = /\b(?:por exemplo|ex\.|exemplo:)\b/i;

function classifyKind(sentence: string): KuKind {
  if (EXCEPTION_RE.test(sentence)) return "exception";
  if (EXAMPLE_RE.test(sentence)) return "example";
  if (DEFINITION_RE.test(sentence)) return "definition";
  if (RULE_RE.test(sentence)) return "rule";
  if (/\d/.test(sentence) && /[=%]/.test(sentence)) return "formula";
  return "fact";
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 300);
}

/**
 * Extract testable statements from chunk text without an LLM.
 * Drops metadata-looking sentences via the shared logistic classifier.
 */
export function distillKnowledgeUnits(
  text: string,
  opts: { syllabusNodeId: string; max?: number } = { syllabusNodeId: "node" },
): DistilledUnit[] {
  const max = opts.max ?? 8;
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);
  const out: DistilledUnit[] = [];
  const seen = new Set<string>();

  for (const sentence of splitSentences(text)) {
    if (metadataProbability(sentence) > 0.45) continue;
    const key = sentence.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    const kind = classifyKind(sentence);
    const id = `ku_${createHash("sha256")
      .update(`${opts.syllabusNodeId}|${key}`)
      .digest("hex")
      .slice(0, 12)}`;
    out.push({
      id,
      kind,
      statement: sentence.replace(/\.$/, ""),
      example: null,
      qualifiers: [],
      confidence: kind === "fact" ? 0.7 : 0.85,
      sourceChunkHash: hash,
    });
    if (out.length >= max) break;
  }
  return out.filter((u) => u.confidence >= 0.6);
}
