// Concept: Fuzzy string matching for question near-duplicate detection (§26).

/**
 * Token-set ratio (0–100): sort-unique tokens from both strings, compare overlap
 * against the longer token set. Lightweight stand-in for rapidfuzz.token_set_ratio.
 */
export function tokenSetRatio(a: string, b: string): number {
  const tokensA = tokenSet(a);
  const tokensB = tokenSet(b);
  if (tokensA.size === 0 && tokensB.size === 0) return 100;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection += 1;
  }

  const longer = Math.max(tokensA.size, tokensB.size);
  return Math.round((intersection / longer) * 100);
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

/** Question near-duplicate threshold from §26.3. */
export const QUESTION_TOKEN_SET_RATIO_THRESHOLD = 85;

export function isQuestionNearDuplicateStem(a: string, b: string): boolean {
  return tokenSetRatio(a, b) >= QUESTION_TOKEN_SET_RATIO_THRESHOLD;
}
