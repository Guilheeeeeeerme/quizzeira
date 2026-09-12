// Concept: Fuzzy string matching for question near-duplicate detection (§26).

/**
 * Token-set ratio (0–100), aligned with rapidfuzz.token_set_ratio:
 * unique sorted tokens → compare intersection vs each remainder via string ratio.
 */
export function tokenSetRatio(a: string, b: string): number {
  const tokensA = [...tokenSet(a)].sort();
  const tokensB = [...tokenSet(b)].sort();
  if (tokensA.length === 0 && tokensB.length === 0) return 100;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setB = new Set(tokensB);
  const setA = new Set(tokensA);
  const inter = tokensA.filter((t) => setB.has(t));
  const diffA = tokensA.filter((t) => !setB.has(t));
  const diffB = tokensB.filter((t) => !setA.has(t));

  const interStr = inter.join(" ");
  const aStr = [...inter, ...diffA].join(" ");
  const bStr = [...inter, ...diffB].join(" ");

  return Math.max(
    stringRatio(interStr, aStr),
    stringRatio(interStr, bStr),
    stringRatio(aStr, bStr),
  );
}

/** Levenshtein similarity ratio (0–100). */
function stringRatio(a: string, b: string): number {
  if (a === b) return 100;
  if (a.length === 0 || b.length === 0) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
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
