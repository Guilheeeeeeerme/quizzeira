/**
 * Default Brazilian Portuguese (pt-BR) concurso / exam discovery queries.
 * English terms are never defaults — add via DISCOVERY_SOCIAL_KEYWORDS_EXTRA.
 */
export const DEFAULT_SOCIAL_KEYWORDS = [
  "concurso edital",
  "concurso inscrição",
  "inscrições abertas concurso",
  "concurso gabarito",
  "concurso prova PDF",
  "edital concurso público",
  "OAB edital",
  "CESPE edital",
  "Cebraspe edital",
  "FCC concurso",
  "FGV concurso",
  "VUNESP gabarito",
  "CESGRANRIO edital",
];

function splitCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeUnique(primary: string[], extra: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const kw of [...primary, ...extra]) {
    const key = kw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(kw);
  }
  return out;
}

/**
 * Resolve search keywords.
 * - `raw` / `DISCOVERY_SOCIAL_KEYWORDS` replace the built-in pt-BR list when set.
 * - `DISCOVERY_SOCIAL_KEYWORDS_EXTRA` always appends (optional EN or niche terms).
 */
export function resolveKeywords(raw?: string): string[] {
  let primary: string[];
  if (raw?.trim()) {
    primary = splitCsv(raw);
  } else {
    const fromEnv = process.env.DISCOVERY_SOCIAL_KEYWORDS;
    primary = fromEnv?.trim() ? splitCsv(fromEnv) : [...DEFAULT_SOCIAL_KEYWORDS];
  }
  const extraRaw = process.env.DISCOVERY_SOCIAL_KEYWORDS_EXTRA;
  const extra = extraRaw?.trim() ? splitCsv(extraRaw) : [];
  return mergeUnique(primary, extra);
}
