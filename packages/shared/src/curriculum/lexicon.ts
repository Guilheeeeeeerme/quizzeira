// Concept: Subject canonicalisation (§15.5). Raw edital wording is kept on the
// node; the canonical id is what the knowledge index and the style profile key on.
import { slugifyKey } from "../slug";
import { tokenSetRatio } from "../fuzzy";
import { foldAccents } from "../dedup/text-normalize";
import { CANONICAL_SUBJECTS, LEGAL_SUBJECT_IDS, type CanonicalSubject } from "./subjects";

export { CANONICAL_SUBJECTS, LEGAL_SUBJECT_IDS, type CanonicalSubject };

export const SUBJECT_MATCH_THRESHOLD = 80;

export interface CanonicalizedSubject {
  id: string;
  canonical: string;
  score: number;
  method: "exact" | "alias" | "fuzzy";
}

function clean(name: string): string {
  return foldAccents(name)
    .toLowerCase()
    .replace(/\b(nocoes|noções|basicas|básicas|basico|básico|de|do|da|dos|das|e)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const EXACT_INDEX: Map<string, CanonicalSubject> = (() => {
  const index = new Map<string, CanonicalSubject>();
  for (const subject of CANONICAL_SUBJECTS) {
    index.set(clean(subject.canonical), subject);
    for (const alias of subject.aliases) index.set(clean(alias), subject);
  }
  return index;
})();

export function subjectById(id: string): CanonicalSubject | null {
  return CANONICAL_SUBJECTS.find((s) => s.id === id) ?? null;
}

/**
 * Alias/fuzzy match against the lexicon. Returns null below the threshold so a
 * novel subject ("Legislação do TCE-GO") keeps its raw wording as its own key.
 */
export function canonicalizeSubject(raw: string): CanonicalizedSubject | null {
  const name = raw.replace(/\s+/g, " ").trim().replace(/[:.\-–—]+$/, "").trim();
  if (!name) return null;
  const key = clean(name);
  const exact = EXACT_INDEX.get(key);
  if (exact) {
    return {
      id: exact.id,
      canonical: exact.canonical,
      score: 100,
      method: clean(exact.canonical) === key ? "exact" : "alias",
    };
  }
  let best: CanonicalizedSubject | null = null;
  for (const subject of CANONICAL_SUBJECTS) {
    const candidates = [subject.canonical, ...subject.aliases];
    for (const candidate of candidates) {
      const score = tokenSetRatio(name, candidate);
      // Guard against short tokens like "TI" matching everything.
      if (score >= SUBJECT_MATCH_THRESHOLD && (best === null || score > best.score)) {
        if (clean(candidate).length < 4 && clean(candidate) !== key) continue;
        best = { id: subject.id, canonical: subject.canonical, score, method: "fuzzy" };
      }
    }
  }
  return best;
}

/** Canonical key for a leaf: `${subjectId}:${slug(title)}` (§16.4). */
export function canonicalKey(subjectId: string | null, leafTitle: string, rawSubject?: string): string {
  const subject = subjectId ?? `raw-${slugifyKey(rawSubject ?? "geral", 40)}`;
  return `${subject}:${slugifyKey(leafTitle, 80)}`;
}

export function isLegalSubject(subjectId: string | null | undefined): boolean {
  return subjectId != null && LEGAL_SUBJECT_IDS.has(subjectId);
}

/** True when a line looks like a subject header rather than a topic item. */
export function looksLikeSubjectHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  if (/^\d+(\.\d+)*[.)]?\s/.test(trimmed) && !/^\d+[.)]?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+:?$/.test(trimmed)) {
    return false;
  }
  const bare = trimmed.replace(/[:.\-–—]+$/, "").trim();
  const letters = bare.replace(/[^\p{L}]/gu, "");
  const upperShare = letters.length ? letters.replace(/[^\p{Lu}]/gu, "").length / letters.length : 0;
  if (upperShare >= 0.8 && letters.length >= 4) return true;
  return canonicalizeSubject(bare) !== null && bare.split(/\s+/).length <= 8;
}
