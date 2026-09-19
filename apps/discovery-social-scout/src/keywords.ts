/** Default Brazilian concurso / exam discovery queries. */
export const DEFAULT_SOCIAL_KEYWORDS = [
  "concurso edital",
  "concurso gabarito",
  "concurso prova PDF",
  "edital concurso público",
  "OAB edital",
  "CEBRASPE edital",
  "VUNESP gabarito",
];

export function resolveKeywords(raw?: string): string[] {
  if (raw?.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const fromEnv = process.env.DISCOVERY_SOCIAL_KEYWORDS;
  if (fromEnv?.trim()) {
    return fromEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_SOCIAL_KEYWORDS];
}
