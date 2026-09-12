// Concept: Extraction + Generation + Question bank (worker-facing write surface)
//
// Callers: content-worker (extraction, embeddings, generation) and
// content-quality (Eval verdicts). Nothing here can be reached from the web.
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  questionItemFingerprint,
  subjectSlug as toSubjectSlug,
  type DraftQuestionsRequest,
  type QualityVerdict,
} from "@quizzeira/shared";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { getArtifactObject } from "../lib/storage";
import { listUnembeddedChunks, searchChunks, setChunkEmbedding } from "../lib/vectors";

function assertInternal(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.internalApiKey && key !== env.adminInternalKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export async function registerInternalRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/internal")) assertInternal(request);
  });

  // ── Extraction ────────────────────────────────────────────────────────────

  /**
   * Register a Discovery artifact as a Document. Idempotent on
   * discoveryArtifactId so the worker can replay its queue safely.
   */
  app.post<{ Body: Record<string, unknown> }>("/internal/documents", async (request) => {
    const body = request.body ?? {};
    const discoveryArtifactId = (body.discoveryArtifactId as string) || null;
    const examSlug = String(body.examSlug || "").trim();
    if (!examSlug) {
      throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
    }

    if (discoveryArtifactId) {
      const existing = await prisma.document.findUnique({ where: { discoveryArtifactId } });
      if (existing) return { document: existing, created: false };
    }

    const document = await prisma.document.create({
      data: {
        discoveryArtifactId,
        examSlug,
        examTitle: (body.examTitle as string) || null,
        kind: (body.kind as never) || "other",
        role: ((body.roleHint as string) || "unknown") as never,
        sourceUrl: (body.sourceUrl as string) || null,
        storageKey: (body.storageKey as string) || null,
        checksum: (body.checksum as string) || null,
        contentHash: (body.contentHash as string) || (body.checksum as string) || null,
        contentType: (body.contentType as string) || null,
      },
    });
    return { document, created: true };
  });

  app.get("/internal/extraction/queue", async (request) => {
    const q = request.query as { limit?: string };
    const items = await prisma.document.findMany({
      where: { status: "pending", attempts: { lt: 3 } },
      orderBy: { createdAt: "asc" },
      take: Math.min(50, Number(q.limit || 5)),
    });
    return {
      items: items.map((d) => ({
        id: d.id,
        examSlug: d.examSlug,
        examTitle: d.examTitle,
        kind: d.kind,
        sourceUrl: d.sourceUrl,
        storageKey: d.storageKey,
        contentType: d.contentType,
        attempts: d.attempts,
      })),
    };
  });

  /**
   * Documents of one exam, optionally by kind. The OAB extractor needs it: a
   * caderno is only draftable once the edition's gabarito has been ingested,
   * and the two arrive as separate artifacts in either order.
   */
  app.get("/internal/documents", async (request) => {
    const q = request.query as { examSlug?: string; kind?: string; limit?: string };
    const examSlug = String(q.examSlug || "").trim();
    if (!examSlug) {
      throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
    }
    const items = await prisma.document.findMany({
      where: { examSlug, kind: q.kind ? (q.kind as never) : undefined },
      orderBy: { createdAt: "asc" },
      take: Math.min(50, Number(q.limit || 20)),
    });
    return {
      items: items.map((d) => ({
        id: d.id,
        examSlug: d.examSlug,
        examTitle: d.examTitle,
        kind: d.kind,
        status: d.status,
        sourceUrl: d.sourceUrl,
        storageKey: d.storageKey,
        contentType: d.contentType,
        attempts: d.attempts,
      })),
    };
  });

  /** Raw artifact bytes, base64 encoded, so the worker needs no S3 credentials. */
  app.get<{ Params: { id: string } }>("/internal/documents/:id/bytes", async (request) => {
    const document = await prisma.document.findUnique({ where: { id: request.params.id } });
    if (!document?.storageKey) {
      throw Object.assign(new Error("document has no stored bytes"), { statusCode: 404 });
    }
    const buf = await getArtifactObject(document.storageKey);
    return {
      contentType: document.contentType ?? "application/pdf",
      byteSize: buf.byteLength,
      base64: buf.toString("base64"),
    };
  });

  app.patch<{
    Params: { id: string };
    Body: { status?: string; failReason?: string; bumpAttempts?: boolean };
  }>("/internal/documents/:id", async (request) => {
    const body = request.body ?? {};
    const document = await prisma.document.update({
      where: { id: request.params.id },
      data: {
        status: (body.status as never) || undefined,
        failReason: body.failReason ? body.failReason.slice(0, 500) : undefined,
        attempts: body.bumpAttempts ? { increment: 1 } : undefined,
      },
    });
    return { document };
  });

  /** Extraction output. Replaces any prior chunks for the document. */
  app.post<{
    Params: { id: string };
    Body: {
      chunks: Array<{
        text: string;
        tokenCount?: number;
        contentHash?: string;
        eligibility?: string;
        eligibilityReason?: string | null;
        sectionOrdinal?: number;
      }>;
    };
  }>("/internal/documents/:id/chunks", async (request) => {
    const documentId = request.params.id;
    const chunks = (request.body?.chunks ?? []).filter((c) => c.text?.trim());
    await prisma.chunk.deleteMany({ where: { documentId } });
    if (chunks.length > 0) {
      await prisma.chunk.createMany({
        data: chunks.map((c, ordinal) => ({
          documentId,
          ordinal,
          text: c.text.trim(),
          tokenCount: Number(c.tokenCount || Math.ceil(c.text.length / 4)),
          contentHash: c.contentHash || "",
          eligibility: (c.eligibility as never) || "parked",
          eligibilityReason: c.eligibilityReason ?? null,
        })),
      });
    }
    await prisma.document.update({
      where: { id: documentId },
      data: { status: chunks.length > 0 ? "extracted" : "failed", failReason: null },
    });
    return { chunkCount: chunks.length };
  });

  app.post<{ Params: { id: string }; Body: { normalized: Record<string, unknown> } }>(
    "/internal/documents/:id/normalized",
    async (request) => {
      const normalized = request.body?.normalized ?? {};
      const document = await prisma.document.update({
        where: { id: request.params.id },
        data: {
          contentHash: (normalized.contentHash as string) || undefined,
          stats: (normalized.stats as never) || undefined,
          language: ((normalized.stats as { language?: string } | undefined)?.language) || undefined,
          normalizerVersion: "1",
          status: "classifying",
        },
      });
      return { document };
    },
  );

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/documents/:id/classification",
    async (request) => {
      const body = request.body ?? {};
      const sections = (body.sections as Array<Record<string, unknown>>) || [];
      await prisma.section.deleteMany({ where: { documentId: request.params.id } });
      if (sections.length) {
        await prisma.section.createMany({
          data: sections.map((s) => ({
            documentId: request.params.id,
            ordinal: Number(s.ordinal || 0),
            path: (s.path as never) || [],
            heading: (s.heading as string) || null,
            level: Number(s.level || 1),
            role: (s.role as never) || "other",
            scores: (s.scores as never) || undefined,
            charCount: Number(s.charCount || 0),
          })),
        });
      }
      const document = await prisma.document.update({
        where: { id: request.params.id },
        data: {
          role: (body.role as never) || "unknown",
          roleConfidence: body.roleConfidence != null ? Number(body.roleConfidence) : null,
          roleMethod: (body.roleMethod as string) || null,
          subtype: (body.subtype as string) || null,
        },
      });
      return { document };
    },
  );

  app.post<{ Body: Record<string, unknown> }>("/internal/syllabus", async (request) => {
    const body = request.body ?? {};
    const examSlug = String(body.examSlug || "");
    const latest = await prisma.syllabus.findFirst({
      where: { examSlug },
      orderBy: { version: "desc" },
    });
    const version = (latest?.version ?? 0) + 1;
    if (latest) {
      await prisma.syllabus.update({ where: { id: latest.id }, data: { status: "superseded" } });
    }
    const syllabus = await prisma.syllabus.create({
      data: {
        examSlug,
        version,
        sourceDocumentId: String(body.sourceDocumentId || ""),
        sourceDocumentHash: String(body.sourceDocumentHash || ""),
        status: String(body.status || "active"),
        positions: {
          create: ((body.positions as Array<Record<string, unknown>>) || []).map((p) => ({
            title: String(p.title || ""),
            slug: String(p.slug || ""),
            implicit: Boolean(p.implicit),
          })),
        },
        nodes: {
          create: ((body.nodes as Array<Record<string, unknown>>) || []).map((n) => ({
            parentId: null,
            depth: Number(n.depth || 0),
            ordinal: Number(n.ordinal || 0),
            title: String(n.title || ""),
            rawText: String(n.rawText || n.title || ""),
            pathSlug: String(n.pathSlug || ""),
            canonicalSubjectId: (n.canonicalSubjectId as string) || null,
            canonicalKey: String(n.canonicalKey || ""),
            scope: String(n.scope || "basic"),
            positionIds: (n.positionIds as never) || [],
            status: "active",
            extraction: (n.extraction as never) || { method: "outline", confidence: 0.5 },
          })),
        },
      },
      include: { positions: true, nodes: true },
    });
    return { syllabus };
  });

  app.get("/internal/syllabus/:examSlug", async (request) => {
    const params = request.params as { examSlug: string };
    const syllabus = await prisma.syllabus.findFirst({
      where: { examSlug: params.examSlug, status: "active" },
      include: { positions: true, nodes: true },
      orderBy: { version: "desc" },
    });
    return { syllabus };
  });

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/documents/:id/previous-questions",
    async (request) => {
      const body = request.body ?? {};
      const items = (body.items as Array<Record<string, unknown>>) || [];
      let created = 0;
      for (const [i, item] of items.entries()) {
        const prompt = String(item.prompt || item.stem || "");
        if (!prompt) continue;
        const fingerprint = `${request.params.id}:${i}:${prompt.slice(0, 80)}`;
        try {
          await prisma.previousQuestion.create({
            data: {
              fingerprint,
              documentId: request.params.id,
              examFamily: String(body.examFamily || ""),
              number: Number(item.number || i + 1),
              prompt,
              options: (item.options as never) || [],
              correctIndex: item.correctIndex != null ? Number(item.correctIndex) : null,
              passage: (item.passage as string) || null,
              subjectHint: (item.subject as string) || null,
            },
          });
          created += 1;
        } catch {
          // unique fingerprint
        }
      }
      return { created };
    },
  );

  /** Demote legacy generation-origin published items (checklist item 4). */
  app.post("/internal/admin/demote-legacy-generation", async () => {
    const result = await prisma.questionItem.updateMany({
      where: { origin: "generation", status: "published", syllabusNodeId: null },
      data: { status: "needs_review", publishedAt: null },
    });
    return { demoted: result.count };
  });

  app.get<{ Params: { id: string } }>(
    "/internal/question-items/:id/provenance",
    async (request) => {
      const item = await prisma.questionItem.findUnique({
        where: { id: request.params.id },
        include: { reviews: true, document: true, generationRun: true },
      });
      if (!item) throw Object.assign(new Error("not found"), { statusCode: 404 });
      const kus = Array.isArray(item.knowledgeUnitIds)
        ? await prisma.knowledgeUnit.findMany({
            where: { id: { in: item.knowledgeUnitIds as string[] } },
          })
        : [];
      const node = item.syllabusNodeId
        ? await prisma.syllabusNode.findUnique({ where: { id: item.syllabusNodeId } })
        : null;
      return {
        item,
        syllabusNode: node,
        knowledgeUnits: kus,
        document: item.document,
        generationRun: item.generationRun,
        reviews: item.reviews,
      };
    },
  );

  // ── Embeddings ────────────────────────────────────────────────────────────

  app.get("/internal/embeddings/queue", async (request) => {
    const q = request.query as { limit?: string };
    const items = await listUnembeddedChunks(Number(q.limit || 32));
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
  app.post<{ Body: { embedding: number[]; examSlug?: string; limit?: number } }>(
    "/internal/chunks/search",
    async (request) => {
      const matches = await searchChunks({
        embedding: request.body?.embedding ?? [],
        examSlug: request.body?.examSlug ?? null,
        limit: Number(request.body?.limit || 8),
      });
      return { matches };
    },
  );

app.get("/internal/knowledge-units/count", async (request) => {
    const q = request.query as { syllabusNodeId?: string; canonicalKey?: string };
    const count = await prisma.knowledgeUnit.count({
      where: {
        status: "active",
        ...(q.syllabusNodeId ? { syllabusNodeId: q.syllabusNodeId } : {}),
        ...(q.canonicalKey ? { canonicalKey: q.canonicalKey } : {}),
      },
    });
    return { count };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/knowledge-units", async (request) => {
    const body = request.body ?? {};
    const units = (body.units as Array<Record<string, unknown>>) || [];
    const created: string[] = [];
    for (const u of units) {
      const statement = String(u.statement || "").trim();
      const syllabusNodeId = String(u.syllabusNodeId || body.syllabusNodeId || "");
      if (!statement || !syllabusNodeId) continue;
      const row = await prisma.knowledgeUnit.create({
        data: {
          syllabusNodeId,
          canonicalKey: String(u.canonicalKey || body.canonicalKey || ""),
          kind: String(u.kind || "fact"),
          statement,
          example: (u.example as string) || null,
          qualifiers: (u.qualifiers as never) || [],
          evidence: (u.evidence as never) || { chunkIds: [] },
          status: "active",
          extraction: (u.extraction as never) || { method: "heuristic", confidence: 0.7 },
        },
      });
      created.push(row.id);
    }
    return { created: created.length, ids: created };
  });

  /**
   * Leaf-level generation queue (§24.1): nodes with enough active KUs and a
   * published+pending deficit below target.
   */
  app.get("/internal/generation/leaf-queue", async (request) => {
    const q = request.query as { limit?: string; target?: string; minKus?: string };
    const target = Math.max(1, Number(q.target || 8));
    const limit = Math.min(20, Number(q.limit || 3));
    const minKus = Math.max(1, Number(q.minKus || 4));

    const nodes = await prisma.syllabusNode.findMany({
      where: { status: "active", depth: { gte: 1 } },
      take: 200,
      orderBy: { ordinal: "asc" },
    });

    const items: Array<Record<string, unknown>> = [];
    for (const node of nodes) {
      const kus = await prisma.knowledgeUnit.findMany({
        where: { syllabusNodeId: node.id, status: "active" },
        take: 24,
      });
      if (kus.length < minKus) continue;

      const syllabus = await prisma.syllabus.findUnique({ where: { id: node.syllabusId } });
      if (!syllabus || syllabus.status !== "active") continue;
      if (examSlugPriority(syllabus.examSlug) < 0) continue;

      const [published, pending] = await Promise.all([
        prisma.questionItem.count({
          where: { syllabusNodeId: node.id, status: "published" },
        }),
        prisma.questionItem.count({
          where: { syllabusNodeId: node.id, status: { in: ["draft", "needs_review"] } },
        }),
      ]);
      const deficit = target - published - pending;
      if (deficit <= 0) continue;

      const pathParts = node.pathSlug ? node.pathSlug.split("/").filter(Boolean) : [node.title];
      const styleRow = await prisma.examStyleProfile.findFirst({
        where: { canonicalSubjectId: node.canonicalSubjectId ?? node.canonicalKey },
        orderBy: { updatedAt: "desc" },
      });
      const styleProfile =
        styleRow?.profile && typeof styleRow.profile === "object"
          ? (styleRow.profile as Record<string, unknown>)
          : null;

      const doc = await prisma.document.findFirst({
        where: { examSlug: syllabus.examSlug },
        select: { examTitle: true },
        orderBy: { updatedAt: "desc" },
      });

      items.push({
        examSlug: syllabus.examSlug,
        examTitle: doc?.examTitle ?? null,
        syllabusNodeId: node.id,
        canonicalKey: node.canonicalKey,
        path: pathParts.length ? pathParts : [node.title],
        rawText: node.rawText,
        subject: pathParts[0] ?? node.title,
        deficit,
        knowledgeUnits: kus.map((k) => ({
          id: k.id,
          kind: k.kind,
          statement: k.statement,
          example: k.example,
          qualifiers: k.qualifiers,
        })),
        style: styleProfile
          ? {
              optionCount: Number(styleProfile.optionCount ?? 5),
              stemLengthP50: Number(styleProfile.stemLengthP50 ?? 120),
              negativeStemRate: Number(styleProfile.negativeStemRate ?? 0.15),
              commandVerbs: Array.isArray(styleProfile.commandVerbs)
                ? (styleProfile.commandVerbs as string[])
                : ["Assinale"],
              certoErrado: Boolean(styleProfile.certoErrado),
              difficultyProxy: Number(styleProfile.difficultyProxy ?? 0.5),
            }
          : null,
      });
      if (items.length >= limit) break;
    }
    return { items };
  });

  // ── Generation ────────────────────────────────────────────────────────────

  /**
   * Exam/subject pairs that have extracted, embedded material but too few
   * published questions. This is the worker's Generation work list.
   */
  app.get("/internal/generation/queue", async (request) => {
    const q = request.query as { limit?: string; target?: string };
    const target = Math.max(1, Number(q.target || 20));
    const limit = Math.min(20, Number(q.limit || 3));

    const documents = await prisma.document.findMany({
      where: { status: "extracted" },
      select: { examSlug: true, examTitle: true },
      distinct: ["examSlug"],
      orderBy: { updatedAt: "desc" },
      take: 80,
    });

    const items: Array<{
      examSlug: string;
      examTitle: string | null;
      published: number;
      pending: number;
      deficit: number;
    }> = [];

    const ranked = [...documents].sort(
      (a, b) => examSlugPriority(b.examSlug) - examSlugPriority(a.examSlug),
    );

    for (const doc of ranked) {
      if (examSlugPriority(doc.examSlug) < 0) continue;
      const [published, pending] = await Promise.all([
        prisma.questionItem.count({ where: { examSlug: doc.examSlug, status: "published" } }),
        prisma.questionItem.count({
          where: { examSlug: doc.examSlug, status: { in: ["draft", "needs_review"] } },
        }),
      ]);
      // Drafts already in flight count against the target so we do not queue
      // the same work twice while Eval is still catching up.
      const deficit = target - published - pending;
      if (deficit > 0) {
        items.push({ examSlug: doc.examSlug, examTitle: doc.examTitle, published, pending, deficit });
      }
      if (items.length >= limit) break;
    }

    return { items };
  });

/** Prefer year/concurso-like slugs; negative = nav chrome — never generate. */
function examSlugPriority(slug: string): number {
  const s = slug.toLowerCase();
  if (
    /^(noticias|resultados|certificacao|concluidos|em-andamento|voltar-para-home|informe-de-rendimentos|codigo-de-etica(?:-e-conduta)?|pisa-para-escolas|politica-de-integridade|portal-do-colaborador)$/i.test(
      s,
    )
  ) {
    return -100;
  }
  let score = 0;
  if (/20\d{2}/.test(s)) score += 20;
  if (/transpetro|cesgranrio|caixa|banco|prefeitura|concurso/.test(s)) score += 10;
  if (s.length >= 12) score += 3;
  return score;
}
  app.post<{
    Body: {
      examSlug: string;
      subject: string;
      requested?: number;
      model?: string;
      syllabusNodeId?: string;
      briefKey?: string;
    };
  }>("/internal/generation/runs", async (request) => {
      const body = request.body ?? { examSlug: "", subject: "" };
      const run = await prisma.generationRun.create({
        data: {
          examSlug: String(body.examSlug || ""),
          subject: String(body.subject || "geral"),
          status: "running",
          requested: Number(body.requested || 0),
          model: body.model ?? null,
          syllabusNodeId: body.syllabusNodeId ? String(body.syllabusNodeId) : null,
          briefKey: body.briefKey ? String(body.briefKey) : null,
        },
      });
      return { run };
    },
  );

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/generation/runs/:id",
    async (request) => {
      const body = request.body ?? {};
      const run = await prisma.generationRun.update({
        where: { id: request.params.id },
        data: {
          status: (body.status as never) || undefined,
          drafted: body.drafted != null ? Number(body.drafted) : undefined,
          chunksUsed: body.chunksUsed != null ? Number(body.chunksUsed) : undefined,
          error: body.error ? String(body.error).slice(0, 500) : undefined,
          finishedAt: body.finishedAt ? new Date(String(body.finishedAt)) : undefined,
        },
      });
      return { run };
    },
  );

  // ── Question bank (draft writes) ──────────────────────────────────────────

  /**
   * The only way a QuestionItem enters the system, and it always lands as
   * `draft`. Content cannot publish — that is the Eval stage's decision.
   */
  app.post<{
    Body: DraftQuestionsRequest & {
      generationRunId?: string;
      syllabusNodeId?: string;
      canonicalKey?: string;
      knowledgeUnitIds?: string[];
    };
  }>("/internal/question-items/draft", async (request) => {
      const body = request.body;
      const examSlug = String(body?.examSlug || "").trim();
      if (!examSlug) {
        throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
      }
      const subject = body.subject?.trim() || "geral";
      const slug = toSubjectSlug(subject);
      const ids: string[] = [];
      let skipped = 0;
      const batchKuIds = Array.isArray(body.knowledgeUnitIds)
        ? body.knowledgeUnitIds.map(String)
        : [];

      for (const q of body.questions ?? []) {
        if (!q.prompt?.trim()) {
          skipped += 1;
          continue;
        }
        const fingerprint = questionItemFingerprint({
          examSlug,
          subjectSlug: slug,
          prompt: q.prompt,
          options: q.options,
        });
        const existing = await prisma.questionItem.findUnique({ where: { fingerprint } });
        if (existing) {
          skipped += 1;
          continue;
        }
        const perQuestionKus = Array.isArray(
          (q as unknown as { knowledgeUnitIds?: unknown }).knowledgeUnitIds,
        )
          ? ((q as unknown as { knowledgeUnitIds: unknown[] }).knowledgeUnitIds).map(String)
          : batchKuIds;
        const created = await prisma.questionItem.create({
          data: {
            fingerprint,
            examSlug,
            subject,
            subjectSlug: slug,
            emphasis: body.emphasis ?? null,
            origin: (body.origin as never) || "generation",
            status: "draft",
            type: q.type as never,
            prompt: q.prompt.trim(),
            options: q.type === "MULTIPLE_CHOICE" ? (q.options ?? []) : undefined,
            correctIndex: q.type === "MULTIPLE_CHOICE" ? q.correctIndex : null,
            referenceAnswer: q.type === "OPEN" ? q.referenceAnswer : null,
            explanation: q.explanation ?? null,
            locale: body.locale || "pt",
            documentId: body.documentId ?? null,
            generationRunId: body.generationRunId ?? null,
            syllabusNodeId: body.syllabusNodeId ? String(body.syllabusNodeId) : null,
            canonicalKey: body.canonicalKey ? String(body.canonicalKey) : null,
            knowledgeUnitIds: perQuestionKus,
          },
        });
        ids.push(created.id);
      }

      return { created: ids.length, skipped, ids };
    },
  );

  // ── Eval hand-off ─────────────────────────────────────────────────────────

  /** Drafts awaiting an Eval verdict; content-quality drains this. */
  app.get("/internal/question-items/pending-review", async (request) => {
    const q = request.query as { limit?: string };
    const items = await prisma.questionItem.findMany({
      where: { status: "draft" },
      orderBy: { createdAt: "asc" },
      take: Math.min(50, Number(q.limit || 10)),
    });

    const enriched = [];
    for (const i of items) {
      const kuIds = Array.isArray(i.knowledgeUnitIds) ? (i.knowledgeUnitIds as string[]) : [];
      const kus =
        kuIds.length > 0
          ? await prisma.knowledgeUnit.findMany({ where: { id: { in: kuIds } } })
          : [];
      enriched.push({
        id: i.id,
        examSlug: i.examSlug,
        subject: i.subject,
        type: i.type,
        prompt: i.prompt,
        options: i.options,
        correctIndex: i.correctIndex,
        referenceAnswer: i.referenceAnswer,
        explanation: i.explanation,
        locale: i.locale,
        origin: i.origin,
        documentId: i.documentId,
        syllabusNodeId: i.syllabusNodeId,
        knowledgeUnitIds: kuIds,
        evidenceTexts: kus.map((k) => `${k.statement}${k.example ? ` ${k.example}` : ""}`),
      });
    }
    return { items: enriched };
  });

  /**
   * Publish gate. This is the single transition into `published` in the whole
   * platform; the study API reads nothing else.
   */
  app.post<{ Body: QualityVerdict & { stage?: string; model?: string } }>(
    "/internal/question-items/verdict",
    async (request) => {
      const body = request.body;
      if (!body?.itemId) {
        throw Object.assign(new Error("itemId is required"), { statusCode: 400 });
      }
      const decision = body.decision;
      if (decision !== "published" && decision !== "failed" && decision !== "needs_review") {
        throw Object.assign(new Error(`unknown decision: ${decision}`), { statusCode: 400 });
      }

      const [item] = await prisma.$transaction([
        prisma.questionItem.update({
          where: { id: body.itemId },
          data: {
            status: decision,
            qualityScore: Number.isFinite(body.score) ? body.score : null,
            qualityNotes: body.notes?.slice(0, 1000) ?? null,
            failReasons: body.reasons ?? [],
            reviewCount: { increment: 1 },
            publishedAt: decision === "published" ? new Date() : null,
          },
        }),
        prisma.qualityReview.create({
          data: {
            itemId: body.itemId,
            stage: body.stage || "eval",
            decision,
            score: Number.isFinite(body.score) ? body.score : 0,
            notes: body.notes?.slice(0, 1000) ?? null,
            reasons: body.reasons ?? [],
            model: body.model ?? null,
          },
        }),
      ]);

      return { item };
    },
  );
}
