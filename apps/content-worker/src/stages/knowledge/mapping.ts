// Concept: Syllabus mapping tiers 1–2 — lexical + embedding (§21.1–§21.2).

import { CANONICAL_SUBJECTS, stemTokens } from "@quizzeira/shared";
import type { KnowledgeChunkDraft } from "./chunker.js";

export interface SyllabusLeafRef {
  id: string;
  title: string;
  pathSlug: string;
  canonicalKey: string;
  canonicalSubjectId: string | null;
  parentTitle?: string | null;
  /** Optional precomputed leaf embedding (`"${S} — ${T} — ${L}"`). */
  embedding?: number[] | null;
}

export interface ChunkMapResult {
  chunkOrdinal: number;
  syllabusNodeId: string;
  canonicalKey: string;
  score: number;
  method: "lexical_t1" | "embedding_t2" | "llm_t3";
}

const STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "para",
  "com",
  "no",
  "na",
  "aos",
  "as",
  "os",
  "um",
  "uma",
]);

function termSet(leaf: SyllabusLeafRef): Set<string> {
  const parts = [leaf.title, leaf.parentTitle ?? ""].join(" ");
  const subject = leaf.canonicalSubjectId
    ? CANONICAL_SUBJECTS.find((s) => s.id === leaf.canonicalSubjectId)
    : null;
  const aliases = subject ? [subject.title, ...subject.aliases] : [];
  const raw = [parts, ...aliases].join(" ");
  return new Set(stemTokens(raw).filter((t) => t.length > 2 && !STOPWORDS.has(t)));
}

function chunkTokens(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of stemTokens(text)) {
    if (t.length <= 2 || STOPWORDS.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return counts;
}

function lexicalScore(terms: Set<string>, text: string): number {
  if (terms.size === 0) return 0;
  const tokens = chunkTokens(text);
  let hit = 0;
  for (const term of terms) {
    if (tokens.has(term)) hit += tokens.get(term)! >= 2 ? 2 : 1;
  }
  return hit / terms.size;
}

/** Text for leaf embedding: `"${S} — ${T} — ${L}"` (§21.2). */
export function leafEmbeddingText(leaf: SyllabusLeafRef): string {
  const parts = leaf.pathSlug.split("/").map((p) => p.trim()).filter(Boolean);
  const S = parts[0] ?? leaf.title;
  const T = parts.length > 1 ? parts[1]! : leaf.title;
  const L = leaf.title;
  return `${S} — ${T} — ${L}`;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function combineLexEmb(lex: number, emb: number): number {
  return 0.5 * lex + 0.5 * emb;
}

export function mapChunksLexical(
  chunks: KnowledgeChunkDraft[],
  leaves: SyllabusLeafRef[],
): ChunkMapResult[] {
  const leafTerms = leaves.map((leaf) => ({ leaf, terms: termSet(leaf) }));
  const results: ChunkMapResult[] = [];

  for (const chunk of chunks) {
    const scored = leafTerms
      .map(({ leaf, terms }) => ({
        leaf,
        score: lexicalScore(terms, chunk.text),
      }))
      .filter((s) => s.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    for (const { leaf, score } of scored) {
      results.push({
        chunkOrdinal: chunk.ordinal,
        syllabusNodeId: leaf.id,
        canonicalKey: leaf.canonicalKey,
        score,
        method: "lexical_t1",
      });
    }
  }

  return results;
}

/**
 * Tier 2: `map = 0.5·lex + 0.5·emb`. Accept top-1 if map ≥ 0.62 and margin ≥ 0.05;
 * accept top-1 and top-2 when both ≥ 0.62 (§21.2).
 */
export function mapChunksEmbedding(
  chunks: KnowledgeChunkDraft[],
  leaves: SyllabusLeafRef[],
  chunkEmbeddings: Map<number, number[]>,
): ChunkMapResult[] {
  const withEmb = leaves.filter((l) => Array.isArray(l.embedding) && l.embedding!.length > 0);
  if (withEmb.length === 0) return [];

  const leafTerms = new Map(leaves.map((leaf) => [leaf.id, termSet(leaf)]));
  const results: ChunkMapResult[] = [];

  for (const chunk of chunks) {
    const chunkEmb = chunkEmbeddings.get(chunk.ordinal);
    if (!chunkEmb?.length) continue;

    const scored = withEmb
      .map((leaf) => {
        const emb = cosineSimilarity(chunkEmb, leaf.embedding!);
        const lex = lexicalScore(leafTerms.get(leaf.id) ?? new Set(), chunk.text);
        return { leaf, score: combineLexEmb(lex, emb), emb, lex };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    const second = scored[1];
    if (!top || top.score < 0.62) continue;

    const margin = top.score - (second?.score ?? 0);
    const acceptSecond = second && second.score >= 0.62;
    if (margin < 0.05 && !acceptSecond) continue;

    results.push({
      chunkOrdinal: chunk.ordinal,
      syllabusNodeId: top.leaf.id,
      canonicalKey: top.leaf.canonicalKey,
      score: top.score,
      method: "embedding_t2",
    });
    if (acceptSecond) {
      results.push({
        chunkOrdinal: chunk.ordinal,
        syllabusNodeId: second.leaf.id,
        canonicalKey: second.leaf.canonicalKey,
        score: second.score,
        method: "embedding_t2",
      });
    }
  }

  return results;
}

/** Prefer embedding_t2 over lexical_t1 for the same (chunk, leaf). */
export function mergeMapResults(...groups: ChunkMapResult[][]): ChunkMapResult[] {
  const best = new Map<string, ChunkMapResult>();
  const rank = (m: ChunkMapResult) =>
    m.method === "embedding_t2" ? 2 : m.method === "llm_t3" ? 3 : 1;
  for (const group of groups) {
    for (const m of group) {
      const key = `${m.chunkOrdinal}:${m.syllabusNodeId}`;
      const prev = best.get(key);
      if (!prev || rank(m) > rank(prev) || (rank(m) === rank(prev) && m.score > prev.score)) {
        best.set(key, m);
      }
    }
  }
  return [...best.values()];
}
