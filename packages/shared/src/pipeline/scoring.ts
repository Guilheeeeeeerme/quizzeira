// Concept: Content quality scoring (§20) — per-section, deterministic. Chunks
// inherit their section's scores so chunk boundaries never move a score.
import { metadataProbability } from "../curriculum/metadata";
import {
  EXPLANATORY_RE,
  LEGAL_CITATION_RE,
  countMatches,
  per500,
  sentences,
  words,
} from "../curriculum/text-stats";
import type { Block, Section } from "./normalized-document";

export interface SectionScores {
  contentDensity: number;
  educationalSignal: number;
  metadataProbability: number;
  testability: number;
  noise: number;
  sectionQuality: number;
}

/** Single tunables object with golden tests (§13.3, §20). */
export const QUALITY_THRESHOLDS = {
  sectionQualityMin: 0.45,
  metadataProbabilityMax: 0.35,
  metadataGate: 0.6,
  noiseMax: 0.3,
  chunkMinChars: 300,
  chunkMaxChars: 4000,
  mapAccept: 0.62,
  mapMargin: 0.05,
  mapLlmBand: 0.45,
  itemMetadataMax: 0.5,
} as const;

export interface SectionScoreInput {
  text: string;
  blocks?: readonly Block[];
  linkDensity?: number;
  ocrLowConfidenceShare?: number;
  glyphNoiseShare?: number;
}

// `\b` is ASCII-only in JS, so accented words use explicit letter look-arounds.
const DEFINITION_RE =
  /(?<!\p{L})[ée]\s+(?:o|a|um|uma)\s+[^.]{3,60}?\s+que\b|\bdefine-se\b|\bconsiste\s+em\b|\bentende-se\s+por\b|\bdenomina-se\b|\bchama-se\b|(?<!\p{L})[ée]\s+(?:a|o)\s+(?:rela[çc][ãa]o|conjunto|processo|ato|instrumento|modalidade)\b/giu;
const EXAMPLE_RE = /\bpor\s+exemplo\b|\bex\.\s*:|\bexemplo\s*:|\bcomo\s+em\b|\ba\s+exemplo\s+de\b/gi;
const RULE_RE = /\bregra\b|\bdeve(?:m|r[áa])?\b|\bsempre\b|\bnunca\b|\bexce[çc][ãa]o\b|\bobrigat[óo]ri[oa]\b|\bproibid[oa]\b|\bpermitid[oa]\b|\bsalvo\b/gi;
const WORKED_PROBLEM_RE = /\d[\d.,]*\s*(?:[+\-×x*/÷]|%)\s*\d|=\s*\d/g;
const ENUMERATION_RE = /(?:^|\n)\s*(?:[a-e]\)|[•\-–]|\d{1,2}[.)])\s+\S/g;
const HEDGE_RE = /\bpode\s+ser\b|\bgeralmente\b|\btalvez\b|\bpossivelmente\b|\bem\s+geral\b|\bcostuma\b/gi;
const SPECIFIC_CLAIM_RE =
  /\d|(?<!\p{L})[\p{Lu}][\p{Ll}]+\s+[\p{Lu}][\p{Ll}]+(?!\p{L})|\bdeve|(?<!\p{L})(?:é|são|não\s+pode)(?!\p{L})|\bproib|\bobrigat|\bpermit|\bsempre\b|\bnunca\b/u;

function paragraphStats(input: SectionScoreInput): { paragraphShare: number; avgParagraphChars: number } {
  const blocks = input.blocks?.filter((b) => b.text.trim() && b.type !== "heading") ?? [];
  if (blocks.length === 0) {
    const paragraphs = input.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const avg = paragraphs.length
      ? paragraphs.reduce((s, p) => s + p.length, 0) / paragraphs.length
      : input.text.length;
    return { paragraphShare: paragraphs.length ? 1 : 0, avgParagraphChars: avg };
  }
  const paragraphs = blocks.filter((b) => b.type === "paragraph");
  const avg = paragraphs.length
    ? paragraphs.reduce((s, b) => s + b.text.length, 0) / paragraphs.length
    : 0;
  return { paragraphShare: paragraphs.length / blocks.length, avgParagraphChars: avg };
}

export function contentDensity(input: SectionScoreInput): number {
  const { paragraphShare, avgParagraphChars } = paragraphStats(input);
  const linkDensity = input.linkDensity ?? 0;
  return Number(((1 - linkDensity) * paragraphShare * Math.min(1, avgParagraphChars / 250)).toFixed(4));
}

