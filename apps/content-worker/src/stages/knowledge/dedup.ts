// Concept: Exact contentHash + MinHash near-dup (§26).

import { estimateJaccard, minhashSignature } from "@quizzeira/shared";
import type { KnowledgeChunkDraft } from "./chunker.js";

export interface DedupResult {
  chunks: Array<KnowledgeChunkDraft & { duplicateOfOrdinal: number | null }>;
}

const NEAR_DUP_JACCARD = 0.85;

/**
 * Signatures are computed once per chunk and compared pairwise. Recomputing
 * both MinHash signatures per comparison made this O(n² · perms · tokens) and
 * pinned the worker for minutes on long PDFs.
 */
export function dedupeChunks(chunks: KnowledgeChunkDraft[]): DedupResult {
  const seenHash = new Map<string, number>();
  const canonical: Array<{ ordinal: number; sig: number[] }> = [];
  const out: Array<KnowledgeChunkDraft & { duplicateOfOrdinal: number | null }> = [];

  for (const chunk of chunks) {
    if (seenHash.has(chunk.contentHash)) {
      out.push({ ...chunk, duplicateOfOrdinal: seenHash.get(chunk.contentHash)! });
      continue;
    }

    const sig = minhashSignature(chunk.text);
    let nearDup: number | null = null;
    for (const c of canonical) {
      if (estimateJaccard(sig, c.sig) >= NEAR_DUP_JACCARD) {
        nearDup = c.ordinal;
        break;
      }
    }

    if (nearDup != null) {
      out.push({ ...chunk, duplicateOfOrdinal: nearDup });
      continue;
    }

    seenHash.set(chunk.contentHash, chunk.ordinal);
    canonical.push({ ordinal: chunk.ordinal, sig });
    out.push({ ...chunk, duplicateOfOrdinal: null });
  }

  return { chunks: out };
}
