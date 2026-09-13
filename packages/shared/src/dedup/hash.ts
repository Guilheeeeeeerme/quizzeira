// Concept: Browser-safe 32/64-bit hashes for dedup (no node:crypto).

/** FNV-1a 32-bit. */
export function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Two FNV passes → unsigned 64-bit bigint (SimHash feature hash). */
export function hash64(input: string): bigint {
  const lo = fnv1a32(input);
  const hi = fnv1a32(`:${input}:`);
  return (BigInt(hi) << 32n) | BigInt(lo);
}
