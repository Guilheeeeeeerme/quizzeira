// Concept: Fuzzy matching — `tokenSetRatio` in the rapidfuzz sense, used for
// subject canonicalisation, position dedup and the previous-question copy check.
import { foldAccents, tokenize } from "./dedup/text-normalize";

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j += 1) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 0–100 similarity, like `fuzz.ratio`. */
export function ratio(a: string, b: string): number {
  const total = a.length + b.length;
  if (total === 0) return 100;
  return Math.round(((total - levenshtein(a, b)) / total) * 100);
}

function prepare(text: string): string[] {
  return tokenize(foldAccents(text)).sort();
}

/** 0–100, order-insensitive, tolerant of extra tokens on either side. */
export function tokenSetRatio(a: string, b: string): number {
  const ta = new Set(prepare(a));
  const tb = new Set(prepare(b));
  if (ta.size === 0 && tb.size === 0) return 100;
  const inter = [...ta].filter((t) => tb.has(t)).sort();
  const diffA = [...ta].filter((t) => !tb.has(t)).sort();
  const diffB = [...tb].filter((t) => !ta.has(t)).sort();
  const t0 = inter.join(" ");
  const t1 = [t0, diffA.join(" ")].filter(Boolean).join(" ");
  const t2 = [t0, diffB.join(" ")].filter(Boolean).join(" ");
  if (t0.length > 0 && (diffA.length === 0 || diffB.length === 0)) return 100;
  return Math.max(ratio(t0, t1), ratio(t0, t2), ratio(t1, t2));
}

/** 0–100 over sorted token strings (`fuzz.token_sort_ratio`). */
export function tokenSortRatio(a: string, b: string): number {
  return ratio(prepare(a).join(" "), prepare(b).join(" "));
}

/** Share of `a`'s tokens present in `b` (0–1). */
export function tokenOverlap(a: string, b: string): number {
  const ta = new Set(prepare(a));
  if (ta.size === 0) return 0;
  const tb = new Set(prepare(b));
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / ta.size;
}
