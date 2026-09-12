// Concept: ExamStyleProfile aggregation (§18.4).

export interface PreviousQuestionDraft {
  prompt: string;
  options: string[];
  passage: string | null;
  banca: string | null;
  canonicalSubjectId: string | null;
}

export interface StyleProfile {
  optionCount: number;
  stemLengthP50: number;
  stemLengthP90: number;
  passageRate: number;
  negativeStemRate: number;
  assertionStyleRate: number;
  numericRate: number;
  legalCitationRate: number;
  commandVerbs: string[];
  certoErrado: boolean;
  difficultyProxy: number;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0] ?? 5;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function buildStyleProfile(
  questions: PreviousQuestionDraft[],
  banca: string,
  canonicalSubjectId: string,
): { banca: string; canonicalSubjectId: string; sampleSize: number; profile: StyleProfile } {
  const stems = questions.map((q) => q.prompt);
  const stemLengths = stems.map((s) => s.length);
  const optionCounts = questions.map((q) => q.options.length);
  const passageRate = questions.filter((q) => q.passage).length / Math.max(questions.length, 1);
  const negativeStemRate =
    stems.filter((s) => /incorret|exceto|n[aã]o\s+[eé]|falsa/i.test(s)).length /
    Math.max(stems.length, 1);
  const assertionStyleRate =
    questions.filter((q) => q.options.every((o) => o.length > 60)).length /
    Math.max(questions.length, 1);
  const numericRate =
    questions.filter((q) => q.options.every((o) => /^\s*[\d.,]+\s*$/.test(o))).length /
    Math.max(questions.length, 1);
  const legalCitationRate =
    stems.filter((s) => /art\.|lei|s[uú]mula/i.test(s)).length / Math.max(stems.length, 1);
  const certoErrado =
    /cebraspe|cespe/i.test(banca) &&
    questions.some((q) => q.options.length === 2 && /certo|errado/i.test(q.options.join(" ")));

  const openers = stems
    .map((s) => s.split(/\s+/).slice(0, 2).join(" "))
    .filter(Boolean);
  const verbCounts = new Map<string, number>();
  for (const o of openers) verbCounts.set(o, (verbCounts.get(o) ?? 0) + 1);
  const commandVerbs = [...verbCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);

  const avgStem = stemLengths.reduce((a, b) => a + b, 0) / Math.max(stemLengths.length, 1);
  const difficultyProxy = Math.min(
    1,
    Math.max(0, (avgStem - 80) / 200 + legalCitationRate * 0.3),
  );

  return {
    banca,
    canonicalSubjectId,
    sampleSize: questions.length,
    profile: {
      optionCount: mode(optionCounts),
      stemLengthP50: percentile(stemLengths, 0.5),
      stemLengthP90: percentile(stemLengths, 0.9),
      passageRate,
      negativeStemRate,
      assertionStyleRate,
      numericRate,
      legalCitationRate,
      commandVerbs,
      certoErrado,
      difficultyProxy,
    },
  };
}
