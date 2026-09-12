// Concept: Text normalisation for dedup keys (§26).

export function normalizeDedupText(
  text: string,
  opts: { replaceDigits?: boolean } = {},
): string {
  let t = text.normalize("NFC").toLowerCase();
  t = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
  if (opts.replaceDigits !== false) {
    t = t.replace(/\d/g, "0");
  }
  return t.replace(/\s+/g, " ").trim();
}

export function shingles(text: string, n = 5): string[] {
  const norm = normalizeDedupText(text);
  const chars = norm.replace(/\s/g, "");
  if (chars.length < n) return chars ? [chars] : [];
  const out: string[] = [];
  for (let i = 0; i <= chars.length - n; i += 1) {
    out.push(chars.slice(i, i + n));
  }
  return out;
}
