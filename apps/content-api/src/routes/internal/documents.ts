import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { getArtifactObject, getJsonObject, putObject } from "../../lib/storage";

export async function registerInternalDocumentRoutes(app: FastifyInstance): Promise<void> {
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
        role: (body.role as never) || undefined,
        subtype: (body.subtype as string) || null,
        sourceUrl: (body.sourceUrl as string) || null,
        storageKey: (body.storageKey as string) || null,
        checksum: (body.checksum as string) || null,
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
    Body: Record<string, unknown>;
  }>("/internal/documents/:id", async (request) => {
    const body = request.body ?? {};
    const document = await prisma.document.update({
      where: { id: request.params.id },
      data: {
        status: (body.status as never) || undefined,
        failReason:
          body.failReason === null
            ? null
            : body.failReason
              ? String(body.failReason).slice(0, 500)
              : undefined,
        attempts: body.bumpAttempts ? { increment: 1 } : undefined,
        role: (body.role as never) || undefined,
        roleConfidence: body.roleConfidence != null ? Number(body.roleConfidence) : undefined,
        roleMethod: body.roleMethod ? String(body.roleMethod) : undefined,
        subtype: body.subtype != null ? String(body.subtype) : undefined,
        contentHash: body.contentHash ? String(body.contentHash) : undefined,
        language: body.language ? String(body.language) : undefined,
        normalizerVersion: body.normalizerVersion ? String(body.normalizerVersion) : undefined,
        stats: body.stats ?? undefined,
        rank: body.rank != null ? Number(body.rank) : undefined,
        normalizedKey: body.normalizedKey ? String(body.normalizedKey) : undefined,
      },
    });
    return { document };
  });

  /**
   * Persist NormalizedDocument JSON to MinIO and set Document.normalizedKey (§35 / §39.3).
   */
  app.put<{
    Params: { id: string };
    Body: { document?: unknown; schemaVersion?: string };
  }>("/internal/documents/:id/normalized", async (request) => {
    const body = request.body ?? {};
    const payload = body.document ?? body;
    if (!payload || typeof payload !== "object") {
      throw Object.assign(new Error("normalized document body required"), { statusCode: 400 });
    }
    const existing = await prisma.document.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      throw Object.assign(new Error("not found"), { statusCode: 404 });
    }
    const rec = payload as Record<string, unknown>;
    const contentHash =
      (typeof rec.contentHash === "string" && rec.contentHash) ||
      existing.contentHash ||
      request.params.id;
    const version =
      (typeof rec.schemaVersion === "string" && rec.schemaVersion) ||
      String(body.schemaVersion || "1");
    const key = `normalized/${contentHash}/${version}.json`;
    await putObject(key, JSON.stringify(payload));
    const document = await prisma.document.update({
      where: { id: request.params.id },
      data: {
        normalizedKey: key,
        contentHash: typeof rec.contentHash === "string" ? rec.contentHash : undefined,
        language:
          rec.stats && typeof rec.stats === "object" && (rec.stats as { language?: string }).language
            ? String((rec.stats as { language: string }).language)
            : undefined,
        normalizerVersion:
          rec.extractor &&
          typeof rec.extractor === "object" &&
          (rec.extractor as { version?: string }).version
            ? String((rec.extractor as { version: string }).version)
            : undefined,
        stats: (rec.stats as never) ?? undefined,
      },
    });
    return { document, normalizedKey: key };
  });

  app.get<{ Params: { id: string } }>("/internal/documents/:id/normalized", async (request) => {
    const document = await prisma.document.findUnique({ where: { id: request.params.id } });
    if (!document?.normalizedKey) {
      throw Object.assign(new Error("normalized document not found"), { statusCode: 404 });
    }
    const normalized = await getJsonObject(document.normalizedKey);
    return { normalizedKey: document.normalizedKey, document: normalized };
  });

  /** V2 pipeline output: sections + chunks with eligibility. */
  app.post<{
    Params: { id: string };
    Body: {
      sections: Array<Record<string, unknown>>;
      chunks: Array<Record<string, unknown>>;
    };
  }>("/internal/documents/:id/pipeline-output", async (request) => {
    const documentId = request.params.id;
    const sections = request.body?.sections ?? [];
    const chunks = (request.body?.chunks ?? []).filter(
      (c) => typeof c.text === "string" && c.text.trim(),
    );

    await prisma.$transaction(async (tx) => {
      await tx.chunk.deleteMany({ where: { documentId } });
      await tx.section.deleteMany({ where: { documentId } });

      const sectionIds: string[] = [];
      for (const s of sections) {
        const created = await tx.section.create({
          data: {
            documentId,
            ordinal: Number(s.ordinal ?? sectionIds.length),
            path: (s.path as never) ?? [],
            heading: (s.heading as string) ?? null,
            level: Number(s.level ?? 0),
            role: (s.role as never) ?? "other",
            scores: (s.scores as never) ?? {},
            charCount: Number(s.charCount ?? 0),
            pageRange: (s.pageRange as never) ?? undefined,
          },
        });
        sectionIds.push(created.id);
      }

      if (chunks.length > 0) {
        await tx.chunk.createMany({
          data: chunks.map((c, ordinal) => {
            const text = String(c.text).trim();
            return {
              documentId,
              sectionId: sectionIds[Number(c.sectionOrdinal ?? 0)] ?? null,
              ordinal,
              text,
              tokenCount: Number(c.tokenCount || Math.ceil(text.length / 4)),
              contentHash:
                (c.contentHash as string) ||
                createHash("sha256").update(text).digest("hex"),
              eligibility: (c.eligibility as never) ?? "parked",
              eligibilityReason: (c.eligibilityReason as string) ?? null,
            };
          }),
        });
      }

      await tx.document.update({
        where: { id: documentId },
        data: {
          status: sections.length > 0 || chunks.length > 0 ? "extracted" : "failed",
          failReason: null,
        },
      });
    });

    return { sectionCount: sections.length, chunkCount: chunks.length };
  });

  /** Extraction output. Replaces any prior chunks for the document. */
  app.post<{
    Params: { id: string };
    Body: { chunks: Array<{ text: string; tokenCount?: number }> };
  }>("/internal/documents/:id/chunks", async (request) => {
    const documentId = request.params.id;
    const chunks = (request.body?.chunks ?? []).filter((c) => c.text?.trim());
    await prisma.chunk.deleteMany({ where: { documentId } });
    if (chunks.length > 0) {
      await prisma.chunk.createMany({
        data: chunks.map((c, ordinal) => {
          const text = c.text.trim();
          return {
            documentId,
            ordinal,
            text,
            tokenCount: Number(c.tokenCount || Math.ceil(text.length / 4)),
            contentHash: createHash("sha256").update(text).digest("hex"),
          };
        }),
      });
    }
    await prisma.document.update({
      where: { id: documentId },
      data: { status: chunks.length > 0 ? "extracted" : "failed", failReason: null },
    });
    return { chunkCount: chunks.length };
  });
}
