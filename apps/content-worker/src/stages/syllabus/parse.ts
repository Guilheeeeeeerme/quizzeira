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
  /^([A-ZÁÉÍÓÚÂÊÔÀÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÀÃÕÇ0-9\s\-–—,\/()&]{2,88}):?\s*$/;
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
  // Min length 4 keeps short tips ("Crase", "NBC TSP") while dropping junk.
  if (/\n/.test(body)) {
    for (const part of body.split(/\n+/)) {
      const item = normalizeItem(part.replace(/^[•\-*–—]\s*/, ""));
      if (item.length >= 4 && item.length <= 200 && !ADMIN_ITEM_RE.test(item)) {
        items.push(item);
      }
    }
    if (items.length > 0) return items;
  }

  for (const part of body.split(/[;]\s+/)) {
    const item = normalizeItem(part);
    if (item.length >= 4 && item.length <= 200 && !ADMIN_ITEM_RE.test(item)) {
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
  const bare = trimmed.replace(/:$/, "").trim();
  if (bare.length < 4 || bare.length > 80) return null;
  if (!/:$/.test(trimmed) && !/^[A-ZÁÉÍÓÚÃÕÇ]/.test(bare)) return null;
  const canonical = canonicalizeSubject(bare);
  if (!canonical) return null;

  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const normBare = norm(bare);
  const normTitle = norm(canonical.title);
  const aliasHit = (canonical.aliases ?? []).some((a) => norm(a) === normBare);
  // Accept exact title, alias, or heading that contains the canonical title
  // ("Noções de Direito Administrativo"). Reject tip collisions where a short
  // alias is a mere substring of a longer tip ("Atos administrativos").
  if (normTitle === normBare || aliasHit) {
    return { title: canonical.title, canonicalId: canonical.id };
  }
  if (normBare.includes(normTitle) && normBare.length <= normTitle.length + 24) {
    return { title: canonical.title, canonicalId: canonical.id };
  }
  return null;
}

/** Free-text heading subject when lexicon has no entry (e.g. Controle Externo). */
function freeTextHeadingSubject(
  heading: string,
): { title: string; canonicalId: string | null } | null {
  const bare = heading.replace(/:$/, "").trim();
  if (bare.length < 4 || bare.length > 80) return null;
  if (SCOPE_BASIC_RE.test(bare) || SCOPE_SPECIFIC_RE.test(bare)) return null;
  if (ADMIN_ITEM_RE.test(bare)) return null;
  if (/^(das?|dos?)\s+/i.test(bare)) return null;
  if (/conte[úu]do\s+program[áa]tico|cronograma|\banexo\b|inscri|vagas/i.test(bare)) {
    return null;
  }
  return { title: normalizeItem(bare), canonicalId: null };
}

function buildPathSlug(parts: string[]): string {
  return parts.map((p) => slugifyKey(p)).join("/");
}

const PROGRAMME_START_RE =
  /conte[úu]dos?\s+program[áa]ticos?|programas?\s+das?\s+provas?|programa\s+de\s+prova/i;
const ANNEX_HEADING_RE = /^\s*anexo\s+([ivx]+|\d+)\b/i;
const PROGRAMME_STOP_RE =
  /^\s*anexo\s+([ivx]+|\d+)\b|^\s*(cronograma|modelo\s+de|requerimento|laudo\s+m[ée]dico|rela[çc][ãa]o\s+de\s+exames)/i;

/**
 * Locate the programme annex ("Anexo II – Programa das Provas", "Conteúdo
 * Programático") by anchors rather than by section role: PDF sectioning often
 * splits it by running page headers and mislabels those pieces.
 */
export function locateProgrammeSpan(sections: ClassifiedSection[]): ClassifiedSection[] {
  let start = -1;
  for (let i = 0; i < sections.length; i += 1) {
    const sec = sections[i]!.section;
    const head = `${sec.heading ?? ""}\n${sec.text.slice(0, 240)}`;
    if (PROGRAMME_START_RE.test(head) && !/\bcada\s+cargo\b|item\s+\d/i.test(sec.heading ?? "")) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];
  const startAnnex = (sections[start]!.section.heading ?? "").match(ANNEX_HEADING_RE)?.[1] ?? null;
  const span: ClassifiedSection[] = [sections[start]!];
  for (let i = start + 1; i < sections.length; i += 1) {
    const sec = sections[i]!.section;
    const heading = sec.heading ?? "";
    const firstLine = sec.text.split(/\n/)[0] ?? "";
    const annex = heading.match(ANNEX_HEADING_RE)?.[1] ?? firstLine.match(ANNEX_HEADING_RE)?.[1] ?? null;
    if (annex && annex !== startAnnex) break;
    if (PROGRAMME_STOP_RE.test(heading) && !PROGRAMME_START_RE.test(heading)) break;
    span.push(sections[i]!);
  }
  return span;
}

/** Lines repeated across the span (page headers/footers, "Página 3 de 40"). */
function runningHeaderLines(lines: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const l of lines) {
    const key = l.trim();
    if (key.length < 4) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out = new Set<string>();
  for (const [k, n] of counts) if (n >= 3) out.add(k);
  return out;
}

function looksLikeSubjectLine(line: string): boolean {
  const t = line.trim().replace(/:$/, "");
  if (t.length < 4 || t.length > 90) return false;
  if (ANNEX_HEADING_RE.test(t) || ADMIN_ITEM_RE.test(t)) return false;
  if (/^\d/.test(t)) return false;
  if (!/[A-ZÁÉÍÓÚÂÊÔÀÃÕÇ]{3}/.test(t)) return false;
  // all caps (allow digits, punctuation) or lexicon subject
  const letters = t.replace(/[^A-Za-zÁÉÍÓÚÂÊÔÀÃÕÇáéíóúâêôàãõç]/g, "");
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÂÊÔÀÃÕÇ]/g, "");
  if (letters.length >= 4 && upper.length / letters.length >= 0.9) return true;
  return Boolean(canonicalizeSubject(t));
}