export function educationalSignal(text: string): number {
  const chars = Math.max(1, text.length);
  const scaled = (re: RegExp, max: number) => Math.min(1, per500(countMatches(re, text), chars) / max);
  const definitions = scaled(DEFINITION_RE, 1);
  const examples = scaled(EXAMPLE_RE, 1);
  const rules = scaled(RULE_RE, 2);
  const worked = scaled(WORKED_PROBLEM_RE, 2);
  const enumerations = countMatches(ENUMERATION_RE, text) >= 3 ? 1 : 0;
  const legal = scaled(LEGAL_CITATION_RE, 3);
  const explanatory = scaled(EXPLANATORY_RE, 2);
  const score =
    0.22 * definitions +
    0.18 * examples +
    0.2 * rules +
    0.1 * worked +
    0.1 * enumerations +
    0.1 * legal +
    0.1 * explanatory;
  return Number(Math.min(1, score * 1.6).toFixed(4));
}

export function testability(text: string): number {
  const ss = sentences(text).filter((s) => words(s).length >= 4);
  if (ss.length === 0) return 0;
  let testable = 0;
  for (const s of ss) {
    const declarative = !/\?$/.test(s) && !/^(?:clique|acesse|veja|confira|leia|inscreva)/i.test(s);
    const specific = SPECIFIC_CLAIM_RE.test(s);
    const hedged = HEDGE_RE.test(s);
    if (declarative && specific && !hedged) testable += 1;
    else if (declarative && specific && hedged) testable += 0.5;
  }
  return Number((testable / ss.length).toFixed(4));
}

export function noiseScore(input: SectionScoreInput): number {
  const text = input.text;
  const compact = text.replace(/\s+/g, "");
  const alpha = compact.length ? (compact.match(/\p{L}/gu)?.length ?? 0) / compact.length : 1;
  const garbage = alpha < 0.6 ? 1 - alpha : 0;
  const privateUse = compact.length ? (compact.match(/[\uE000-\uF8FF]/g)?.length ?? 0) / compact.length : 0;
  const noise = Math.min(1, garbage + (input.ocrLowConfidenceShare ?? 0) + Math.min(1, privateUse * 5 + (input.glyphNoiseShare ?? 0)));
  return Number(noise.toFixed(4));
}

export function scoreSection(input: SectionScoreInput): SectionScores {
  const density = contentDensity(input);
  const educational = educationalSignal(input.text);
  const metadata = metadataProbability(input.text);
  const test = testability(input.text);
  const noise = noiseScore(input);
  const raw = 0.3 * density + 0.3 * educational + 0.2 * test + 0.2 * (1 - noise);
  const sectionQuality = metadata > QUALITY_THRESHOLDS.metadataGate ? 0 : Number(raw.toFixed(4));
  return {
    contentDensity: density,
    educationalSignal: educational,
    metadataProbability: metadata,
    testability: test,
    noise,
    sectionQuality,
  };
}

export function scoreSectionOf(section: Section, blocks: readonly Block[], linkDensity?: number): SectionScores {
  const [start, end] = section.blockRange;
  const own = blocks.slice(start, end + 1).filter((b) => !b.flags?.length);
  const links = own.reduce((s, b) => s + (b.linkChars ?? 0), 0);
  const chars = own.reduce((s, b) => s + b.text.replace(/\s+/g, "").length, 0);
  return scoreSection({
    text: section.text,
    blocks: own,
    linkDensity: linkDensity ?? (chars > 0 ? Math.min(1, links / chars) : 0),
  });
}

/** §19.2 structure score: headings, lists and examples present. */
export function structureScore(blocks: readonly Block[]): number {
  if (blocks.length === 0) return 0;
  const headings = blocks.filter((b) => b.type === "heading").length;
  const lists = blocks.filter((b) => b.type === "list_item").length;
  const text = blocks.map((b) => b.text).join("\n");
  const examples = countMatches(EXAMPLE_RE, text);
  const headingShare = headings / blocks.length;
  const score =
    (headingShare >= 0.02 && headingShare <= 0.2 ? 0.5 : headings > 0 ? 0.25 : 0) +
    (lists > 0 ? 0.25 : 0) +
    (examples > 0 ? 0.25 : 0);
  return Number(score.toFixed(2));
}
