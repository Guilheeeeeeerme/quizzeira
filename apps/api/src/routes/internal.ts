import type { FastifyInstance } from "fastify";
import type {
  AttemptCorrectionInput,
  GenerationCompleteInput,
  QuestionUpdateInput,
} from "@quizzeira/shared";
import { authenticateInternal } from "../plugins/internal-auth";
import {
  getPrompt,
  getPromptHistory,
  isPromptKey,
  proposePrompt,
} from "../services/prompt-store";
import {
  claimNextPendingAttempt,
  completeAttemptCorrection,
  nextQuestionForUpdate,
  proposeQuestionUpdate,
  releaseAttempt,
} from "../services/internal.service";
import {
  claimNextGeneratingAttempt,
  completePillGeneration,
  releaseGeneratingAttempt,
  saveTopicInferredSyllabus,
} from "../services/pill.service";
import { purgeStaleTopics } from "../services/topic.service";
import type {
  CrawlerRunSummary,
  GeneratedQuestionInput,
  InferredSyllabus,
  LocaleCode,
  PastExamSearchRequest,
} from "@quizzeira/shared";
import {
  depositGeneratedQuestions,
  questionBankOverview,
  sampleForAttempt,
  searchAndEnrichBank,
} from "../services/question-bank.service";
import { sampleBankQuestions, upsertBankQuestions } from "../services/question-bank.store";
import { inferExamIdentity } from "../lib/exam-identity";
import {
  getCrawlerObservability,
  listCrawlerSources,
  listOpenExams,
  markSourceHealth,
  proposeCrawlerSource,
  releaseCrawlerLock,
  saveCrawlerRun,
  seedCrawlerSources,
  tryAcquireCrawlerLock,
  upsertCrawlerSource,
  upsertOpenExam,
  consumeCrawlerForceFlag,
  getSourceListingFingerprint,
  setSourceListingFingerprint,
} from "../services/crawler-registry.store";
import { ensureCatalogSeeded } from "../services/exam-catalog.service";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function internalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateInternal);

  app.get("/health", async () => ({ status: "ok", zone: "dmz" }));

  app.get<{ Params: { key: string } }>("/prompts/:key", async (request, reply) => {
    if (!isPromptKey(request.params.key)) {
      return reply.code(400).send({ error: "Unknown prompt key" });
    }
    return getPrompt(request.params.key);
  });

  app.get<{ Params: { key: string } }>("/prompts/:key/history", async (request, reply) => {
    if (!isPromptKey(request.params.key)) {
      return reply.code(400).send({ error: "Unknown prompt key" });
    }
    return { items: await getPromptHistory(request.params.key) };
  });

  app.put<{ Params: { key: string }; Body: { body?: string; note?: string } }>(
    "/prompts/:key",
    async (request, reply) => {
      if (!isPromptKey(request.params.key)) {
        return reply.code(400).send({ error: "Unknown prompt key" });
      }
      const body = request.body?.body?.trim();
      if (!body) return reply.code(400).send({ error: "body required" });
      // HITL: internal PUT stages a proposal; live apply is admin-only.
      return proposePrompt(request.params.key, body, request.body?.note);
    },
  );

  app.post("/reviews/claim", async () => {
    const attempt = await claimNextPendingAttempt();
    return { attempt };
  });

  app.post<{ Params: { attemptId: string } }>(
    "/reviews/:attemptId/release",
    async (request, reply) => {
      try {
        return await releaseAttempt(request.params.attemptId);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { attemptId: string }; Body: AttemptCorrectionInput }>(
    "/reviews/:attemptId/complete",
    async (request, reply) => {
      const { answers, generalComment } = request.body ?? {};
      if (!Array.isArray(answers) || typeof generalComment !== "string") {
        return reply.code(400).send({ error: "answers and generalComment required" });
      }
      try {
        return await completeAttemptCorrection(request.params.attemptId, {
          answers,
          generalComment,
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post("/pills/claim", async () => {
    const attempt = await claimNextGeneratingAttempt();
    return { attempt };
  });

  app.post<{ Params: { attemptId: string } }>(
    "/pills/:attemptId/release",
    async (request, reply) => {
      try {
        return await releaseGeneratingAttempt(request.params.attemptId);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { attemptId: string }; Body: GenerationCompleteInput }>(
    "/pills/:attemptId/complete",
    async (request, reply) => {
      const questions = request.body?.questions;
      if (!Array.isArray(questions)) {
        return reply.code(400).send({ error: "questions required" });
      }
      try {
        return await completePillGeneration(request.params.attemptId, { questions });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { topicId: string }; Body: InferredSyllabus }>(
    "/topics/:topicId/inferred-syllabus",
    async (request, reply) => {
      try {
        return await saveTopicInferredSyllabus(request.params.topicId, request.body ?? ({} as InferredSyllabus));
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post("/topics/purge-stale", async () => purgeStaleTopics());

  app.post<{
    Body: {
      topicTitle?: string;
      guidelines?: string;
      focusText?: string | null;
      subjects?: string[];
      locale?: LocaleCode;
      limit?: number;
      excludeIds?: string[];
      examSlug?: string;
      emphasis?: string | null;
    };
  }>("/question-bank/sample", async (request, reply) => {
    const body = request.body ?? {};
    const limit = Number(body.limit ?? 6);
    if (!Number.isFinite(limit) || limit < 1) {
      return reply.code(400).send({ error: "limit must be >= 1" });
    }
    try {
      if (body.examSlug?.trim()) {
        const sample = await sampleBankQuestions({
          examSlug: body.examSlug.trim(),
          emphasis: body.emphasis ?? null,
          subjects: Array.isArray(body.subjects) ? body.subjects.map(String) : [],
          locale: body.locale === "en" ? "en" : body.locale ? "pt" : undefined,
          limit,
          excludeIds: body.excludeIds,
        });
        return {
          identity: {
            examSlug: body.examSlug.trim(),
            emphasis: body.emphasis ?? null,
            displayLabel: body.examSlug.trim(),
          },
          ...sample,
        };
      }
      if (!body.topicTitle?.trim() || typeof body.guidelines !== "string") {
        return reply.code(400).send({ error: "topicTitle and guidelines required (or examSlug)" });
      }
      return await sampleForAttempt({
        topicTitle: body.topicTitle.trim(),
        guidelines: body.guidelines,
        focusText: body.focusText,
        subjects: Array.isArray(body.subjects) ? body.subjects.map(String) : [],
        locale: body.locale === "en" ? "en" : "pt",
        limit,
        excludeIds: body.excludeIds,
      });
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{
    Body: {
      topicTitle?: string;
      guidelines?: string;
      focusText?: string | null;
      subjects?: string[];
      locale?: LocaleCode;
      questions?: GeneratedQuestionInput[];
      sourceKind?: "llm" | "seed" | "crawl" | "past_exam";
      examSlug?: string;
      emphasis?: string | null;
      subject?: string | null;
      sourceUrl?: string;
      sourceTitle?: string;
    };
  }>("/question-bank/deposit", async (request, reply) => {
    const body = request.body ?? {};
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return reply.code(400).send({ error: "questions required" });
    }
    try {
      if (body.examSlug?.trim()) {
        return await upsertBankQuestions({
          examSlug: body.examSlug.trim(),
          emphasis: body.emphasis ?? null,
          subject: body.subject ?? null,
          locale: body.locale === "en" ? "en" : "pt",
          source: {
            kind: body.sourceKind ?? "seed",
            url: body.sourceUrl,
            title: body.sourceTitle,
            fetchedAt: new Date().toISOString(),
          },
          questions: body.questions,
        });
      }
      if (!body.topicTitle?.trim() || typeof body.guidelines !== "string") {
        return reply.code(400).send({ error: "topicTitle and guidelines required (or examSlug)" });
      }
      return await depositGeneratedQuestions({
        topicTitle: body.topicTitle.trim(),
        guidelines: body.guidelines,
        focusText: body.focusText,
        subjects: Array.isArray(body.subjects) ? body.subjects.map(String) : [],
        locale: body.locale === "en" ? "en" : "pt",
        questions: body.questions,
        sourceKind: body.sourceKind ?? "llm",
      });
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{ Body: PastExamSearchRequest }>("/question-bank/search", async (request, reply) => {
    const body = request.body ?? ({} as PastExamSearchRequest);
    if (!body.examSlug?.trim()) {
      if (body.topicTitle && body.guidelines != null) {
        const identity = inferExamIdentity({
          topicTitle: body.topicTitle,
          guidelines: body.guidelines,
          focusText: body.emphasis,
        });
        body.examSlug = identity.examSlug;
        body.emphasis = body.emphasis ?? identity.emphasis;
      } else {
        return reply.code(400).send({ error: "examSlug (or topicTitle+guidelines) required" });
      }
    }
    try {
      return await searchAndEnrichBank({
        ...body,
        subjects: Array.isArray(body.subjects) ? body.subjects.map(String) : [],
      });
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get<{ Querystring: { examSlug?: string } }>(
    "/question-bank/stats",
    async (request) => questionBankOverview(request.query.examSlug),
  );

  app.post("/crawler/sources/seed", async () => seedCrawlerSources());

  app.post("/crawler/catalog/seed", async () => {
    await ensureCatalogSeeded();
    return { ok: true };
  });

  app.get<{ Querystring: { status?: string } }>("/crawler/sources", async (request) => {
    const status = request.query.status as
      | "active"
      | "broken"
      | "proposed"
      | "disabled"
      | undefined;
    const items = await listCrawlerSources(
      status ? { status } : undefined,
    );
    return { items };
  });

  app.post<{
    Body: {
      domain?: string;
      name?: string;
      startUrls?: string[];
      strategy?: string;
      trust?: string;
      status?: string;
      linkPatterns?: string[];
      openPatterns?: string[];
      politenessMs?: number;
      notes?: string;
      id?: string;
    };
  }>("/crawler/sources", async (request, reply) => {
    const body = request.body ?? {};
    if (!body.domain?.trim() || !body.name?.trim() || !Array.isArray(body.startUrls)) {
      return reply.code(400).send({ error: "domain, name, startUrls required" });
    }
    try {
      const source = await upsertCrawlerSource({
        id: body.id,
        domain: body.domain.trim(),
        name: body.name.trim(),
        startUrls: body.startUrls.map(String),
        strategy: (body.strategy as "listing-links" | "banca-portal" | "fixture") ?? "listing-links",
        trust: (body.trust as "high" | "medium" | "low") ?? "medium",
        status: (body.status as "active" | "broken" | "proposed" | "disabled") ?? "active",
        linkPatterns: body.linkPatterns,
        openPatterns: body.openPatterns,
        politenessMs: body.politenessMs,
        notes: body.notes,
      });
      return { source };
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{ Params: { id: string }; Body: { ok?: boolean; error?: string } }>(
    "/crawler/sources/:id/health",
    async (request, reply) => {
      const source = await markSourceHealth(request.params.id, {
        ok: Boolean(request.body?.ok),
        error: request.body?.error,
      });
      if (!source) return reply.code(404).send({ error: "source not found" });
      return { source };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/crawler/sources/:id/listing-fingerprint",
    async (request) => ({
      fingerprint: await getSourceListingFingerprint(request.params.id),
    }),
  );

  app.put<{ Params: { id: string }; Body: { fingerprint?: string } }>(
    "/crawler/sources/:id/listing-fingerprint",
    async (request, reply) => {
      const fingerprint = request.body?.fingerprint?.trim();
      if (!fingerprint) {
        return reply.code(400).send({ error: "fingerprint required" });
      }
      await setSourceListingFingerprint(request.params.id, fingerprint);
      return { saved: true };
    },
  );

  app.post<{ Body: { url?: string; name?: string; notes?: string } }>(
    "/crawler/sources/propose",
    async (request, reply) => {
      if (!request.body?.url?.trim()) {
        return reply.code(400).send({ error: "url required" });
      }
      return proposeCrawlerSource({
        url: request.body.url.trim(),
        name: request.body.name,
        notes: request.body.notes,
      });
    },
  );

  app.post<{
    Body: {
      examSlug?: string;
      title?: string;
      org?: string | null;
      banca?: string | null;
      emphasis?: string[];
      editalUrl?: string | null;
      listingUrl?: string;
      status?: "open" | "unknown";
      sourceId?: string;
      sourceDomain?: string;
    };
  }>("/crawler/open-exams", async (request, reply) => {
    const body = request.body ?? {};
    if (!body.examSlug?.trim() || !body.title?.trim() || !body.listingUrl?.trim()) {
      return reply.code(400).send({ error: "examSlug, title, listingUrl required" });
    }
    if (!body.sourceId?.trim() || !body.sourceDomain?.trim()) {
      return reply.code(400).send({ error: "sourceId and sourceDomain required" });
    }
    try {
      const result = await upsertOpenExam({
        examSlug: body.examSlug.trim(),
        title: body.title.trim(),
        org: body.org ?? null,
        banca: body.banca ?? null,
        emphasis: Array.isArray(body.emphasis) ? body.emphasis.map(String) : [],
        editalUrl: body.editalUrl ?? null,
        listingUrl: body.listingUrl.trim(),
        status: body.status === "unknown" ? "unknown" : "open",
        sourceId: body.sourceId.trim(),
        sourceDomain: body.sourceDomain.trim(),
      });
      return result;
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get<{ Querystring: { limit?: string } }>("/crawler/open-exams", async (request) => {
    const limit = Number(request.query.limit ?? 100);
    return { items: await listOpenExams(Number.isFinite(limit) ? limit : 100) };
  });

  app.get("/crawler/status", async () => getCrawlerObservability());

  app.post<{ Body: CrawlerRunSummary }>("/crawler/runs", async (request, reply) => {
    const body = request.body;
    if (!body?.runId || !body.startedAt || !body.status) {
      return reply.code(400).send({ error: "run summary required" });
    }
    await saveCrawlerRun(body);
    return { saved: true };
  });

  app.post("/crawler/lock", async () => {
    const acquired = await tryAcquireCrawlerLock();
    return { acquired };
  });

  app.post("/crawler/unlock", async () => {
    await releaseCrawlerLock();
    return { released: true };
  });

  app.post("/crawler/force/consume", async () => {
    const forced = await consumeCrawlerForceFlag();
    return { forced };
  });

  app.get("/questions/next-for-update", async () => {
    const question = await nextQuestionForUpdate();
    return { question };
  });

  app.post<{ Params: { id: string }; Body: QuestionUpdateInput & { reason?: string } }>(
    "/questions/:id/proposals",
    async (request, reply) => {
      try {
        const { reason, ...patch } = request.body ?? {};
        return await proposeQuestionUpdate(request.params.id, patch, reason);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );
}
