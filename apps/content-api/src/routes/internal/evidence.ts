import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { listUnembeddedChunks, searchChunks, setChunkEmbedding } from "../../lib/vectors";

export async function registerInternalEvidenceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/internal/embeddings/queue", async (request) => {
    const q = request.query as { limit?: string; eligibleOnly?: string };
    const items = await listUnembeddedChunks(
      Number(q.limit || 32),
      q.eligibleOnly === "true",
    );
    return { items };
  });

  app.put<{ Params: { id: string }; Body: { embedding: number[] } }>(
    "/internal/chunks/:id/embedding",
    async (request) => {
      const embedding = request.body?.embedding;
      if (!Array.isArray(embedding)) {
        throw Object.assign(new Error("embedding must be a number array"), { statusCode: 400 });
      }
      await setChunkEmbedding(request.params.id, embedding);
      return { ok: true };
    },
  );

  /** Retrieval for grounding Generation. */
  app.post<{
    Body: {
      embedding: number[];
      examSlug?: string;
      syllabusNodeId?: string;
      canonicalKey?: string;
      limit?: number;
      eligibleOnly?: boolean;
    };
  }>("/internal/chunks/search", async (request) => {
    const matches = await searchChunks({
      embedding: request.body?.embedding ?? [],
      examSlug: request.body?.examSlug ?? null,
      syllabusNodeId: request.body?.syllabusNodeId ?? null,
      canonicalKey: request.body?.canonicalKey ?? null,
      limit: Number(request.body?.limit || 8),
      eligibleOnly: request.body?.eligibleOnly !== false,
    });
    return { matches };
  });

  app.get("/internal/previous-questions/stems", async (request) => {
    const q = request.query as { examFamily?: string; syllabusNodeId?: string; limit?: string };
    const items = await prisma.previousQuestion.findMany({
      where: {
        ...(q.examFamily ? { examFamily: String(q.examFamily) } : {}),
        ...(q.syllabusNodeId ? { syllabusNodeId: String(q.syllabusNodeId) } : {}),
      },
      select: { id: true, prompt: true, options: true, year: true, number: true },
      take: Math.min(100, Number(q.limit || 40)),
      orderBy: [{ year: "desc" }, { number: "asc" }],
    });
    return {
      stems: items.map((i) => i.prompt),
      exemplars: items.slice(0, 5).map((i) => ({
        id: i.id,
        stem: i.prompt,
        options: Array.isArray(i.options) ? (i.options as string[]) : [],
        note: "formato apenas" as const,
      })),
    };
  });

  app.post<{ Body: { items: Array<Record<string, unknown>> } }>(
    "/internal/previous-questions",
    async (request) => {
      let created = 0;
      const ids: string[] = [];
      for (const item of request.body?.items ?? []) {
        const fingerprint = String(item.fingerprint);
        const existing = await prisma.previousQuestion.findUnique({ where: { fingerprint } });
        if (existing) {
          ids.push(existing.id);
          continue;
        }
        const row = await prisma.previousQuestion.create({
          data: {
            fingerprint,
            documentId: String(item.documentId),
            examFamily: String(item.examFamily),
            banca: (item.banca as string) ?? null,
            year: item.year != null ? Number(item.year) : null,
            position: (item.position as string) ?? null,
            phase: (item.phase as string) ?? null,
            number: Number(item.number),
            bookletType: (item.bookletType as string) ?? null,
            passage: item.passage != null ? String(item.passage).slice(0, 8000) : null,
            prompt: String(item.prompt),
            options: (item.options as never) ?? [],
            correctIndex: item.correctIndex != null ? Number(item.correctIndex) : null,
            status: item.status != null ? String(item.status) : "ok",
            subjectHint: (item.subjectHint as string) ?? null,
            syllabusNodeId: (item.syllabusNodeId as string) ?? null,
            canonicalKey: (item.canonicalKey as string) ?? null,
            mapScore: item.mapScore != null ? Number(item.mapScore) : null,
          },
        });
        ids.push(row.id);
        created += 1;
      }
      return { created, ids };
    },
  );

  app.get("/internal/style-profiles", async (request) => {
    const q = request.query as {
      banca?: string;
      canonicalSubjectId?: string;
      examSlug?: string;
    };
    const banca = String(q.banca || q.examSlug || "").trim();
    const canonicalSubjectId = String(q.canonicalSubjectId || "").trim();
    if (!banca && !canonicalSubjectId) {
      return { profile: null };
    }
    const row = await prisma.examStyleProfile.findFirst({
      where: {
        ...(banca ? { banca } : {}),
        ...(canonicalSubjectId ? { canonicalSubjectId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return { profile: row?.profile ?? null, sampleSize: row?.sampleSize ?? 0 };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/style-profiles", async (request) => {
    const body = request.body ?? {};
    const banca = String(body.banca || "unknown");
    const canonicalSubjectId = String(body.canonicalSubjectId || "geral");
    const positionFamily = (body.positionFamily as string) ?? null;
    await prisma.examStyleProfile.upsert({
      where: {
        banca_canonicalSubjectId_positionFamily: {
          banca,
          canonicalSubjectId,
          positionFamily,
        },
      },
      create: {
        banca,
        canonicalSubjectId,
        positionFamily,
        sampleSize: Number(body.sampleSize || 0),
        profile: (body.profile as never) ?? {},
      },
      update: {
        sampleSize: Number(body.sampleSize || 0),
        profile: (body.profile as never) ?? {},
      },
    });
    return { ok: true };
  });
}
