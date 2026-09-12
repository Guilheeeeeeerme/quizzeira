/** Text statistics for content quality scoring (§20). */

export interface TextStats {
  charCount: number;
  wordCount: number;
  paragraphCount: number;
  linkDensity: number;
  avgParagraphChars: number;
  languageGuess: "pt" | "en" | "other" | "unknown";
}

const PT_MARKERS = /\b(de|da|do|que|para|com|uma|não|nao|são|sao|pela|pelo|conteúdo|conteudo)\b/gi;
const EN_MARKERS = /\b(the|and|for|with|that|this|from|are|was|have)\b/gi;

export function computeTextStats(text: string, linkChars = 0): TextStats {
  const charCount = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgParagraphChars =
    paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphCount;
  const linkDensity = charCount > 0 ? Math.min(1, linkChars / charCount) : 0;

  const pt = (text.match(PT_MARKERS) ?? []).length;
  const en = (text.match(EN_MARKERS) ?? []).length;
  let languageGuess: TextStats["languageGuess"] = "unknown";
  if (pt + en >= 5) {
    if (pt >= en * 1.2) languageGuess = "pt";
    else if (en >= pt * 1.2) languageGuess = "en";
    else languageGuess = "other";
  }

  return {
    charCount,
    wordCount: words.length,
    paragraphCount,
    linkDensity,
    avgParagraphChars,
    languageGuess,
  };
}

export interface SectionScores {
  contentDensity: number;
  educationalSignal: number;
  metadataProbability: number;
  testability: number;
  noise: number;
  sectionQuality: number;
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
