// Concept: Deduplication — MinHash (128 permutations) with LSH bands for the
// chunk layer (§26). Jaccard ≥ 0.85 is a duplicate.
import { fnv1a32, normalizeForKey, shingles, tokenize } from "./text-normalize";

export const MINHASH_PERMUTATIONS = 128;
export const MINHASH_BANDS = 32;
export const MINHASH_ROWS_PER_BAND = MINHASH_PERMUTATIONS / MINHASH_BANDS;
export const MINHASH_DUPLICATE_JACCARD = 0.85;

const MERSENNE_PRIME = 4294967311; // first prime > 2^32
const MAX_HASH = 0xffffffff;

// Fixed (a, b) coefficients derived from a seeded LCG so signatures are stable
// across processes and versions.
function coefficients(): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let state = 0x9e3779b9;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  for (let i = 0; i < MINHASH_PERMUTATIONS; i += 1) {
    const a = (next() % (MAX_HASH - 1)) + 1;
    const b = next() % MAX_HASH;
    out.push([a, b]);
  }
  return out;
}

const COEFFICIENTS = coefficients();

export function shingleSet(text: string, n = 5): Set<string> {
  const tokens = tokenize(normalizeForKey(text, { digitsToZero: true }));
  return new Set(shingles(tokens, n));
}

export function minhashSignature(text: string, n = 5): Uint32Array {
  const grams = shingleSet(text, n);
  const sig = new Uint32Array(MINHASH_PERMUTATIONS).fill(MAX_HASH);
  if (grams.size === 0) return sig;
  for (const gram of grams) {
    const base = fnv1a32(gram);
    for (let i = 0; i < MINHASH_PERMUTATIONS; i += 1) {
      const [a, b] = COEFFICIENTS[i];
      // (a * x + b) mod p, computed in floating point safely below 2^53.
      const h = (a * base + b) % MERSENNE_PRIME;
      const v = h & MAX_HASH;
      if (v < sig[i]) sig[i] = v;
    }
  }
  return sig;
}

export function estimateJaccard(a: Uint32Array, b: Uint32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let same = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] === b[i]) same += 1;
  return same / a.length;
}

export function exactJaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter += 1;
  return inter / (a.size + b.size - inter);
}

/** LSH band keys; two signatures sharing any band key are candidates. */
export function lshBandKeys(sig: Uint32Array): string[] {
  const keys: string[] = [];
  for (let band = 0; band < MINHASH_BANDS; band += 1) {
    const start = band * MINHASH_ROWS_PER_BAND;
    const slice = Array.from(sig.subarray(start, start + MINHASH_ROWS_PER_BAND));
    keys.push(`${band}:${slice.join(",")}`);
  }
  return keys;
}

export function signatureToBase64(sig: Uint32Array): string {
  return Buffer.from(sig.buffer, sig.byteOffset, sig.byteLength).toString("base64");
}

export function signatureFromBase64(value: string): Uint32Array {
  const buf = Buffer.from(value, "base64");
  return new Uint32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}
