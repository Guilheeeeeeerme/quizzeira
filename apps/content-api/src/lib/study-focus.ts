import { subjectSlug as toSubjectSlug } from "@quizzeira/shared";

/** Syllabus position row used when building study focus options. */
export interface FocusPosition {
  id: string;
  title: string;
  slug: string;
  implicit: boolean;
}

/** Syllabus node row used when building study focus options. */
export interface FocusNode {
  id: string;
  parentId: string | null;
  depth: number;
  title: string;
  positionIds: unknown;
}

export interface FocusAreaOption {
  id: string;
  title: string;
  slug: string;
  publishedCount: number;
}

export interface FocusSubjectOption {
  slug: string;
  title: string;
  publishedCount: number;
  /** Empty = subject appears across the bank without a known area link. */
  areaIds: string[];
}

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

/** Turn a slug into a readable label when the bank only stored the slug. */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Edital cargos are often parsed as ALL-CAPS depth-0 “subjects”. */
export function looksLikeCargoHeading(title: string): boolean {
  const letters = title.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length < 6) return false;
  const upper = letters.replace(/[^A-ZÀ-Ý]/g, "").length;
  return upper / letters.length >= 0.85;
}

/** True when a node applies to a position (empty positionIds = all / básicos). */
export function nodeAppliesToPosition(positionIds: unknown, positionId: string): boolean {
  const ids = asIdList(positionIds);
  return ids.length === 0 || ids.includes(positionId);
}

/**
 * Build study-facing area/subject options from published bank counts.
 * Only options with publishedCount > 0 are returned (product rule: no empty tags).
 */
export function buildStudyFocusOptions(input: {
  positions: FocusPosition[];
  nodes: FocusNode[];
  publishedByNodeId: Map<string, number>;
  publishedBySubject: Array<{ subjectSlug: string; subject: string; count: number }>;
  publishedByPositionId: Map<string, number>;
}): { focusAreas: FocusAreaOption[]; focusSubjects: FocusSubjectOption[] } {
  const { positions, nodes, publishedByNodeId, publishedBySubject, publishedByPositionId } = input;

  const focusAreas: FocusAreaOption[] = [];
  for (const position of positions) {
    if (position.implicit) continue;
    // Prefer direct QuestionItem.positionId counts; fall back to node attribution.
    let count = publishedByPositionId.get(position.id) ?? 0;
    if (count === 0) {
      for (const node of nodes) {
        if (!nodeAppliesToPosition(node.positionIds, position.id)) continue;
        count += publishedByNodeId.get(node.id) ?? 0;
      }
    }
    if (count <= 0) continue;
    focusAreas.push({
      id: position.id,
      title: position.title,
      slug: position.slug,
      publishedCount: count,
    });
  }
  focusAreas.sort((a, b) => b.publishedCount - a.publishedCount || a.title.localeCompare(b.title));

  // Attribute subjects → areas via syllabus depth-0 nodes when possible.
  // Prefer syllabus subject titles over raw bank strings (often slugs).
  // ALL-CAPS depth-0 headings are usually cargos mis-parsed as subjects — skip them.
  const subjectAreaMap = new Map<string, Set<string>>();
  const subjectTitleMap = new Map<string, string>();
  for (const node of nodes) {
    if (node.depth !== 0) continue;
    if (looksLikeCargoHeading(node.title)) continue;
    const slug = toSubjectSlug(node.title);
    if (!slug || slug === "geral") continue;
    if (!subjectTitleMap.has(slug) || node.title.length > (subjectTitleMap.get(slug)?.length ?? 0)) {
      subjectTitleMap.set(slug, node.title);
    }
    const pids = asIdList(node.positionIds);
    if (pids.length === 0) continue;
    let set = subjectAreaMap.get(slug);
    if (!set) {
      set = new Set();
      subjectAreaMap.set(slug, set);
    }
    for (const pid of pids) set.add(pid);
  }

  // Cargo / area names sometimes land in QuestionItem.subject — keep them out of the subject list.
  const positionSlugs = new Set(positions.map((p) => p.slug));
  for (const node of nodes) {
    if (node.depth === 0 && looksLikeCargoHeading(node.title)) {
      positionSlugs.add(toSubjectSlug(node.title));
    }
  }

  const bySlug = new Map<string, FocusSubjectOption>();
  for (const row of publishedBySubject) {
    const slug = row.subjectSlug.trim();
    if (!slug || slug === "geral") continue;
    if (positionSlugs.has(slug)) continue;
    const syllabusTitle = subjectTitleMap.get(slug);
    const bankTitle = row.subject.trim();
    const title =
      syllabusTitle ||
      (bankTitle && bankTitle !== slug && !looksLikeCargoHeading(bankTitle)
        ? bankTitle
        : humanizeSlug(slug));
    if (looksLikeCargoHeading(title)) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.publishedCount += row.count;
      continue;
    }
    bySlug.set(slug, {
      slug,
      title,
      publishedCount: row.count,
      areaIds: [...(subjectAreaMap.get(slug) ?? [])],
    });
  }

  // When the syllabus only has an implicit "geral" position, promote ALL-CAPS
  // headings that have published bank rows into focusAreas (edital cargos).
  if (focusAreas.length === 0) {
    const bankBySlug = new Map(publishedBySubject.map((r) => [r.subjectSlug, r.count]));
    const seen = new Set<string>();
    for (const node of nodes) {
      if (node.depth !== 0 || !looksLikeCargoHeading(node.title)) continue;
      const slug = toSubjectSlug(node.title);
      if (!slug || seen.has(slug)) continue;
      const count = bankBySlug.get(slug) ?? publishedDescendantCount(node.id, nodes, publishedByNodeId);
      if (count <= 0) continue;
      seen.add(slug);
      focusAreas.push({
        id: slug,
        title: node.title,
        slug,
        publishedCount: count,
      });
    }
    focusAreas.sort((a, b) => b.publishedCount - a.publishedCount || a.title.localeCompare(b.title));
  }

  const focusSubjects = [...bySlug.values()].sort(
    (a, b) => b.publishedCount - a.publishedCount || a.title.localeCompare(b.title),
  );

  return { focusAreas, focusSubjects };
}

function publishedDescendantCount(
  rootId: string,
  nodes: FocusNode[],
  publishedByNodeId: Map<string, number>,
): number {
  const children = new Map<string | null, string[]>();
  for (const node of nodes) {
    const list = children.get(node.parentId) ?? [];
    list.push(node.id);
    children.set(node.parentId, list);
  }
  let total = 0;
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    total += publishedByNodeId.get(id) ?? 0;
    for (const child of children.get(id) ?? []) stack.push(child);
  }
  return total;
}

/** Node ids that apply to a position (for sampling). */
export function nodeIdsForPosition(
  nodes: Array<{ id: string; positionIds: unknown }>,
  positionId: string,
): string[] {
  return nodes.filter((n) => nodeAppliesToPosition(n.positionIds, positionId)).map((n) => n.id);
}
