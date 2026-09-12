// Concept: Deterministic edital syllabus parser (§15.2).

import {
  canonicalizeSubject,
  slugifyKey,
  type NormalizedDocument,
} from "@quizzeira/shared";
import type { ClassifiedSection } from "../classify.js";
import { discoverPositions, type DiscoveredPosition } from "./positions.js";

export interface SyllabusNodeDraft {
  depth: 0 | 1 | 2 | 3;
  ordinal: number;
  title: string;
  rawText: string;
  pathSlug: string;
  canonicalSubjectId: string | null;
  canonicalKey: string;
  scope: "basic" | "specific";
  positionSlugs: string[];
  parentPathSlug: string | null;
  extraction: { method: "outline" | "llm_structured" | "manual"; confidence: number; sourceSectionId: string };
}

export interface ParsedSyllabus {
  positions: DiscoveredPosition[];
  nodes: SyllabusNodeDraft[];
  status: "active" | "needs_review";
}

const SUBJECT_HEADER_RE =
  /^([A-ZÁÉÍÓÚÃÕÇ0-9][A-ZÁÉÍÓÚÃÕÇ0-9\s\-–—]{2,78}):?\s*$/;
const OUTLINE_ITEM_RE = /(?:^|\n)\s*(?:\d+(?:\.\d+)*[.)]|[a-z]\))\s+([^\n;]+)/gi;
const SCOPE_BASIC_RE = /conhecimentos?\s+(b[aá]sicos|gerais|comuns)/i;
const SCOPE_SPECIFIC_RE = /conhecimentos?\s+espec[íi]ficos/i;
const ADMIN_ITEM_RE =
  /\b(vagas?|remunera[cç][ãa]o|sal[aá]rio|taxa|inscri[cç][ãa]o|cronograma|boleto)\b/i;

function normalizeItem(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  t = t.replace(/[.;,\s]+$/, "");
  if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}

function splitOutlineItems(body: string): string[] {
  const items: string[] = [];
  for (const m of body.matchAll(OUTLINE_ITEM_RE)) {
    const item = normalizeItem(m[1]);
    if (item.length > 0 && item.length <= 200 && !ADMIN_ITEM_RE.test(item)) {
      items.push(item);
    }
  }
  if (items.length > 0) return items;

  // Prefer newline-separated list items (HTML <li>) over semicolon mash.
  if (/\n/.test(body)) {
    for (const part of body.split(/\n+/)) {
      const item = normalizeItem(part.replace(/^[•\-*–—]\s*/, ""));
      if (item.length >= 8 && item.length <= 200 && !ADMIN_ITEM_RE.test(item)) {
        items.push(item);
      }
    }
    if (items.length > 0) return items;
  }

  for (const part of body.split(/[;]\s+/)) {
    const item = normalizeItem(part);
    if (item.length >= 8 && item.length <= 200 && !ADMIN_ITEM_RE.test(item)) {
      items.push(item);
    }
  }
  return items;
}

/** Subject headers only — do not fuzzy-match list tips into wrong subjects. */
function subjectFromLine(line: string): { title: string; canonicalId: string | null } | null {
  const trimmed = line.trim();
  const caps = SUBJECT_HEADER_RE.exec(trimmed);
  if (caps) {
    const title = normalizeItem(caps[1]);
    const canonical = canonicalizeSubject(title);
    return { title: canonical?.title ?? title, canonicalId: canonical?.id ?? null };
  }
  // Heading-style: short title ending with colon, or known subject exact title.
  const bare = trimmed.replace(/:$/, "").trim();
  if (bare.length < 4 || bare.length > 80) return null;
  if (!/:$/.test(trimmed) && !/^[A-ZÁÉÍÓÚÃÕÇ]/.test(bare)) return null;
  const canonical = canonicalizeSubject(bare);
  if (!canonical) return null;
  // Require near-exact title match to avoid alias collisions ("Atos administrativos").
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
  if (norm(canonical.title) !== norm(bare) && !norm(bare).startsWith(norm(canonical.title))) {
    return null;
  }
  return { title: canonical.title, canonicalId: canonical.id };
}

function buildPathSlug(parts: string[]): string {
  return parts.map((p) => slugifyKey(p)).join("/");
}

