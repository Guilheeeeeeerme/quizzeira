// Concept: Worker/agent loop observability, read-only.
//
// The timeline is derived on demand from discovery-api (Ingestion) and
// content-api (Question bank / Publish gate). The study API stores no pipeline
// state of its own, so there is nothing here to keep in sync.
import type {
  CrawlerRunSummary,
  ExamActivityEvent,
  ExamActivityStatus,
  ExamActivityTimelineDto,
} from "@quizzeira/shared";
import { discoveryFetch, fetchOpenExam } from "../lib/pipeline-clients";
import { getExamCatalogItem } from "./exam-catalog.service";

function step(
  examSlug: string,
  id: string,
  title: string,
  status: ExamActivityStatus,
  message: string,
  at: string | null,
): ExamActivityEvent {
  return { id: `pipe-${id}`, examSlug, at: at ?? "", status, step: id, title, message };
}

async function lastCrawlRun(): Promise<CrawlerRunSummary | null> {
  try {
    const data = await discoveryFetch<{ items?: Partial<CrawlerRunSummary>[] }>(
      "/admin/runs?limit=1",
    );
    const run = data.items?.[0];
    if (!run?.runId || !run.startedAt) return null;
    return {
      runId: run.runId,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt ?? null,
      status: run.status ?? "running",
      sourcesOk: run.sourcesOk ?? 0,
      sourcesFailed: run.sourcesFailed ?? 0,
      openDiscovered: run.openDiscovered ?? 0,
      proposedSources: run.proposedSources ?? 0,
      artifactsStored: run.artifactsStored ?? 0,
      errors: run.errors ?? [],
    };
  } catch {
    return null;
  }
}

/** Build a clear pipeline timeline for one catalog exam. */
export async function getExamActivityTimeline(
  examIdOrSlug: string,
): Promise<ExamActivityTimelineDto> {
  const exam = await getExamCatalogItem(examIdOrSlug);
  const examSlug = exam.examSlug;
  const [open, lastRun] = await Promise.all([fetchOpenExam(exam.id), lastCrawlRun()]);

  const steps: ExamActivityEvent[] = [
    step(
      examSlug,
      "catalog",
      "In catalog",
      "success",
      "Exam is listed in the Open exams catalog.",
      open?.discoveredAt ?? null,
    ),
  ];

  if (open) {
    steps.push(
      step(
        examSlug,
        "discovered",
        "Discovered by crawler",
        "success",
        `Seen on ${open.sourceDomain}. Listing: ${open.listingUrl}`,
        open.discoveredAt,
      ),
      step(
        examSlug,
        "last_seen",
        "Last crawler touch",
        "success",
        `Status=${open.status}. Last seen ${open.lastSeenAt}.`,
        open.lastSeenAt,
      ),
    );
  } else {
    steps.push(
      step(
        examSlug,
        "discovered",
        "Discovered by crawler",
        "pending",
        "Not currently present in a discovery crawl listing.",
        null,
      ),
    );
  }

  steps.push(
    step(
      examSlug,
      "question_bank",
      "Question bank",
      exam.bankQuestionCount > 0 ? (exam.bankReady ? "success" : "pending") : "pending",
      exam.bankQuestionCount > 0
        ? `${exam.bankQuestionCount} published question(s)${exam.bankReady ? "" : " — still below the ready threshold"}.`
        : "Nothing published yet. Extraction, generation and the publish gate run in the content stack.",
      null,
    ),
    step(
      examSlug,
      "study_ready",
      "Ready to study",
      exam.bankReady ? "success" : "pending",
      exam.bankReady
        ? "Published questions are available — study pills sample from them."
        : "Not ready yet. Study never generates questions; it waits for published items.",
      null,
    ),
  );

  if (lastRun) {
    steps.push(
      step(
        examSlug,
        "crawler_run",
        "Last global crawler run",
        lastRun.status === "ok"
          ? "success"
          : lastRun.status === "failed"
            ? "error"
            : lastRun.status === "running"
              ? "running"
              : "pending",
        `run=${lastRun.runId} status=${lastRun.status} open+=${lastRun.openDiscovered} sourcesOk=${lastRun.sourcesOk} sourcesFailed=${lastRun.sourcesFailed}`,
        lastRun.finishedAt ?? lastRun.startedAt,
      ),
    );
  }

  return {
    examSlug,
    examId: exam.id,
    title: exam.title,
    bankQuestionCount: exam.bankQuestionCount,
    bankReady: exam.bankReady,
    steps,
    lastCrawlerRun: lastRun,
  };
}
