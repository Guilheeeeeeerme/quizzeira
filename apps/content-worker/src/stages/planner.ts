/**
 * Coverage planner (§17.5 / §24.1): enqueue TopicQuery + leaf generation targets.
 * Pure planning helpers are unit-tested; API writes happen in the worker pass.
 */

export interface LeafCoverage {
  syllabusNodeId: string;
  examSlug: string;
  canonicalKey: string;
  path: string[];
  title: string;
  rawText: string;
  kuCount: number;
  publishedCount: number;
  pendingCount: number;
  questionCountHint?: number | null;
}

export interface GenerationTarget {
  examSlug: string;
  syllabusNodeId: string;
  canonicalKey: string;
  path: string[];
  title: string;
  rawText: string;
  deficit: number;
  kuCount: number;
}

export interface TopicQueryPlan {
  examSlug: string;
  syllabusNodeId: string;
  canonicalKey: string;
  queries: string[];
}

export const MIN_KU_PER_LEAF = 4;
export const TARGET_KU_PER_LEAF = 12;
export const DEFAULT_QUESTIONS_PER_LEAF = 8;
export const MAX_TOPIC_QUERIES_PER_PASS = 20;
export const MAX_GENERATION_TARGETS_PER_PASS = 10;

export function targetQuestionsForLeaf(leaf: LeafCoverage): number {
  const hinted = leaf.questionCountHint;
  if (hinted != null && hinted > 0) {
    return Math.max(4, Math.min(40, Math.round(hinted * 0.4)));
  }
  return DEFAULT_QUESTIONS_PER_LEAF;
}

/** Leaves ready for generation: enough KUs and still below published+pending target. */
export function planGenerationTargets(
  leaves: LeafCoverage[],
  opts: { max?: number; minKu?: number } = {},
): GenerationTarget[] {
  const max = opts.max ?? MAX_GENERATION_TARGETS_PER_PASS;
  const minKu = opts.minKu ?? MIN_KU_PER_LEAF;
  const out: GenerationTarget[] = [];

  const ranked = [...leaves].sort((a, b) => {
    const ta = targetQuestionsForLeaf(a);
    const tb = targetQuestionsForLeaf(b);
    const da = ta - a.publishedCount - a.pendingCount;
    const db = tb - b.publishedCount - b.pendingCount;
    return db - da || b.kuCount - a.kuCount;
  });

  for (const leaf of ranked) {
    if (leaf.kuCount < minKu) continue;
    const target = targetQuestionsForLeaf(leaf);
    const deficit = target - leaf.publishedCount - leaf.pendingCount;
    if (deficit <= 0) continue;
    out.push({
      examSlug: leaf.examSlug,
      syllabusNodeId: leaf.syllabusNodeId,
      canonicalKey: leaf.canonicalKey,
      path: leaf.path,
      title: leaf.title,
      rawText: leaf.rawText,
      deficit,
      kuCount: leaf.kuCount,
    });
    if (out.length >= max) break;
  }
  return out;
}

/** Leaves lacking knowledge coverage → topic discovery queries. */
export function planTopicQueries(
  leaves: LeafCoverage[],
  opts: { max?: number; targetKu?: number } = {},
): TopicQueryPlan[] {
  const max = opts.max ?? MAX_TOPIC_QUERIES_PER_PASS;
  const targetKu = opts.targetKu ?? TARGET_KU_PER_LEAF;
  const out: TopicQueryPlan[] = [];

  for (const leaf of leaves) {
    if (leaf.kuCount >= targetKu) continue;
    const subject = leaf.path[0] ?? "";
    const topic = leaf.path[1] ?? leaf.title;
    out.push({
      examSlug: leaf.examSlug,
      syllabusNodeId: leaf.syllabusNodeId,
      canonicalKey: leaf.canonicalKey,
      queries: [
        `${leaf.title} ${subject}`.trim(),
        `${leaf.title} resumo concurso`,
        `${leaf.title} ${topic} exemplos regras`.trim(),
      ],
    });
    if (out.length >= max) break;
  }
  return out;
}
