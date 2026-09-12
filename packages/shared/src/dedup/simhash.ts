// Concept: Deduplication — 64-bit SimHash over 5-gram shingles (§26, document
// layer). Hamming distance ≤ 3 marks a near duplicate.
import { fnv1a64, normalizeForKey, shingles, tokenize } from "./text-normalize";

export function simhash64(text: string, n = 5): bigint {
  const tokens = tokenize(normalizeForKey(text, { digitsToZero: true }));
  const grams = shingles(tokens, n);
  if (grams.length === 0) return 0n;
  const weights = new Array<number>(64).fill(0);
  for (const gram of grams) {
    const h = fnv1a64(gram);
    for (let bit = 0; bit < 64; bit += 1) {
      const set = (h >> BigInt(bit)) & 1n;
      weights[bit] += set === 1n ? 1 : -1;
    }
  }
  let out = 0n;
  for (let bit = 0; bit < 64; bit += 1) {
    if (weights[bit] > 0) out |= 1n << BigInt(bit);
  }
  return out;
}

export function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

export const SIMHASH_NEAR_DUPLICATE_MAX_DISTANCE = 3;

export function isNearDuplicateSimhash(a: bigint, b: bigint): boolean {
  return hammingDistance(a, b) <= SIMHASH_NEAR_DUPLICATE_MAX_DISTANCE;
}

/** Postgres BIGINT is signed; store the two's-complement view and read it back. */
export function simhashToSigned(value: bigint): bigint {
  return value >= 1n << 63n ? value - (1n << 64n) : value;
}

export function simhashFromSigned(value: bigint): bigint {
  return value < 0n ? value + (1n << 64n) : value;
}
