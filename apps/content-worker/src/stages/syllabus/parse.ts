// Concept: Deterministic syllabus outline parser (§15).
import {
  canonicalizeSubject,
  extractPositionsFromText,
  slugifyKey,
  tokenSetRatio,
} from "@quizzeira/shared";

export interface ParsedPosition {
  title: string;
  slug: string;
  implicit: boolean;
}

export interface ParsedNode {
  depth: number;
  ordinal: number;
  title: string;
  rawText: string;
  pathSlug: string;
  canonicalSubjectId: string | null;
  canonicalKey: string;
  scope: "basic" | "specific";
  positionIds: string[];
  parentPath: string[];
  extraction: { method: "outline"; confidence: number; sourceSectionId: string };
}

export interface ParsedSyllabus {
  positions: ParsedPosition[];
  nodes: ParsedNode[];
  status: "active" | "needs_review";
}

const SCOPE_BASIC_RE = /conhecimentos\s+(b[áa]sicos|gerais|comuns)/i;
const SCOPE_SPECIFIC_RE = /conhecimentos\s+espec[íi]ficos/i;
const ITEM_RE = /^\s*(?:\d+(?:\.\d+)*|[a-z]|[ivxlc]+)[.)\-–]\s+(.+)$/i;

function looksAdministrative(text: string): boolean {
  return /\bvagas?\b|\bremunera|\btaxa\b|\binscri|\bcronograma\b|\bedital\s+n|\bescolaridade\b/i.test(
    text,
  );
}

export function parseSyllabusFromSections(
  sections: Array<{ id?: string; heading: string | null; text: string; role: string }>,
  examHint?: { title?: string | null },
): ParsedSyllabus {
  const syllabusSections = sections.filter(
    (s) => s.role === "syllabus" || /program|conhecimentos|disciplina/i.test(s.heading ?? ""),
  );
  const source = syllabusSections.length ? syllabusSections : sections;
  const positionTitles = new Set<string>();
  for (const s of source) {
    for (const p of extractPositionsFromText(`${s.heading ?? ""}\n${s.text}`)) positionTitles.add(p);
  }
  if (examHint?.title) {
    for (const p of extractPositionsFromText(examHint.title)) positionTitles.add(p);
  }

  const positions: ParsedPosition[] =
    positionTitles.size > 0
      ? [...positionTitles].map((title) => ({
          title,
          slug: slugifyKey(title, 40),
          implicit: false,
        }))
      : [{ title: "geral", slug: "geral", implicit: true }];

  const nodes: ParsedNode[] = [];
  let scope: "basic" | "specific" = "basic";
  let currentSubject: ParsedNode | null = null;
  let ordinal = 0;

  for (const section of source) {
    const sid = section.id ?? `sec-${ordinal}`;
    const lines = `${section.heading ?? ""}\n${section.text}`.split(/\n+/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (SCOPE_BASIC_RE.test(line)) {
        scope = "basic";
        continue;
      }
      if (SCOPE_SPECIFIC_RE.test(line)) {
        scope = "specific";
        continue;
      }
      if (looksAdministrative(line)) continue;

      const canon = canonicalizeSubject(line.replace(/:$/, ""));
      const isSubject =
        Boolean(canon) ||
        (line.length <= 80 && (/:$/.test(line) || line === line.toUpperCase()));

      if (isSubject) {
        const title = line.replace(/:$/, "").trim();
        const pathSlug = slugifyKey(canon?.canonical ?? title, 60);
        currentSubject = {
          depth: 0,
          ordinal: ordinal++,
          title: canon?.canonical ?? title,
          rawText: title,
          pathSlug,
          canonicalSubjectId: canon?.id ?? null,
          canonicalKey: `${canon?.id ?? "other"}:${pathSlug}`,
          scope,
          positionIds: scope === "basic" ? positions.map((p) => p.slug) : [],
          parentPath: [],
          extraction: { method: "outline", confidence: canon ? 0.9 : 0.7, sourceSectionId: sid },
        };
        nodes.push(currentSubject);
        continue;
      }

      const item = ITEM_RE.exec(line);
      if (item && currentSubject) {
        const title = item[1].replace(/[.;]+$/, "").trim();
        if (!title || title.length > 200 || looksAdministrative(title)) continue;
        const depth = Math.min(3, (line.match(/\./g) || []).length + 1);
        nodes.push({
          depth,
          ordinal: ordinal++,
          title,
          rawText: title,
          pathSlug: `${currentSubject.pathSlug}/${slugifyKey(title, 40)}`,
          canonicalSubjectId: currentSubject.canonicalSubjectId,
          canonicalKey: `${currentSubject.canonicalSubjectId ?? "other"}:${slugifyKey(title, 40)}`,
          scope: currentSubject.scope,
          positionIds: currentSubject.positionIds,
          parentPath: [currentSubject.title],
          extraction: { method: "outline", confidence: 0.85, sourceSectionId: sid },
        });
        continue;
      }

      if (currentSubject && line.includes(";") && line.length > 40 && !ITEM_RE.test(line)) {
        for (const part of line.split(";")) {
          const title = part.replace(/[.;]+$/, "").trim();
          if (title.length < 3 || title.length > 200 || looksAdministrative(title)) continue;
          nodes.push({
            depth: 1,
            ordinal: ordinal++,
            title,
            rawText: title,
            pathSlug: `${currentSubject.pathSlug}/${slugifyKey(title, 40)}`,
            canonicalSubjectId: currentSubject.canonicalSubjectId,
            canonicalKey: `${currentSubject.canonicalSubjectId ?? "other"}:${slugifyKey(title, 40)}`,
            scope: currentSubject.scope,
            positionIds: currentSubject.positionIds,
            parentPath: [currentSubject.title],
            extraction: { method: "outline", confidence: 0.6, sourceSectionId: sid },
          });
        }
      }
    }
  }

  for (const node of nodes) {
    if (node.depth !== 0 || node.scope !== "specific" || node.positionIds.length) continue;
    const match = positions.find((p) => tokenSetRatio(p.title, node.title) >= 80);
    if (match) node.positionIds = [match.slug];
    else node.positionIds = positions.map((p) => p.slug);
  }

  const subjects = nodes.filter((n) => n.depth === 0);
  const leaves = nodes.filter((n) => n.depth > 0);
  const status = subjects.length >= 1 && leaves.length >= 1 ? "active" : "needs_review";

  return { positions, nodes, status };
}
