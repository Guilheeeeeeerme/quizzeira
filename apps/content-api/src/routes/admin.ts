// Concept: HITL (human-in-the-loop review queue) + pipeline health
//
// Reached through the study API's /admin/content/* proxy. Everything an admin
// can do here is a decision the automated Eval stage deliberately deferred.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";

function assertAdmin(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.adminInternalKey && key !== env.internalApiKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/admin")) assertAdmin(request);
  });

  /** The HITL queue: everything Eval rejected or could not decide. */
  app.get("/admin/quality/queue", async (request) => {
    const q = request.query as { status?: string; examSlug?: string; limit?: string };
    const status = q.status === "needs_review" || q.status === "failed" ? q.status : undefined;
    const items = await prisma.questionItem.findMany({
      where: {
        status: status ? (status as never) : { in: ["failed", "needs_review"] },
        ...(q.examSlug ? { examSlug: q.examSlug } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: Math.min(100, Number(q.limit || 50)),
      include: {
        reviews: { orderBy: { createdAt: "desc" }, take: 3 },
        document: { select: { sourceUrl: true, kind: true } },
      },
    });

    return {
      items: items.map((i) => ({
        id: i.id,
        examSlug: i.examSlug,
        subject: i.subject,
        status: i.status,
        origin: i.origin,
        type: i.type,
        prompt: i.prompt,
        options: i.options,
        correctIndex: i.correctIndex,
        referenceAnswer: i.referenceAnswer,
        explanation: i.explanation,
        qualityScore: i.qualityScore,
        qualityNotes: i.qualityNotes,
        failReasons: i.failReasons,
        reviewCount: i.reviewCount,
        sourceUrl: i.document?.sourceUrl ?? null,
        updatedAt: i.updatedAt.toISOString(),
        reviews: i.reviews.map((r) => ({
          stage: r.stage,
          decision: r.decision,
          score: r.score,
          notes: r.notes,
          reasons: r.reasons,
          model: r.model,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    };
  });

  /** Admin override of an Eval verdict; recorded as a `hitl` review row. */
  app.post<{
    Params: { id: string };
    Body: { decision: "published" | "failed"; notes?: string };
  }>("/admin/quality/queue/:id", async (request) => {
    const decision = request.body?.decision;
    if (decision !== "published" && decision !== "failed") {
      throw Object.assign(new Error("decision must be published or failed"), {
        statusCode: 400,
      });
    }
    const [item] = await prisma.$transaction([
      prisma.questionItem.update({
        where: { id: request.params.id },
        data: {
          status: decision,
          publishedAt: decision === "published" ? new Date() : null,
          qualityNotes: request.body?.notes?.slice(0, 1000) ?? undefined,
        },
      }),
      prisma.qualityReview.create({
        data: {
          itemId: request.params.id,
          stage: "hitl",
          decision,
          score: decision === "published" ? 1 : 0,
          notes: request.body?.notes?.slice(0, 1000) ?? "admin override",
        },
      }),
    ]);
    return { item };
  });

  /** Send a failed item back through the automated Eval stage. */
  app.post<{ Params: { id: string } }>("/admin/quality/queue/:id/requeue", async (request) => {
    const item = await prisma.questionItem.update({
      where: { id: request.params.id },
      data: { status: "draft", failReasons: [], qualityScore: null, publishedAt: null },
    });
    return { item };
  });

  app.get("/admin/health", async () => {
    const [documents, chunks, embedded, grouped, lastRun] = await Promise.all([
      prisma.document.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.chunk.count(),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "Chunk" WHERE "embedding" IS NOT NULL
      `,
      prisma.questionItem.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.generationRun.findFirst({ orderBy: { startedAt: "desc" } }),
    ]);

    const countBy = (rows: Array<{ status: string; _count: { _all: number } }>, key: string) =>
      rows.find((r) => r.status === key)?._count._all ?? 0;

    return {
      documents: {
        pending: countBy(documents as never, "pending"),
        extracting: countBy(documents as never, "extracting"),
        extracted: countBy(documents as never, "extracted"),
        failed: countBy(documents as never, "failed"),
      },
      chunks: { total: chunks, embedded: Number(embedded[0]?.count ?? 0) },
      questionItems: {
        draft: countBy(grouped as never, "draft"),
        needsReview: countBy(grouped as never, "needs_review"),
        published: countBy(grouped as never, "published"),
        failed: countBy(grouped as never, "failed"),
      },
      lastGenerationRun: lastRun
        ? {
            id: lastRun.id,
            examSlug: lastRun.examSlug,
            subject: lastRun.subject,
            status: lastRun.status,
            requested: lastRun.requested,
            drafted: lastRun.drafted,
            chunksUsed: lastRun.chunksUsed,
            model: lastRun.model,
            error: lastRun.error,
            startedAt: lastRun.startedAt.toISOString(),
            finishedAt: lastRun.finishedAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  app.get("/admin/documents", async (request) => {
    const q = request.query as { status?: string; limit?: string };
    const items = await prisma.document.findMany({
      where: q.status ? { status: q.status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: Math.min(100, Number(q.limit || 50)),
      include: { _count: { select: { chunks: true } } },
    });
    return {
      items: items.map((d) => ({
        id: d.id,
        examSlug: d.examSlug,
        examTitle: d.examTitle,
        kind: d.kind,
        sourceUrl: d.sourceUrl,
        status: d.status,
        failReason: d.failReason,
        attempts: d.attempts,
        chunkCount: d._count.chunks,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  });
}
