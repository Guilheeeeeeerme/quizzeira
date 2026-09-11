// Concept: Question bank (published read API) + Sampling support
//
// The study API's only door into Content. Every query here is hard-filtered to
// status = published, so an un-evaluated draft can never reach a learner even
// if a caller asks for it.
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  subjectSlug as toSubjectSlug,
  type GeneratedQuestionInput,
  type PublishedSampleRequest,
} from "@quizzeira/shared";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";

function assertReader(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.adminInternalKey && key !== env.internalApiKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

interface PublishedRow {
  id: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options: unknown;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
}

function toGeneratedQuestion(row: PublishedRow): GeneratedQuestionInput {
  return {
    type: row.type,
    prompt: row.prompt,
    options: row.type === "MULTIPLE_CHOICE" ? ((row.options as string[] | null) ?? []) : null,
    correctIndex: row.type === "MULTIPLE_CHOICE" ? row.correctIndex : null,
    referenceAnswer: row.type === "OPEN" ? row.referenceAnswer : null,
    explanation: row.explanation,
  };
}

export async function registerPublishedRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/published")) assertReader(request);
  });

  /**
   * Random sample of published questions. Ordering is done in Postgres so the
   * API never loads a whole exam into memory to pick five rows.
   */
  app.post<{ Body: PublishedSampleRequest }>("/published/sample", async (request) => {
    const body = request.body;
    const examSlug = String(body?.examSlug || "").trim();
    if (!examSlug) {
      throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
    }
    const limit = Math.max(1, Math.min(Number(body.limit || 5), 40));
    const exclude = body.excludeIds ?? [];
    const subjectSlugs = (body.subjects ?? [])
      .map((s) => toSubjectSlug(s))
      .filter((s) => s && s !== "geral");

    const base = {
      status: "published" as const,
      examSlug,
      ...(body.locale ? { locale: body.locale } : {}),
      ...(exclude.length > 0 ? { id: { notIn: exclude } } : {}),
    };

    // Prefer the requested subjects; fall back to the whole exam so a session
    // is never empty just because a subject label did not match.
    let rows = subjectSlugs.length
      ? await sampleRows({ ...base, subjectSlug: { in: subjectSlugs } }, limit)
      : [];
    if (rows.length < limit) {
      const more = await sampleRows(
        { ...base, ...(rows.length ? { id: { notIn: [...exclude, ...rows.map((r) => r.id)] } } : {}) },
        limit - rows.length,
      );
      rows = [...rows, ...more];
    }

    return {
      questions: rows.map(toGeneratedQuestion),
      ids: rows.map((r) => r.id),
      hitCount: rows.length,
    };
  });

  app.get("/published/stats", async (request) => {
    const q = request.query as { examSlug?: string };
    const where = q.examSlug?.trim() ? { examSlug: q.examSlug.trim() } : {};
    const grouped = await prisma.questionItem.groupBy({
      by: ["examSlug", "status"],
      where,
      _count: { _all: true },
    });

    const byExam = new Map<
      string,
      { examSlug: string; draft: number; needsReview: number; published: number; failed: number }
    >();
    for (const row of grouped) {
      const entry =
        byExam.get(row.examSlug) ??
        { examSlug: row.examSlug, draft: 0, needsReview: 0, published: 0, failed: 0 };
      const count = row._count._all;
      if (row.status === "draft") entry.draft += count;
      else if (row.status === "needs_review") entry.needsReview += count;
      else if (row.status === "published") entry.published += count;
      else if (row.status === "failed") entry.failed += count;
      byExam.set(row.examSlug, entry);
    }

    return { exams: [...byExam.values()].sort((a, b) => b.published - a.published) };
  });

  /** Study fetches a specific published question (e.g. to rebuild an attempt). */
  app.get<{ Params: { id: string } }>("/published/items/:id", async (request) => {
    const item = await prisma.questionItem.findFirst({
      where: { id: request.params.id, status: "published" },
    });
    if (!item) throw Object.assign(new Error("not found"), { statusCode: 404 });
    return { question: toGeneratedQuestion(item as PublishedRow), id: item.id };
  });
}

async function sampleRows(
  where: Record<string, unknown>,
  limit: number,
): Promise<Array<PublishedRow & { id: string }>> {
  if (limit <= 0) return [];
  // Cheap randomization: take a bounded window ordered by a random-ish column
  // and shuffle in the app. ORDER BY random() over a large table is the thing
  // we are avoiding here.
  const window = await prisma.questionItem.findMany({
    where: where as never,
    select: {
      id: true,
      type: true,
      prompt: true,
      options: true,
      correctIndex: true,
      referenceAnswer: true,
      explanation: true,
    },
    orderBy: { publishedAt: "desc" },
    take: Math.min(200, limit * 10),
  });
  return shuffle(window).slice(0, limit) as Array<PublishedRow & { id: string }>;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
