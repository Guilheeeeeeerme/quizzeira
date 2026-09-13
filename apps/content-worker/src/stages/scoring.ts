// Concept: Section quality scores (§20) — deterministic, no LLM.

import { metadataProbability } from "@quizzeira/shared";

export interface SectionScores {
  contentDensity: number;
  metadataProbability: number;
  educationalSignal: number;
  testability: number;
  noise: number;
  sectionQuality: number;
}

const DEFINITION_RE =
  /\b(?:é\s+(?:o|a)\s+\w+\s+que|define-se|consiste em|caracteriza-se por)\b/gi;
const EXAMPLE_RE = /\b(?:por exemplo|ex\.:|exemplo:)\b/gi;
const RULE_RE = /\b(?:regra|deve|sempre|nunca|exceção)\b/gi;
const CLAIM_RE = /\b(?:art\.|lei|decreto|\d+%|\d{4})\b/gi;
const HEDGE_RE = /\b(?:pode ser|geralmente|em tese)\b/gi;

export function computeLinkDensity(text: string): number {
  const links = (text.match(/https?:\/\/\S+|href\s*=/gi) ?? []).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.min(1, links / Math.max(words / 20, 1));
}

export function computeContentDensity(text: string, linkDensity?: number): number {
  const ld = linkDensity ?? computeLinkDensity(text);
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const paragraphShare =
    paragraphs.length === 0
      ? 0
      : paragraphs.filter((p) => p.length >= 80).length / paragraphs.length;
  const avgParagraph =
    paragraphs.length === 0
      ? 0
      : paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
  return (1 - ld) * paragraphShare * Math.min(1, avgParagraph / 250);
}

function educationalSignal(text: string): number {
  const chars = Math.max(text.length, 1);
  const hits =
    countMatches(text, DEFINITION_RE) +
    countMatches(text, EXAMPLE_RE) +
    countMatches(text, RULE_RE);
  return Math.min(1, (hits * 200) / chars);
}

function testability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  if (sentences.length === 0) return 0;
  let score = 0;
  for (const s of sentences) {
    if (HEDGE_RE.test(s)) continue;
    if (CLAIM_RE.test(s)) score += 1;
  }
  return Math.min(1, score / sentences.length);
}

function noise(text: string): number {
  const garbage = (text.match(/[^\p{L}\p{N}\s.,;:!?\-—()"'%$]/gu) ?? []).length;
  return Math.min(1, garbage / Math.max(text.length, 1));
}

function countMatches(text: string, re: RegExp): number {
  const copy = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  return (text.match(copy) ?? []).length;
}

export function computeSectionScores(text: string): SectionScores {
  const meta = metadataProbability(text);
  const density = computeContentDensity(text);
  const edu = educationalSignal(text);
  const test = testability(text);
  const n = noise(text);
  let sectionQuality = 0.3 * density + 0.3 * edu + 0.2 * test + 0.2 * (1 - n);
  if (meta > 0.6) sectionQuality = 0;

  return {
    contentDensity: density,
    metadataProbability: meta,
    educationalSignal: edu,
    testability: test,
    noise: n,
    sectionQuality,
  };
}
