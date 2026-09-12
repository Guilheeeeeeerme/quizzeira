// Concept: Generation brief assembly (§24.2).

import { LISTING_TRIVIA_STEM_RE, looksLikeListingTriviaStem } from "@quizzeira/shared";
import type { StyleProfile } from "../stages/evidence/style-profile.js";

export { LISTING_TRIVIA_STEM_RE, looksLikeListingTriviaStem };

export interface KnowledgeUnitRef {
  id: string;
  kind: string;
  statement: string;
  example: string | null;
  qualifiers: string[];
  /** Domain of primary evidence source (§19.3 diversity). */
  sourceDomain?: string | null;
}

export interface GenerationBrief {
  exam: { title: string; org: string; banca: string | null; year: number | null };
  position: { title: string } | null;
  syllabus: {
    subject: string;
    topic: string | null;
    subtopic: string;
    path: string[];
    rawText: string;
  };
  style: StyleProfile;
  difficulty: { target: 0.3 | 0.5 | 0.7; rationale: string };
  knowledge: KnowledgeUnitRef[];
  exemplars: Array<{ id?: string; stem: string; options: string[]; note: "formato apenas" }>;
  avoid: Array<{ stem: string }>;
  constraints: {
    count: number;
    optionCount: number;
    forbidden: string[];
    /** Regex source string for listing-trivia stem rejection (§43.2.3). */
    stemDenylist: string;
    mustCite: true;
    language: "pt-BR";
  };
}

export const FORBIDDEN_QUESTION_TOPICS = [
  "B1: exam metadata (organiser, banca, edital, vacancies, salary, fees, dates, venues, requirements)",
  "B2: syllabus meta-knowledge (which topics are on the exam)",
  "B3: portal/navigation content",
  "B4: procedural instructions to candidates",
];

const DEFAULT_STYLE: StyleProfile = {
  optionCount: 5,
  stemLengthP50: 120,
  stemLengthP90: 220,
  passageRate: 0,
  negativeStemRate: 0.2,
  assertionStyleRate: 0.5,
  numericRate: 0,
  legalCitationRate: 0.1,
  commandVerbs: ["Assinale", "Considere", "De acordo com"],
  certoErrado: false,
  difficultyProxy: 0.5,
};

/**
 * Pick up to `limit` KUs with ≥2 domains when available and ≤60% from one domain (§19.3).
 */
export function diversifyKnowledgeUnits(
  units: KnowledgeUnitRef[],
  limit = 12,
): KnowledgeUnitRef[] {
  if (units.length === 0 || limit <= 0) return [];
  const pool = units.slice();
  const byDomain = new Map<string, KnowledgeUnitRef[]>();
  for (const u of pool) {
    const d = (u.sourceDomain || "unknown").toLowerCase();
    const list = byDomain.get(d) ?? [];
    list.push(u);
    byDomain.set(d, list);
  }
  const domains = [...byDomain.keys()];
  if (domains.length <= 1) return pool.slice(0, limit);

  const picked: KnowledgeUnitRef[] = [];
  const counts = new Map<string, number>();
  const maxPerDomain = Math.max(1, Math.floor(limit * 0.6));

  let progress = true;
  while (picked.length < limit && progress) {
    progress = false;
    for (const d of domains) {
      if (picked.length >= limit) break;
      const bucket = byDomain.get(d) ?? [];
      if (bucket.length === 0) continue;
      if ((counts.get(d) ?? 0) >= maxPerDomain) continue;
      picked.push(bucket.shift()!);
      counts.set(d, (counts.get(d) ?? 0) + 1);
      progress = true;
    }
  }

  if (picked.length < limit) {
    for (const d of domains) {
      const bucket = byDomain.get(d) ?? [];
      while (bucket.length > 0 && picked.length < limit) {
        if ((counts.get(d) ?? 0) >= maxPerDomain) break;
        picked.push(bucket.shift()!);
        counts.set(d, (counts.get(d) ?? 0) + 1);
      }
    }
  }

  return picked;
}

export function buildGenerationBrief(input: {
  examTitle: string;
  examSlug: string;
  syllabusNodeId: string;
  path: string[];
  rawText: string;
  knowledgeUnits: KnowledgeUnitRef[];
  existingStems: string[];
  count: number;
  style?: StyleProfile | null;
  exemplars?: Array<{ id?: string; stem: string; options: string[]; note: "formato apenas" }>;
  banca?: string | null;
  year?: number | null;
  positionTitle?: string | null;
}): GenerationBrief {
  const path = input.path.map((p) => p.trim()).filter(Boolean);
  const subject =
    path[0] ||
    input.rawText.split(/[›>\/|]/)[0]?.trim() ||
    input.syllabusNodeId;
  const subtopic = path[path.length - 1] ?? subject;
  const topic = path.length > 2 ? path[1]! : path.length === 2 ? path[1]! : null;
  const style = input.style ?? DEFAULT_STYLE;

  const knowledge = diversifyKnowledgeUnits(input.knowledgeUnits, 12);

  return {
    exam: {
      title: input.examTitle,
      org: input.examSlug,
      banca: input.banca ?? null,
      year: input.year ?? null,
    },
    position: input.positionTitle ? { title: input.positionTitle } : null,
    syllabus: { subject, topic, subtopic, path, rawText: input.rawText },
    style,
    difficulty: {
      target: style.difficultyProxy >= 0.65 ? 0.7 : style.difficultyProxy <= 0.35 ? 0.3 : 0.5,
      rationale: style === DEFAULT_STYLE ? "default_mid" : "style_profile",
    },
    knowledge,
    exemplars: (input.exemplars ?? []).slice(0, 3),
    avoid: input.existingStems.map((stem) => ({ stem })),
    constraints: {
      count: input.count,
      optionCount: style.optionCount || 5,
      forbidden: FORBIDDEN_QUESTION_TOPICS,
      stemDenylist: LISTING_TRIVIA_STEM_RE.source,
      mustCite: true,
      language: "pt-BR",
    },
  };
}
