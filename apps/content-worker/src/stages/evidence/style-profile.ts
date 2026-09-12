/** Deterministic ExamStyleProfile aggregation (§18.4). */

export interface StyleSample {
  prompt: string;
  options: string[];
  passage?: string | null;
}

export interface ExamStyleProfileData {
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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function mode(nums: number[]): number {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = 5;
  let bestC = -1;
  for (const [k, c] of counts) {
    if (c > bestC) {
      best = k;
      bestC = c;
    }
  }
  return best;
}

export function buildStyleProfile(samples: StyleSample[]): ExamStyleProfileData {
  if (samples.length === 0) {
    return {
      optionCount: 5,
      stemLengthP50: 120,
      stemLengthP90: 280,
      passageRate: 0,
      negativeStemRate: 0.1,
      assertionStyleRate: 0.3,
      numericRate: 0.1,
      legalCitationRate: 0.2,
      commandVerbs: ["Assinale", "Considere", "De acordo com"],
      certoErrado: false,
      difficultyProxy: 0.5,
    };
  }

  const optionCounts = samples.map((s) => s.options.length);
  const stems = samples.map((s) => s.prompt.length).sort((a, b) => a - b);
  const passageRate = samples.filter((s) => (s.passage ?? "").length > 40).length / samples.length;
  const negativeStemRate =
    samples.filter((s) => /incorret|exceto|n[aã]o\s+[eé]|falsa/i.test(s.prompt)).length /
    samples.length;
  const assertionStyleRate =
    samples.filter((s) => {
      const avg = s.options.reduce((n, o) => n + o.length, 0) / Math.max(1, s.options.length);
      return avg > 60;
    }).length / samples.length;
  const numericRate =
    samples.filter((s) => s.options.filter((o) => /^\s*[\d.,%R$]+/.test(o)).length >= 3).length /
    samples.length;
  const legalCitationRate =
    samples.filter((s) => /art\.|lei\s+n|s[uú]mula/i.test(s.prompt)).length / samples.length;

  const openers = new Map<string, number>();
  for (const s of samples) {
    const m = s.prompt.match(/^(Assinale|Considere|De acordo com|Julgue|Segundo|Com base)/i);
    if (m) openers.set(m[1], (openers.get(m[1]) ?? 0) + 1);
  }
  const commandVerbs = [...openers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);

  const optionCount = mode(optionCounts);
  const certoErrado =
    optionCount === 2 &&
    samples.some((s) => /certo|errado/i.test(s.options.join(" ")));

  const difficultyProxy = Math.min(
    1,
    0.35 * (percentile(stems, 50) / 250) +
      0.35 * assertionStyleRate +
      0.3 * legalCitationRate,
  );

  return {
    optionCount,
    stemLengthP50: percentile(stems, 50),
    stemLengthP90: percentile(stems, 90),
    passageRate,
    negativeStemRate,
    assertionStyleRate,
    numericRate,
    legalCitationRate,
    commandVerbs: commandVerbs.length ? commandVerbs : ["Assinale", "Considere"],
    certoErrado,
    difficultyProxy,
  };
}