export function parseSyllabusFromDocument(
  doc: NormalizedDocument,
  sections: ClassifiedSection[],
  positions: DiscoveredPosition[],
): ParsedSyllabus {
  const syllabusSections = sections.filter((s) => s.role === "syllabus");
  const sourceSections = syllabusSections.length > 0 ? syllabusSections : sections;
  const nodes: SyllabusNodeDraft[] = [];
  let ordinal = 0;
  let scope: "basic" | "specific" = "basic";
  let positionSlugs: string[] = positions.filter((p) => !p.implicit).map((p) => p.slug);
  if (positionSlugs.length === 0) positionSlugs = ["geral"];

  for (const { section } of sourceSections) {
    const lines = section.text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let currentSubject: { title: string; canonicalId: string | null; pathSlug: string } | null =
      null;

    if (SCOPE_BASIC_RE.test(section.heading ?? section.text)) scope = "basic";
    if (SCOPE_SPECIFIC_RE.test(section.heading ?? section.text)) scope = "specific";

    // Prefer section heading as subject so list tips are not fuzzy-matched away.
    if (section.heading) {
      const subj = subjectFromLine(section.heading);
      if (subj) {
        const pathSlug = buildPathSlug([subj.title]);
        currentSubject = { ...subj, pathSlug };
        nodes.push({
          depth: 0,
          ordinal: ordinal++,
          title: subj.title,
          rawText: section.heading,
          pathSlug,
          canonicalSubjectId: subj.canonicalId,
          canonicalKey: pathSlug,
          scope,
          positionSlugs: scope === "basic" ? positionSlugs : positionSlugs.slice(0, 1),
          parentPathSlug: null,
          extraction: {
            method: "outline",
            confidence: subj.canonicalId ? 0.9 : 0.75,
            sourceSectionId: section.id,
          },
        });
        for (const item of splitOutlineItems(section.text)) {
          nodes.push({
            depth: 1,
            ordinal: ordinal++,
            title: item,
            rawText: item,
            pathSlug: buildPathSlug([subj.title, item]),
            canonicalSubjectId: null,
            canonicalKey: buildPathSlug([subj.title, item]),
            scope,
            positionSlugs: scope === "basic" ? positionSlugs : positionSlugs.slice(0, 1),
            parentPathSlug: pathSlug,
            extraction: {
              method: "outline",
              confidence: 0.75,
              sourceSectionId: section.id,
            },
          });
        }
        continue;
      }
    }

    for (const line of lines) {
      if (SCOPE_BASIC_RE.test(line)) {
        scope = "basic";
        continue;
      }
      if (SCOPE_SPECIFIC_RE.test(line)) {
        scope = "specific";
        continue;
      }

      const subject = subjectFromLine(line);
      if (subject) {
        const pathSlug = buildPathSlug([subject.title]);
        currentSubject = { ...subject, pathSlug };
        nodes.push({
          depth: 0,
          ordinal: ordinal++,
          title: subject.title,
          rawText: line,
          pathSlug,
          canonicalSubjectId: subject.canonicalId,
          canonicalKey: pathSlug,
          scope,
          positionSlugs: scope === "basic" ? positionSlugs : positionSlugs.slice(0, 1),
          parentPathSlug: null,
          extraction: {
            method: "outline",
            confidence: subject.canonicalId ? 0.9 : 0.7,
            sourceSectionId: section.id,
          },
        });
        continue;
      }

      if (!currentSubject) continue;
      const items = splitOutlineItems(line);
      for (const item of items) {
        const pathSlug = buildPathSlug([currentSubject.title, item]);
        nodes.push({
          depth: 1,
          ordinal: ordinal++,
          title: item,
          rawText: item,
          pathSlug,
          canonicalSubjectId: null,
          canonicalKey: pathSlug,
          scope,
          positionSlugs: scope === "basic" ? positionSlugs : positionSlugs.slice(0, 1),
          parentPathSlug: currentSubject.pathSlug,
          extraction: {
            method: "outline",
            confidence: 0.75,
            sourceSectionId: section.id,
          },
        });
      }
    }
  }

  const leaves = nodes.filter((n) => n.depth >= 1);
  const status =
    leaves.length >= 10 && leaves.length <= 600 && nodes.some((n) => n.depth === 0)
      ? "active"
      : "needs_review";

  return {
    positions: discoverPositions(doc, sections),
    nodes,
    status,
  };
}

/** Post parsed syllabus to content-api. */
export async function postSyllabus(
  content: { post: <T>(path: string, body?: unknown) => Promise<T> },
  input: {
    examSlug: string;
    documentId: string;
    contentHash: string;
    parsed: ParsedSyllabus;
  },
): Promise<{ syllabusId: string }> {
  const result = await content.post<{ syllabusId: string }>("/internal/syllabi", {
    examSlug: input.examSlug,
    sourceDocumentId: input.documentId,
    sourceDocumentHash: input.contentHash,
    status: input.parsed.status,
    positions: input.parsed.positions,
    nodes: input.parsed.nodes,
  });
  return result;
}
