/** Exact + near-duplicate helpers (MinHash-lite / simhash style) (§26). */

import { createHash } from "node:crypto";
import { normalizeForDedup } from "../pipeline/html-decode";

export function contentHash(text: string): string {
  return createHash("sha256").update(normalizeForDedup(text)).digest("hex");
}

export function exactDuplicate(a: string, b: string): boolean {
  return contentHash(a) === contentHash(b);
}

/** 64-bit simhash over shingles. */
export function simhash64(text: string): bigint {
  const norm = normalizeForDedup(text);
  const tokens = norm.split(" ").filter(Boolean);
  const shingles: string[] = [];
  for (let i = 0; i < tokens.length - 2; i++) {
    shingles.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  if (shingles.length === 0 && norm) shingles.push(norm);

  const bits = new Array<number>(64).fill(0);
  for (const sh of shingles) {
    const h = createHash("sha256").update(sh).digest();
    for (let bit = 0; bit < 64; bit++) {
      const byte = h[Math.floor(bit / 8)];
      const on = (byte >> (bit % 8)) & 1;
      bits[bit] += on ? 1 : -1;
    }
  }
  let out = 0n;
  for (let bit = 0; bit < 64; bit++) {
    if (bits[bit] > 0) out |= 1n << BigInt(bit);
  }
  return out;
}

export function hamming64(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

/** Near-duplicate when hamming distance ≤ threshold (default 3). */
export function nearDuplicate(a: string, b: string, maxDistance = 3): boolean {
  return hamming64(simhash64(a), simhash64(b)) <= maxDistance;
}

/** Token-set ratio 0–100 for question copy check. */
export function tokenSetRatio(a: string, b: string): number {
  const ta = new Set(normalizeForDedup(a, false).split(" ").filter(Boolean));
  const tb = new Set(normalizeForDedup(b, false).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = ta.size + tb.size - inter;
  return Math.round((100 * inter) / union);
}
