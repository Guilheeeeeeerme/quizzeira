// Concept: 64-bit SimHash over character 5-gram shingles for near-duplicate documents (§26).

import { hash64 } from "./hash";
import { shingles } from "./text-normalize";

/** Returns unsigned 64-bit SimHash as bigint. */
export function simhash64(text: string): bigint {
  const grams = shingles(text, 5);
  if (grams.length === 0) return 0n;
  const bits = new Array<number>(64).fill(0);
  for (const g of grams) {
    const h = hash64(g);
    for (let i = 0; i < 64; i += 1) {
      const bit = (h >> BigInt(i)) & 1n;
      bits[i] += bit === 1n ? 1 : -1;
    }
  }
  let out = 0n;
  for (let i = 0; i < 64; i += 1) {
    if (bits[i]! > 0) out |= 1n << BigInt(i);
  }
  return out;
}

export function hammingDistance64(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

export function isNearDuplicateSimhash(a: string, b: string, maxDistance = 3): boolean {
  return hammingDistance64(simhash64(a), simhash64(b)) <= maxDistance;
}
