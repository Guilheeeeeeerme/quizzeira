// Concept: MinHash (128 permutations) for chunk near-dedup (Jaccard ≥ 0.85).

import { fnv1a32 } from "./hash";
import { normalizeDedupText } from "./text-normalize";

const PERMS = 128;

function tokenHash(token: string, seed: number): number {
  return fnv1a32(`${seed}:${token}`);
}

function tokens(text: string): string[] {
  return normalizeDedupText(text).split(" ").filter(Boolean);
}

/** Compact MinHash signature as array of 128 uint32. */
export function minhashSignature(text: string): number[] {
  const toks = tokens(text);
  const sig = new Array<number>(PERMS).fill(0xffffffff);
  if (toks.length === 0) return sig;
  for (let i = 0; i < PERMS; i += 1) {
    let min = 0xffffffff;
    for (const t of toks) {
      const v = tokenHash(t, i);
      if (v < min) min = v;
    }
    sig[i] = min;
  }
  return sig;
}

export function estimateJaccard(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let match = 0;
  for (let i = 0; i < n; i += 1) {
    if (a[i] === b[i]) match += 1;
  }
  return match / n;
}

export function isNearDuplicateMinhash(a: string, b: string, threshold = 0.85): boolean {
  return estimateJaccard(minhashSignature(a), minhashSignature(b)) >= threshold;
}
