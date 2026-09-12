// Concept: Exact contentHash + MinHash near-dup (§26).

import { isNearDuplicateMinhash, normalizeDedupText } from "@quizzeira/shared";
import type { KnowledgeChunkDraft } from "./chunker.js";

export interface DedupResult {
  chunks: Array<KnowledgeChunkDraft & { duplicateOfOrdinal: number | null }>;
}

export function dedupeChunks(chunks: KnowledgeChunkDraft[]): DedupResult {
  const seenHash = new Map<string, number>();
  const canonicalTexts: string[] = [];
  const out: Array<KnowledgeChunkDraft & { duplicateOfOrdinal: number | null }> = [];

  for (const chunk of chunks) {
    const norm = normalizeDedupText(chunk.text);
    if (seenHash.has(chunk.contentHash)) {
      out.push({ ...chunk, duplicateOfOrdinal: seenHash.get(chunk.contentHash)! });
      continue;
    }

    let nearDup: number | null = null;
    for (let i = 0; i < canonicalTexts.length; i += 1) {
      if (isNearDuplicateMinhash(norm, canonicalTexts[i])) {
        nearDup = i;
        break;
      }
    }

    if (nearDup != null) {
      out.push({ ...chunk, duplicateOfOrdinal: nearDup });
      continue;
    }

    seenHash.set(chunk.contentHash, chunk.ordinal);
    canonicalTexts.push(norm);
    out.push({ ...chunk, duplicateOfOrdinal: null });
  }

  return { chunks: out };
}
