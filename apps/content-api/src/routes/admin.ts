// Concept: HITL (human-in-the-loop review queue) + pipeline health
//
// Reached through the study API's /admin/content/* proxy. Everything an admin
// can do here is a decision the automated Eval stage deliberately deferred.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "../lib/env";
import { computePipelineMetrics } from "../lib/metrics";
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
    const q = request.query as { status?: string; limit?: string; examSlug?: string; role?: string };
    const items = await prisma.document.findMany({
      where: {
        ...(q.status ? { status: q.status as never } : {}),
        ...(q.examSlug ? { examSlug: String(q.examSlug) } : {}),
        ...(q.role ? { role: q.role as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(100, Number(q.limit || 50)),
      include: { _count: { select: { chunks: true, sections: true } } },
    });
    return {
      items: items.map((d) => ({
        id: d.id,
        examSlug: d.examSlug,
        examTitle: d.examTitle,
        kind: d.kind,
        role: d.role,
        roleConfidence: d.roleConfidence,
        roleMethod: d.roleMethod,
        subtype: d.subtype,
        rank: d.rank,
        sourceUrl: d.sourceUrl,
        status: d.status,
        failReason: d.failReason,
        attempts: d.attempts,
        chunkCount: d._count.chunks,
        sectionCount: d._count.sections,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  });

  /** Document detail with sections + scores for admin HITL (§31.2). */
  app.get<{ Params: { id: string } }>("/admin/documents/:id", async (request) => {
    const document = await prisma.document.findUnique({
      where: { id: request.params.id },
      include: {
        sections: {
          orderBy: { ordinal: "asc" },
          take: 200,
          include: {
            chunks: {
              orderBy: { ordinal: "asc" },
              take: 2,
              select: { text: true },
            },
          },
        },
        chunks: {
          where: { eligibility: "eligible" },
          select: { id: true, ordinal: true, eligibility: true, eligibilityReason: true },
          take: 100,
          orderBy: { ordinal: "asc" },
        },
      },
    });
    if (!document) {
      throw Object.assign(new Error("not found"), { statusCode: 404 });
    }
    return {
      document: {
        id: document.id,
        examSlug: document.examSlug,
        examTitle: document.examTitle,
        kind: document.kind,
        role: document.role,
        roleConfidence: document.roleConfidence,
        roleMethod: document.roleMethod,
        subtype: document.subtype,
        rank: document.rank,
        language: document.language,
        normalizerVersion: document.normalizerVersion,
        stats: document.stats,
        sourceUrl: document.sourceUrl,
        status: document.status,
        failReason: document.failReason,
      },
      sections: document.sections.map((s) => ({
        id: s.id,
        ordinal: s.ordinal,
        heading: s.heading,
        role: s.role,
        level: s.level,
        scores: s.scores,
        charCount: s.charCount,
        path: s.path,
        textPreview: s.chunks.map((c) => c.text).join("\n").slice(0, 600),
      })),
      eligibleChunks: document.chunks,
    };
  });

  app.get("/admin/metrics/pipeline", async (request) => {
    const q = request.query as { hours?: string };
    return computePipelineMetrics(prisma, { hours: Number(q.hours || 24) });
  });

  app.get("/admin/syllabi/:examSlug", async (request) => {
    const examSlug = (request.params as { examSlug: string }).examSlug;
    // Prefer active; fall back to latest needs_review so §48.3 admin can see stalled specs.
    let syllabus = await prisma.syllabus.findFirst({
      where: { examSlug, status: "active" },
      orderBy: { version: "desc" },
      include: {
        positions: true,
        nodes: { orderBy: [{ depth: "asc" }, { ordinal: "asc" }], take: 400 },
      },
    });
    if (!syllabus) {
      syllabus = await prisma.syllabus.findFirst({
        where: { examSlug, status: "needs_review" },
        orderBy: { version: "desc" },
        include: {
          positions: true,
          nodes: { orderBy: [{ depth: "asc" }, { ordinal: "asc" }], take: 400 },
        },
      });
    }
    if (!syllabus) {
      return { syllabus: null, coverage: [], tree: [], rawSections: [] };
    }

    const coverage = [];
    for (const node of syllabus.nodes.filter((n) => n.depth >= 1).slice(0, 80)) {
      const [kus, published, pending] = await Promise.all([
        prisma.knowledgeUnit.count({
          where: { syllabusNodeId: node.id, status: "active" },
        }),
        prisma.questionItem.count({
          where: { syllabusNodeId: node.id, status: "published" },
        }),
        prisma.questionItem.count({
          where: {
            syllabusNodeId: node.id,
            status: { in: ["draft", "needs_review"] },
          },
        }),
      ]);
      coverage.push({
        syllabusNodeId: node.id,
        title: node.title,
        pathSlug: node.pathSlug,
        kus,
        published,
        pending,
      });
    }

    const tree = syllabus.nodes.map((n) => ({
      id: n.id,
      parentId: n.parentId,
      depth: n.depth,
      ordinal: n.ordinal,
      title: n.title,
      pathSlug: n.pathSlug,
      canonicalKey: n.canonicalKey,
      rawText: n.rawText,
      status: n.status,
    }));

    let rawSections: Array<{
      sectionId: string;
      ordinal: number;
      heading: string | null;
      role: string;
      textPreview: string;
    }> = [];
    if (syllabus.status === "needs_review" && syllabus.sourceDocumentId) {
      const sections = await prisma.section.findMany({
        where: { documentId: syllabus.sourceDocumentId },
        orderBy: { ordinal: "asc" },
        take: 80,
        include: {
          chunks: {
            orderBy: { ordinal: "asc" },
            take: 2,
            select: { text: true },
          },
        },
      });
      rawSections = sections.map((s) => ({
        sectionId: s.id,
        ordinal: s.ordinal,
        heading: s.heading,
        role: s.role,
        textPreview: s.chunks.map((c) => c.text).join("\n").slice(0, 800),
      }));
    }

    return {
      syllabus: {
        id: syllabus.id,
        examSlug: syllabus.examSlug,
        version: syllabus.version,
        status: syllabus.status,
        sourceDocumentId: syllabus.sourceDocumentId,
        positions: syllabus.positions,
        nodeCount: syllabus.nodes.length,
      },
      coverage,
      tree,
      rawSections,
    };
  });
}
