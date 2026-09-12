import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";

export async function registerInternalTopicQueryRoutes(app: FastifyInstance): Promise<void> {
  // ── Topic queries (§11.3 / §17.5) ──────────────────────────────────────────

  app.post<{ Body: Record<string, unknown> }>("/internal/topic-queries", async (request) => {
    const body = request.body ?? {};
    const syllabusNodeId = String(body.syllabusNodeId || "").trim();
    const canonicalKey = String(body.canonicalKey || "").trim();
    const queries = Array.isArray(body.queries)
      ? body.queries.map((q) => String(q).trim()).filter(Boolean)
      : [];

    let examId = String(body.examId || "").trim();
    const examSlug = String(body.examSlug || "").trim();
    if (!examId && examSlug) {
      const exam = await prisma.exam.findFirst({
        where: { examSlug },
        orderBy: { lastSeenAt: "desc" },
      });
      examId = exam?.id ?? "";
    }
    if (!examId || !syllabusNodeId || queries.length === 0) {
      throw Object.assign(
        new Error("examId|examSlug, syllabusNodeId, and queries[] are required"),
        { statusCode: 400 },
      );
    }

    const active = await prisma.topicQuery.findFirst({
      where: {
        examId,
        syllabusNodeId,
        status: { in: ["queued", "running"] },
      },
    });
    if (active) return { topicQuery: active, deduped: true };

    const row = await prisma.topicQuery.create({
      data: {
        examId,
        syllabusNodeId,
        canonicalKey: canonicalKey || syllabusNodeId,
        queries,
        status: "queued",
      },
    });
    return { topicQuery: row, deduped: false };
  });

  app.get("/internal/topic-queries", async (request) => {
    const q = request.query as {
      status?: string;
      limit?: string;
      syllabusNodeId?: string;
      examId?: string;
    };
    const items = await prisma.topicQuery.findMany({
      where: {
        ...(q.status ? { status: q.status } : {}),
        ...(q.syllabusNodeId ? { syllabusNodeId: String(q.syllabusNodeId) } : {}),
        ...(q.examId ? { examId: String(q.examId) } : {}),
      },
      orderBy: [{ nextRunAt: "asc" }, { createdAt: "asc" }],
      take: Math.min(50, Number(q.limit || 25)),
    });
    return { items };
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/topic-queries/:id",
    async (request) => {
      const body = request.body ?? {};
      const row = await prisma.topicQuery.update({
        where: { id: request.params.id },
        data: {
          status: (body.status as string) || undefined,
          candidatesFound:
            body.candidatesFound != null ? Number(body.candidatesFound) : undefined,
          candidatesStored:
            body.candidatesStored != null ? Number(body.candidatesStored) : undefined,
          nextRunAt: body.nextRunAt ? new Date(String(body.nextRunAt)) : undefined,
          finishedAt: body.finishedAt ? new Date(String(body.finishedAt)) : undefined,
          attempts: body.attempts != null ? Number(body.attempts) : undefined,
        },
      });
      return { topicQuery: row };
    },
  );
}
