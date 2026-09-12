// Concept: Coverage planner + TopicQuery enqueue (§17.5).

import { buildTopicQueries } from "@quizzeira/shared";
import { logInfo } from "@quizzeira/worker-kit";
import { content, discovery } from "../clients.js";
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
const BACKOFF_DAYS = [7, 14, 28, 56] as const;

export async function runPlannerPass(): Promise<PlannerPassResult> {
  if (!contentEnv.stagePlannerEnabled) {
    return { enqueued: 0, skipped: 0, gapLeaves: 0 };
  }

  const { items } = await content.get<{ items: KnowledgeGapLeaf[] }>(
    `/internal/coverage/knowledge-gaps?limit=${MAX_TOPIC_QUERIES_PER_PASS}` +
      `&targetKu=${TARGET_KU_PER_LEAF}`,
  );

  let enqueued = 0;
  let skipped = 0;

  for (const leaf of items) {
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

    const path = leaf.path.length > 0 ? leaf.path : leaf.pathSlug.split("/").filter(Boolean);
    const subject = path[0] || leaf.title;
    const topic = path.length > 1 ? path[1]! : leaf.title;
    const subtopic = path.length > 2 ? path[path.length - 1]! : topic;
    const queries = buildTopicQueries({
      subject,
      topic,
      subtopic,
      max: 3,
    });

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
    });
  }
  return { enqueued, skipped, gapLeaves: items.length };
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
