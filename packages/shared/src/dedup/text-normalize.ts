// Concept: Deduplication (§26) — shared normalisation for every text key.
//
// Document/chunk layers replace digits with `0` so page numbers and years do
// not defeat near-dup detection; the question layer never does, because a
// different number in a stem is a different question.

const PUNCT_RE = /[^\p{L}\p{N}\s]+/gu;

export interface NormalizeKeyOptions {
  digitsToZero?: boolean;
}

export function normalizeForKey(text: string, opts: NormalizeKeyOptions = {}): string {
  let out = text.normalize("NFC").toLowerCase().replace(PUNCT_RE, " ");
  if (opts.digitsToZero) out = out.replace(/\p{N}/gu, "0");
  return out.replace(/\s+/g, " ").trim();
}

/** Lowercased word tokens (letters and digits only, accents preserved). */
export function tokenize(text: string): string[] {
  const matches = text.normalize("NFC").toLowerCase().match(/[\p{L}\p{N}]+/gu);
  return matches ? [...matches] : [];
}

/** Accent-stripped, lowercased. Used for lexical comparisons, never for display. */
export function foldAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function shingles(tokens: readonly string[], n = 5): string[] {
  if (tokens.length === 0) return [];
  if (tokens.length <= n) return [tokens.join(" ")];
  const out: string[] = [];
  for (let i = 0; i + n <= tokens.length; i += 1) {
    out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

/** FNV-1a 64-bit as a BigInt. Deterministic across runtimes. */
export function fnv1a64(input: string): bigint {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const bytes = new TextEncoder().encode(input);
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash;
}

/** FNV-1a 32-bit, for MinHash seeds. */
export function fnv1a32(input: string, seed = 0): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
