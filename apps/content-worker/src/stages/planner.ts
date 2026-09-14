// Concept: Coverage planner + TopicQuery enqueue (§17.5).

import { buildTopicQueries } from "@quizzeira/shared";
import { logInfo } from "@quizzeira/worker-kit";
import { content, discovery } from "../clients.js";
import { openExamSlugsByDeadline } from "../generation/index.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/planner";

export interface KnowledgeGapLeaf {
  examSlug: string;
  syllabusNodeId: string;
  pathSlug: string;
  canonicalKey: string;
  title: string;
  path: string[];
  kuCount: number;
  questionCount: number | null;
  weight: number | null;
}

export interface PlannerPassResult {
  enqueued: number;
  skipped: number;
  gapLeaves: number;
}

const MIN_KU_PER_LEAF = 4;
const TARGET_KU_PER_LEAF = 12;
const MAX_TOPIC_QUERIES_PER_PASS = 20;
/** Candidates fetched per pass; queued/backoff leaves are skipped without consuming the cap. */
const CANDIDATE_MULTIPLIER = 5;
const BACKOFF_DAYS = [7, 14, 28, 56] as const;

export async function runPlannerPass(): Promise<PlannerPassResult> {
  if (!contentEnv.stagePlannerEnabled) {
    return { enqueued: 0, skipped: 0, gapLeaves: 0 };
  }

  // Only chase exams the catalog still considers open (§11.2.5); a closed
  // 2022 syllabus must not consume the topic-query budget.
  const openSlugs = await openExamSlugsByDeadline();

  const candidateLimit = MAX_TOPIC_QUERIES_PER_PASS * CANDIDATE_MULTIPLIER;
  const { items } = await content.get<{ items: KnowledgeGapLeaf[] }>(
    `/internal/coverage/knowledge-gaps?limit=${candidateLimit}` +
      `&targetKu=${TARGET_KU_PER_LEAF}` +
      (openSlugs.length > 0 ? `&examSlugs=${encodeURIComponent(openSlugs.join(","))}` : ""),
  );

  let enqueued = 0;
  let skipped = 0;

  for (const leaf of items) {
    if (enqueued >= MAX_TOPIC_QUERIES_PER_PASS) break;
    if (leaf.kuCount >= TARGET_KU_PER_LEAF) {
      skipped += 1;
      continue;
    }

    const { items: existing } = await discovery
      .get<{
        items: Array<{
          id: string;
          syllabusNodeId: string;
          status: string;
          candidatesStored: number;
          finishedAt: string | null;
          attempts: number;
          nextRunAt: string | null;
        }>;
      }>(
        `/internal/topic-queries?syllabusNodeId=${encodeURIComponent(leaf.syllabusNodeId)}&limit=10`,
      )
      .catch(() => ({ items: [] }));

    if (existing.some((row) => row.status === "queued" || row.status === "running")) {
      skipped += 1;
      continue;
    }

    if (shouldBackoff(existing)) {
      skipped += 1;
      continue;
    }

    const queries = buildTopicQueries(queryVarsForLeaf(leaf));

    await discovery.post("/internal/topic-queries", {
      examSlug: leaf.examSlug,
      syllabusNodeId: leaf.syllabusNodeId,
      canonicalKey: leaf.canonicalKey || leaf.pathSlug,
      queries,
    });
    enqueued += 1;
  }

  if (enqueued || items.length) {
    logInfo("planner pass", {
      worker: NAME,
      enqueued,
      skipped,
      gapLeaves: items.length,
      openExams: openSlugs.length,
    });
  }
  return { enqueued, skipped, gapLeaves: items.length };
}

/**
 * Search text comes from the human-readable title path (subject › topic ›
 * subtopic), never from slugs: "concordancia-verbal-e-nominal" is a poor
 * web query, "Concordância verbal e nominal" is not.
 */
export function queryVarsForLeaf(
  leaf: Pick<KnowledgeGapLeaf, "path" | "pathSlug" | "title">,
): { subject: string; topic: string; subtopic: string; max: number } {
  const looksSlug = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
  const humanize = (s: string) => (looksSlug(s) ? s.replace(/-/g, " ") : s);
  const rawPath = leaf.path.length > 0 ? leaf.path : leaf.pathSlug.split("/").filter(Boolean);
  const path = rawPath.map((p) => humanize(p.trim())).filter(Boolean);
  const subject = path[0] || humanize(leaf.title);
  const topic = path.length > 1 ? path[1]! : humanize(leaf.title);
  const subtopic = path.length > 2 ? path[path.length - 1]! : topic;
  return { subject, topic, subtopic, max: 3 };
}

/** Empty-result backoff ladder §17.5 / §34: 7d → 14d → 28d → 56d. */
function shouldBackoff(
  rows: Array<{
    status: string;
    candidatesStored: number;
    finishedAt: string | null;
    attempts: number;
    nextRunAt: string | null;
  }>,
): boolean {
  const finished = rows
    .filter((r) => r.finishedAt && (r.status === "done" || r.status === "failed" || r.status === "ok"))
    .sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
  const last = finished[0];
  if (!last?.finishedAt) return false;
  if (last.candidatesStored > 0) return false;

  const attempts = Math.max(0, last.attempts || 0);
  const days = BACKOFF_DAYS[Math.min(attempts, BACKOFF_DAYS.length - 1)]!;
  const elapsedMs = Date.now() - new Date(last.finishedAt).getTime();
  return elapsedMs < days * 24 * 60 * 60 * 1000;
}

export { MIN_KU_PER_LEAF, TARGET_KU_PER_LEAF, MAX_TOPIC_QUERIES_PER_PASS };