function splitTopics(body: string): string[] {
  const text = body.replace(/\s+/g, " ").trim();
  if (!text) return [];
  const numbered = [...text.matchAll(/(?:^|\s)(?:\d+(?:\.\d+)*[.)])\s+([^;]+?)(?=(?:\s\d+(?:\.\d+)*[.)]\s)|$)/g)]
    .map((m) => normalizeItem(m[1] ?? ""))
    .filter((t) => t.length >= 4 && t.length <= 200 && !ADMIN_ITEM_RE.test(t));
  if (numbered.length >= 3) return numbered;
  const parts = (text.split(/;\s*/).length >= 3 ? text.split(/;\s*/) : text.split(/\.\s+(?=[A-ZÁÉÍÓÚ])/))
    .map((t) => normalizeItem(t))
    .filter((t) => t.length >= 4 && t.length <= 200 && !ADMIN_ITEM_RE.test(t));
  return parts;
}

/**
 * Programme-span parser: uppercase subject lines (with commas), scope markers,
 * semicolon topic lists joined across wrapped lines, running headers removed.
 */
export function parseProgrammeSpan(
  span: ClassifiedSection[],
  positionSlugs: string[],
): SyllabusNodeDraft[] {
  const rawLines = span.flatMap((s) =>
    `${s.section.heading ?? ""}\n${s.section.text}`.split(/\n+/).map((l) => l.trim()).filter(Boolean),
  );
  const headers = runningHeaderLines(rawLines);
  const lines = rawLines.filter((l) => !headers.has(l) && !/^p[áa]gina\s+\d+/i.test(l) && !/^\d{1,3}$/.test(l));

  const nodes: SyllabusNodeDraft[] = [];
  let ordinal = 0;
  let scope: "basic" | "specific" = "basic";
  let current: { title: string; canonicalId: string | null; pathSlug: string; sectionId: string } | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (!current || buffer.length === 0) return;
    for (const item of splitTopics(buffer.join(" "))) {
      const pathSlug = buildPathSlug([current.title, item]);
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
        parentPathSlug: current.pathSlug,
        extraction: { method: "outline", confidence: 0.8, sourceSectionId: current.sectionId },
      });
    }
    buffer = [];
  };
  const sectionIdFor = (line: string) =>
    span.find((s) => s.section.text.includes(line))?.section.id ?? span[0]!.section.id;

  for (const line of lines) {
    if (SCOPE_BASIC_RE.test(line) && line.length < 60) {
      flush();
      scope = "basic";
      continue;
    }
    if (SCOPE_SPECIFIC_RE.test(line) && line.length < 60) {
      flush();
      scope = "specific";
      continue;
    }
    if (looksLikeSubjectLine(line)) {
      flush();
      const title = normalizeItem(line.replace(/:$/, ""));
      const canonical = canonicalizeSubject(title);
      const subjTitle = canonical?.title ?? title;
      const pathSlug = buildPathSlug([subjTitle]);
      current = { title: subjTitle, canonicalId: canonical?.id ?? null, pathSlug, sectionId: sectionIdFor(line) };
      nodes.push({
        depth: 0,
        ordinal: ordinal++,
        title: subjTitle,
        rawText: line,
        pathSlug,
        canonicalSubjectId: canonical?.id ?? null,
        canonicalKey: pathSlug,
        scope,
        positionSlugs: scope === "basic" ? positionSlugs : positionSlugs.slice(0, 1),
        parentPathSlug: null,
        extraction: { method: "outline", confidence: canonical ? 0.9 : 0.75, sourceSectionId: current.sectionId },
      });
      continue;
    }
    if (current) buffer.push(line);
  }
  flush();
  // Drop subjects that collected no topics (headings of tables, names, etc.).
  const withLeaves = new Set(nodes.filter((n) => n.depth === 1).map((n) => n.parentPathSlug));
  return nodes.filter((n) => n.depth === 1 || withLeaves.has(n.pathSlug));
}

