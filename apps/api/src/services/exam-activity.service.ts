import { randomUUID } from "node:crypto";
import type {
  CrawlerRunSummary,
  ExamActivityEvent,
  ExamActivityStatus,
  ExamActivityTimelineDto,
} from "@quizzeira/shared";
import { examActivityKey, slugifyKey } from "@quizzeira/shared";
import { env } from "../lib/env";
import { redis } from "../lib/redis";
import { getCrawlerRun, listOpenExams } from "./crawler-registry.store";
import { getExamCatalogItem } from "./exam-catalog.service";
import { getQuestionBankStats } from "./question-bank.store";

const MAX_EVENTS = 80;
const TTL_SECONDS = 180 * 24 * 60 * 60;

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendExamActivity(input: {
  examSlug: string;
  status: ExamActivityStatus;
  step: string;
  title: string;
  message: string;
  at?: string;
}): Promise<ExamActivityEvent> {
  const examSlug = slugifyKey(input.examSlug);
  const event: ExamActivityEvent = {
    id: randomUUID().slice(0, 12),
    examSlug,
    at: input.at ?? nowIso(),
    status: input.status,
    step: input.step,
    title: input.title,
    message: input.message.slice(0, 500),
  };
  const key = examActivityKey(examSlug);
  await redis
    .pipeline()
    .lpush(key, JSON.stringify(event))
    .ltrim(key, 0, MAX_EVENTS - 1)
    .expire(key, TTL_SECONDS)
    .exec();
  return event;
}

export async function listExamActivityEvents(examSlug: string): Promise<ExamActivityEvent[]> {
  const key = examActivityKey(slugifyKey(examSlug));
  const rows = await redis.lrange(key, 0, MAX_EVENTS - 1);
  const events: ExamActivityEvent[] = [];
  for (const raw of rows) {
    try {
      events.push(JSON.parse(raw) as ExamActivityEvent);
    } catch {
      /* skip */
    }
  }
  // Redis LPUSH → newest first; timeline UI wants oldest → newest.
  return events.reverse();
}

function synth(
  examSlug: string,
  step: string,
  title: string,
  status: ExamActivityStatus,
  message: string,
  at: string | null,
): ExamActivityEvent {
  return {
    id: `synth-${step}`,
    examSlug,
    at: at ?? "",
    status,
    step,
    title,
    message,
  };
}

/** Build a clear pipeline timeline for one catalog exam. */
export async function getExamActivityTimeline(examIdOrSlug: string): Promise<ExamActivityTimelineDto> {
  const exam = await getExamCatalogItem(examIdOrSlug);
  const examSlug = exam.examSlug;
  const open = (await listOpenExams(200)).find(
    (o) => o.id === exam.id || o.examSlug === examSlug,
  );
  const stats = await getQuestionBankStats(examSlug);
  const lastRun: CrawlerRunSummary | null = await getCrawlerRun();
  const logged = await listExamActivityEvents(examSlug);

  const pipeline: ExamActivityEvent[] = [];

  pipeline.push(
    synth(
      examSlug,
      "catalog",
      "In catalog",
      "success",
      exam.placeholder
        ? "Placeholder seed — waiting for crawler discovery."
        : "Exam is listed in the Open exams catalog.",
      open?.discoveredAt ?? null,
    ),
  );

  if (open) {
    pipeline.push(
      synth(
        examSlug,
        "discovered",
        "Discovered by crawler",
        "success",
        `Seen on ${open.sourceDomain}. Listing: ${open.listingUrl}`,
        open.discoveredAt,
      ),
    );
    pipeline.push(
      synth(
        examSlug,
        "last_seen",
        "Last crawler touch",
        "success",
        `Status=${open.status}. Last seen ${open.lastSeenAt}.`,
        open.lastSeenAt,
      ),
    );
  } else {
    pipeline.push(
      synth(
        examSlug,
        "discovered",
        "Discovered by crawler",
        "pending",
        "Not yet found in a live/fixture crawl listing.",
        null,
      ),
    );
  }

  const searchEvents = logged.filter((e) => e.step === "past_exam_search");
  const lastSearch = searchEvents[searchEvents.length - 1];
  if (lastSearch) {
    pipeline.push({ ...lastSearch, id: `pipe-search-${lastSearch.id}` });
  } else if (!env.pastExamSearchEnabled) {
    pipeline.push(
      synth(
        examSlug,
        "past_exam_search",
        "Past-exam search",
        "skipped",
        "PAST_EXAM_SEARCH_ENABLED=false.",
        null,
      ),
    );
  } else if (!env.firecrawlApiKey) {
    pipeline.push(
      synth(
        examSlug,
        "past_exam_search",
        "Past-exam search",
        "skipped",
        "FIRECRAWL_API_KEY unset — live search disabled (fixture/local mode).",
        null,
      ),
    );
  } else {
    pipeline.push(
      synth(
        examSlug,
        "past_exam_search",
        "Past-exam search",
        "pending",
        "No search run recorded for this exam yet.",
        null,
      ),
    );
  }

  if (stats.total <= 0) {
    pipeline.push(
      synth(
        examSlug,
        "question_bank",
        "Question bank",
        "pending",
        "0 questions cached. Study will generate from scratch until the crawler fills the bank.",
        null,
      ),
    );
  } else {
    const subjects = Object.entries(stats.bySubject)
      .slice(0, 4)
      .map(([k, n]) => `${k}:${n}`)
      .join(", ");
    pipeline.push(
      synth(
        examSlug,
        "question_bank",
        "Question bank",
        exam.bankReady ? "success" : "pending",
        exam.bankReady
          ? `${stats.total} questions ready${subjects ? ` (${subjects})` : ""}.`
          : `${stats.total} questions cached — still below ready threshold${subjects ? ` (${subjects})` : ""}.`,
        null,
      ),
    );
  }

  pipeline.push(
    synth(
      examSlug,
      "study_ready",
      "Ready to study from bank",
      exam.bankReady ? "success" : "pending",
      exam.bankReady
        ? "Bank meets ready threshold — pills prefer cached questions."
        : "Not ready yet — opening study will rely on live generation.",
      null,
    ),
  );

  if (lastRun) {
    const relatedErrors = lastRun.errors.filter((e) =>
      e.toLowerCase().includes(examSlug.replace(/-/g, " ").slice(0, 12)),
    );
    pipeline.push(
      synth(
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
        relatedErrors.length > 0
          ? relatedErrors.join(" · ")
          : `run=${lastRun.runId} status=${lastRun.status} openΔ=${lastRun.openDiscovered} searches=${lastRun.searchTriggered} bank+=${lastRun.bankUpserts}`,
        lastRun.finishedAt ?? lastRun.startedAt,
      ),
    );
  }

  // History: logged events not already represented as pipeline synth ids
  const history = logged.filter((e) => !["catalog"].includes(e.step));
  const steps = [...pipeline];
  for (const event of history) {
    if (steps.some((s) => s.id === event.id || (s.step === event.step && s.at === event.at))) {
      continue;
    }
    steps.push(event);
  }
  steps.sort((a, b) => a.at.localeCompare(b.at));

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
