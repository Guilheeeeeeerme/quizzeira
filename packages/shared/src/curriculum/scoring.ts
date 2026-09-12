/** Section quality scoring (§20). */

import { metadataProbability } from "./metadata";
import { clamp01, computeTextStats, type SectionScores } from "./text-stats";

const EDUCATIONAL_RE =
  /\b([eé]\s+(o|a)\s+\w+\s+que|define-se|consiste\s+em|por\s+exemplo|ex\.?:|regra|deve|sempre|nunca|exce[cç][aã]o|art\.|lei\s+n)\b/gi;

const DECLARATIVE_CLAIM_RE =
  /\b(deve|n[aã]o\s+deve|[eé]\s+vedado|considera-se|constitui|ocorre|resulta)\b/i;

const HEDGE_RE = /\b(pode\s+ser|geralmente|talvez|eventualmente)\b/i;

const GARBAGE_RE = /[�]{2,}|\u0000|[\x00-\x08\x0B\x0C\x0E-\x1F]{3,}/;

export function scoreSection(text: string, linkChars = 0): SectionScores {
  const stats = computeTextStats(text, linkChars);
  const paragraphShare = clamp01(stats.paragraphCount / Math.max(1, stats.wordCount / 40));
  const contentDensity = clamp01(
    (1 - stats.linkDensity) * paragraphShare * Math.min(1, stats.avgParagraphChars / 250),
  );

  const eduHits = (text.match(EDUCATIONAL_RE) ?? []).length;
  const educationalSignal = clamp01(eduHits / Math.max(3, stats.paragraphCount));

  const meta = metadataProbability(text);

  const sentences = text.split(/[.!?;]+/).map((s) => s.trim()).filter((s) => s.length > 20);
  let testable = 0;
  for (const s of sentences) {
    if (DECLARATIVE_CLAIM_RE.test(s) && !HEDGE_RE.test(s)) testable += 1;
  }
  const testability = sentences.length ? clamp01(testable / sentences.length) : 0;

  const garbage = GARBAGE_RE.test(text) ? 0.6 : 0;
  const shortNoise = stats.charCount < 80 ? 0.4 : 0;
  const noise = clamp01(garbage + shortNoise);

  let sectionQuality =
    0.3 * contentDensity + 0.3 * educationalSignal + 0.2 * testability + 0.2 * (1 - noise);
  if (meta > 0.6) sectionQuality = 0;

  return {
    contentDensity,
    educationalSignal,
    metadataProbability: meta,
    testability,
    noise,
    sectionQuality: clamp01(sectionQuality),
  };
}

export const ELIGIBILITY_THRESHOLDS = {
  sectionQualityMin: 0.45,
  metadataProbabilityMax: 0.35,
  noiseMax: 0.3,
  charCountMin: 300,
  charCountMax: 4000,
} as const;
