// Concept: 64-bit SimHash over character shingles for near-duplicate documents.

import { createHash } from "node:crypto";
import { shingles } from "./text-normalize";

function hash64(s: string): bigint {
  const hex = createHash("sha256").update(s).digest("hex").slice(0, 16);
  return BigInt(`0x${hex}`);
}

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
