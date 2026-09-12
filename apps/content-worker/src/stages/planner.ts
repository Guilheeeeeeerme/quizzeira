// Concept: Coverage planner — enqueue TopicQuery rows for under-covered leaves (§17.5).
import { buildTopicQueries } from "@quizzeira/shared";
import { dmzPost, logInfo } from "@quizzeira/worker-kit";
import { content, discovery } from "../clients.js";

const NAME = "content-worker/planner";
const TARGET_KU_PER_LEAF = Number(process.env.TARGET_KU_PER_LEAF || 12);
const MAX_TOPIC_QUERIES_PER_PASS = Number(process.env.MAX_TOPIC_QUERIES_PER_PASS || 20);

export async function runPlannerPass(): Promise<{ enqueued: number }> {
  let enqueued = 0;
  const { items: exams } = await discovery
    .get<{ items: Array<{ id: string; examSlug: string; kind: string }> }>("/internal/open-exams")
    .catch(() => ({ items: [] as Array<{ id: string; examSlug: string; kind: string }> }));

  for (const exam of exams.filter((e) => e.kind === "concurso" || e.kind === "oab")) {
    const { syllabus } = await content
      .get<{
        syllabus: {
          id: string;
          nodes: Array<{
            id: string;
            depth: number;
            title: string;
            rawText: string;
            canonicalSubjectId: string | null;
            canonicalKey: string;
            pathSlug: string;
          }>;
        } | null;
      }>(`/internal/syllabus/${encodeURIComponent(exam.examSlug)}`)
      .catch(() => ({ syllabus: null }));
    if (!syllabus) continue;

    const leaves = syllabus.nodes.filter((n) => n.depth > 0);
    for (const leaf of leaves) {
      if (enqueued >= MAX_TOPIC_QUERIES_PER_PASS) break;
      const { count } = await content
        .get<{ count: number }>(
          `/internal/knowledge-units/count?syllabusNodeId=${encodeURIComponent(leaf.id)}`,
        )
        .catch(() => ({ count: 0 }));
      if (count >= TARGET_KU_PER_LEAF) continue;

      const subjectPath = leaf.pathSlug.split("/")[0] ?? leaf.title;
      const queries = buildTopicQueries({
        subject: { id: leaf.canonicalSubjectId, canonical: subjectPath },
        topic: null,
        leaf: { title: leaf.title, rawText: leaf.rawText },
      });

      await discovery
        .post("/internal/topic-queries", {
          examId: exam.id,
          examSlug: exam.examSlug,
          syllabusNodeId: leaf.id,
          canonicalKey: leaf.canonicalKey,
          queries,
          status: "queued",
        })
        .catch(() => undefined);
      enqueued += 1;
    }
  }

  if (enqueued) logInfo("planner enqueued topic queries", { worker: NAME, enqueued });
  return { enqueued };
}