export function parseSyllabusFromDocument(
  doc: NormalizedDocument,
  sections: ClassifiedSection[],
  positions: DiscoveredPosition[],
): ParsedSyllabus {
  const positionSlugsForSpan = (() => {
    const slugs = positions.filter((p) => !p.implicit).map((p) => p.slug);
    return slugs.length > 0 ? slugs : ["geral"];
  })();
  const span = locateProgrammeSpan(sections);
  if (span.length > 0) {
    const nodes = parseProgrammeSpan(span, positionSlugsForSpan);
    const leaves = nodes.filter((n) => n.depth >= 1);
    if (leaves.length >= 10) {
      return {
        positions: discoverPositions(doc, sections),
        nodes,
        status: leaves.length <= 900 ? "active" : "needs_review",
      };
    }
  }

  const syllabusSections = sections.filter((s) => s.role === "syllabus");
  // Prefer syllabus-tagged sections; if none, scan the whole document.
  // When the only syllabus hit is an empty "Conteúdo Programático" wrapper,
  // still fall back to subject sections so leaf tips are recovered (§15 / §42).
  let sourceSections = syllabusSections.length > 0 ? syllabusSections : sections;
  const syllabusHasOutline = sourceSections.some((s) => {
    if (splitOutlineItems(s.section.text).length > 0) return true;
    const heading = s.section.heading ?? "";
    return Boolean(subjectFromLine(heading) ?? freeTextHeadingSubject(heading));
  });
  if (syllabusSections.length > 0 && !syllabusHasOutline) {
    sourceSections = sections;
  }
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
      const subj = subjectFromLine(section.heading) ?? freeTextHeadingSubject(section.heading);
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

  // If syllabus-tagged sections produced no subjects (mis-tags), retry on content.
  if (!nodes.some((n) => n.depth === 0) && syllabusSections.length > 0) {
    const widened = sections.filter((s) => s.role === "syllabus" || s.role === "content");
    return parseSyllabusFromDocument(
      doc,
      widened.map((s) =>
        s.role === "syllabus" ? { ...s, role: "content" as const } : s,
      ),
      positions,
    );
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
