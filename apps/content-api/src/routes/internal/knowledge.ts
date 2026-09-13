import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { primaryEvidenceDomain } from "./helpers";

export async function registerInternalKnowledgeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/internal/knowledge-units", async (request) => {
    const q = request.query as { syllabusNodeId?: string; ids?: string; limit?: string };
    const ids = String(q.ids || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length > 0) {
      const units = await prisma.knowledgeUnit.findMany({
        where: { id: { in: ids.slice(0, 50) }, status: "active" },
      });
      return {
        units: units.map((u) => ({
          id: u.id,
          kind: u.kind,
          statement: u.statement,
          example: u.example,
          qualifiers: Array.isArray(u.qualifiers) ? u.qualifiers : [],
          syllabusNodeId: u.syllabusNodeId,
          sourceDomain: primaryEvidenceDomain(u.evidence),
        })),
      };
    }
    const syllabusNodeId = String(q.syllabusNodeId || "").trim();
    if (!syllabusNodeId) {
      throw Object.assign(new Error("syllabusNodeId or ids is required"), { statusCode: 400 });
    }
    const units = await prisma.knowledgeUnit.findMany({
      where: { syllabusNodeId, status: "active" },
      take: Math.min(50, Number(q.limit || 24)),
      orderBy: { createdAt: "desc" },
    });
    return {
      units: units.map((u) => ({
        id: u.id,
        kind: u.kind,
        statement: u.statement,
        example: u.example,
        qualifiers: Array.isArray(u.qualifiers) ? u.qualifiers : [],
        sourceDomain: primaryEvidenceDomain(u.evidence),
      })),
    };
  });

  /** Mark KUs as ku_suspect when generation shape fails repeatedly (§24.7). */
  app.post<{ Body: { ids?: string[]; reason?: string } }>(
    "/internal/knowledge-units/flag-suspect",
    async (request) => {
      const ids = (request.body?.ids ?? []).map(String).filter(Boolean).slice(0, 50);
      if (ids.length === 0) return { updated: 0 };
      const updated = await prisma.knowledgeUnit.updateMany({
        where: { id: { in: ids }, status: "active" },
        data: { status: "ku_suspect" },
      });
      return { updated: updated.count, reason: request.body?.reason ?? "ku_suspect" };
    },
  );

  app.post<{ Body: { units: Array<Record<string, unknown>>; documentId?: string } }>(
    "/internal/knowledge-units",
    async (request) => {
      const units = request.body?.units ?? [];
      const documentId = request.body?.documentId ? String(request.body.documentId) : null;
      let created = 0;
      for (const unit of units) {
        const statement = String(unit.statement || "").trim();
        const syllabusNodeId = String(unit.syllabusNodeId || "").trim();
        if (!statement || !syllabusNodeId) continue;

        const evidenceIn = Array.isArray(unit.evidence)
          ? (unit.evidence as Array<Record<string, unknown>>)
          : [];
        const evidence = [];
        for (const ev of evidenceIn) {
          const row: Record<string, unknown> = { ...ev };
          if (!row.chunkId && documentId && row.chunkOrdinal != null) {
            const chunk = await prisma.chunk.findFirst({
              where: { documentId, ordinal: Number(row.chunkOrdinal) },
              select: { id: true, sectionId: true },
            });
            if (chunk) {
              row.chunkId = chunk.id;
              row.sectionId = chunk.sectionId;
            }
          }
          if (documentId && !row.documentId) row.documentId = documentId;
          evidence.push(row);
        }

        await prisma.knowledgeUnit.create({
          data: {
            syllabusNodeId,
            canonicalKey: String(unit.canonicalKey || syllabusNodeId),
            kind: String(unit.kind || "fact"),
            statement,
            example: (unit.example as string) ?? null,
            qualifiers: (unit.qualifiers as never) ?? [],
            evidence: evidence as never,
            quality: (unit.quality as never) ?? {},
            extraction: {
              documentId,
              at: new Date().toISOString(),
            },
            status: "active",
          },
        });
        created += 1;
      }
      return { created };
    },
  );

  /**
   * Leaves under TARGET_KU coverage for the discovery TopicQuery planner (§17.5).
   * Ordered by edital questionCount × weight, then PreviousQuestion frequency boost.
   */
  app.get("/internal/coverage/knowledge-gaps", async (request) => {
    const q = request.query as { limit?: string; targetKu?: string };
    const targetKu = Math.max(1, Number(q.targetKu || 12));
    const limit = Math.min(40, Number(q.limit || 20));

    const syllabi = await prisma.syllabus.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const scored: Array<Record<string, unknown> & { _rank: number }> = [];

    for (const syllabus of syllabi) {
      const leaves = await prisma.syllabusNode.findMany({
        where: { syllabusId: syllabus.id, depth: { gte: 1 }, status: "active" },
        take: 120,
      });

      for (const leaf of leaves) {
        const kuCount = await prisma.knowledgeUnit.count({
          where: {
            status: "active",
            OR: [{ syllabusNodeId: leaf.id }, { canonicalKey: leaf.canonicalKey }],
          },
        });
        if (kuCount >= targetKu) continue;

        const previousQuestionCount = await prisma.previousQuestion.count({
          where: {
            OR: [{ syllabusNodeId: leaf.id }, { canonicalKey: leaf.canonicalKey }],
          },
        });

        const pathParts = leaf.pathSlug.split("/").map((p) => p.trim()).filter(Boolean);
        const editalWeight = (leaf.questionCount ?? 1) * (leaf.weight ?? 1);
        scored.push({
          examSlug: syllabus.examSlug,
          syllabusNodeId: leaf.id,
          pathSlug: leaf.pathSlug,
          canonicalKey: leaf.canonicalKey,
          title: leaf.title,
          path: pathParts.length > 0 ? pathParts : [leaf.title],
          kuCount,
          questionCount: leaf.questionCount,
          weight: leaf.weight,
          previousQuestionCount,
          _rank: editalWeight + previousQuestionCount * 2,
        });
      }
    }

    scored.sort((a, b) => b._rank - a._rank);
    const items = scored.slice(0, limit).map(({ _rank: _ignored, ...rest }) => rest);
    return { items };
  });

  /**
   * Persist ChunkSyllabusMap rows after mapping tiers (§21 / §39.3).
   * Resolves chunkId via (documentId, chunkOrdinal).
   */
  app.post<{
    Body: {
      maps?: Array<{
        documentId: string;
        chunkOrdinal: number;
        syllabusNodeId: string;
        canonicalKey: string;
        score: number;
        method: string;
      }>;
    };
  }>("/internal/chunk-maps", async (request) => {
    const maps = request.body?.maps ?? [];
    let upserted = 0;
    for (const row of maps.slice(0, 500)) {
      const chunk = await prisma.chunk.findUnique({
        where: {
          documentId_ordinal: {
            documentId: String(row.documentId),
            ordinal: Number(row.chunkOrdinal),
          },
        },
        select: { id: true },
      });
      if (!chunk) continue;
      await prisma.chunkSyllabusMap.upsert({
        where: {
          chunkId_syllabusNodeId: {
            chunkId: chunk.id,
            syllabusNodeId: String(row.syllabusNodeId),
          },
        },
        create: {
          chunkId: chunk.id,
          syllabusNodeId: String(row.syllabusNodeId),
          canonicalKey: String(row.canonicalKey || "").slice(0, 400),
          score: Number(row.score) || 0,
          method: String(row.method || "lexical_t1").slice(0, 40),
        },
        update: {
          canonicalKey: String(row.canonicalKey || "").slice(0, 400),
          score: Number(row.score) || 0,
          method: String(row.method || "lexical_t1").slice(0, 40),
        },
      });
      upserted += 1;
    }
    return { upserted };
  });

  /** Eligible chunks with no syllabus map — re-map queue (§39.3). */
  app.get("/internal/chunks/eligible-unmapped", async (request) => {
    const q = request.query as { limit?: string; examSlug?: string };
    const limit = Math.min(100, Math.max(1, Number(q.limit || 32)));
    const examSlug = q.examSlug?.trim();
    const chunks = await prisma.chunk.findMany({
      where: {
        eligibility: "eligible",
        syllabusMaps: { none: {} },
        ...(examSlug ? { document: { examSlug } } : {}),
      },
      select: { id: true, documentId: true, ordinal: true, text: true },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
    return { items: chunks };
  });
}
