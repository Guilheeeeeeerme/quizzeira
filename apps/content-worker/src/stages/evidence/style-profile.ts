// Concept: ExamStyleProfile aggregation from PreviousQuestion rows (§18.4).
export interface PreviousQuestionSample {
  prompt: string;
  options: string[];
  passage?: string | null;
}

export interface ExamStyleProfileComputed {
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
  sampleSize: number;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function mode(nums: number[]): number {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = 5;
  let bestCount = 0;
  for (const [n, c] of counts) {
    if (c > bestCount) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}

const NEGATIVE_RE = /incorret|exceto|não\s+é|falsa|incorreta/i;
const LEGAL_RE = /\bart\.|lei\s+n|súmula/i;
const OPENERS = ["Assinale", "Considere", "De acordo com", "Julgue", "Com base"];

export function computeStyleProfile(samples: PreviousQuestionSample[]): ExamStyleProfileComputed {
  const n = samples.length;
  if (n === 0) {
    return {
      optionCount: 5,
      stemLengthP50: 120,
      stemLengthP90: 220,
      passageRate: 0,
      negativeStemRate: 0.1,
      assertionStyleRate: 0.3,
      numericRate: 0.1,
      legalCitationRate: 0.2,
      commandVerbs: ["Assinale", "Considere"],
      certoErrado: false,
      difficultyProxy: 0.5,
      sampleSize: 0,
    };
  }

  const optionCounts = samples.map((s) => s.options.length);
  const stems = samples.map((s) => s.prompt.length).sort((a, b) => a - b);
  const withPassage = samples.filter((s) => (s.passage ?? "").trim().length > 0).length;
  const negative = samples.filter((s) => NEGATIVE_RE.test(s.prompt)).length;
  const assertion = samples.filter(
    (s) => s.options.length > 0 && s.options.reduce((a, o) => a + o.length, 0) / s.options.length > 60,
  ).length;
  const numeric = samples.filter((s) =>
    s.options.every((o) => /^[\d\s.,R$%\/\-]+$/.test(o.trim()) || /\d/.test(o)),
  ).length;
  const legal = samples.filter((s) => LEGAL_RE.test(`${s.prompt} ${s.options.join(" ")}`)).length;

  const openerCounts = new Map<string, number>();
  for (const s of samples) {
    for (const opener of OPENERS) {
      if (s.prompt.trim().startsWith(opener) || new RegExp(`^${opener}\\b`, "i").test(s.prompt)) {
        openerCounts.set(opener, (openerCounts.get(opener) ?? 0) + 1);
      }
    }
  }
  const commandVerbs = [...openerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);
  if (commandVerbs.length === 0) commandVerbs.push("Assinale");

  const optionCount = mode(optionCounts);
  const certoErrado =
    optionCount === 2 &&
    samples.filter((s) =>
      s.options.every((o) => /^(certo|errado|verdadeiro|falso)$/i.test(o.trim())),
    ).length >= n * 0.5;

  const stemZ = stems.reduce((a, b) => a + b, 0) / n / 200;
  const difficultyProxy = Math.max(0, Math.min(1, 0.4 * stemZ + 0.3 * (legal / n) + 0.3 * (assertion / n)));

  return {
    optionCount,
    stemLengthP50: percentile(stems, 50),
    stemLengthP90: percentile(stems, 90),
    passageRate: withPassage / n,
    negativeStemRate: negative / n,
    assertionStyleRate: assertion / n,
    numericRate: numeric / n,
    legalCitationRate: legal / n,
    commandVerbs,
    certoErrado,
    difficultyProxy,
    sampleSize: n,
  };
}
