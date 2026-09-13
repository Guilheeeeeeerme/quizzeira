import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { putArtifactObject } from "../../lib/storage";

export async function registerInternalArtifactRoutes(app: FastifyInstance): Promise<void> {
  // ── Document store ────────────────────────────────────────────────────────

  /**
   * Artifacts arrive either as a URL reference or with inline base64 bytes.
   * Bytes go to MinIO; only the key + checksum are kept in Postgres.
   */
  app.post<{ Body: Record<string, unknown> }>("/internal/artifacts", async (request) => {
    const body = request.body ?? {};
    let storageKey: string | null = null;
    let checksum: string | null = null;
    let byteSize: number | null = null;
    if (typeof body.base64 === "string" && body.base64) {
      const buf = Buffer.from(body.base64, "base64");
      const stored = await putArtifactObject(
        typeof body.storageKey === "string" ? body.storageKey : null,
        buf,
        String(body.contentType || "application/pdf"),
      );
      storageKey = stored.storageKey;
      checksum = stored.checksum;
      byteSize = stored.byteSize;
    }
    const contentHash = (body.contentHash as string) || checksum;
    const artifact = await prisma.artifact.create({
      data: {
        examId: (body.examId as string) || null,
        sourceId: (body.sourceId as string) || null,
        kind: (body.kind as never) || "other",
        kindHint: (body.kindHint as never) || "unknown",
        roleHint: (body.roleHint as never) || "unknown",
        anchorLabel: (body.anchorLabel as string) || null,
        topicQueryId: (body.topicQueryId as string) || null,
        contentHash,
        etag: (body.etag as string) || null,
        lastModified: body.lastModified ? new Date(String(body.lastModified)) : null,
        fetchSignals: body.fetchSignals ?? undefined,
        url: (body.url as string) || null,
        storageKey,
        checksum,
        contentType: (body.contentType as string) || null,
        byteSize,
        published: Boolean(body.published),
      },
    });
    return { artifact };
  });

  /** Content's extraction stage pulls unprocessed artifacts from here. */
  app.get("/internal/artifacts", async (request) => {
    const q = request.query as { kind?: string; published?: string; limit?: string };
    const items = await prisma.artifact.findMany({
      where: {
        ...(q.kind ? { kind: q.kind as never } : {}),
        ...(q.published != null ? { published: q.published === "true" } : {}),
      },
      orderBy: { fetchedAt: "desc" },
      take: Math.min(100, Number(q.limit || 25)),
      include: { exam: { select: { examSlug: true, title: true } } },
    });
    return {
      items: items.map((a) => ({
        id: a.id,
        examId: a.examId,
        examSlug: a.exam?.examSlug ?? null,
        examTitle: a.exam?.title ?? null,
        sourceId: a.sourceId,
        kind: a.kind,
        kindHint: a.kindHint,
        roleHint: a.roleHint,
        anchorLabel: a.anchorLabel,
        topicQueryId: a.topicQueryId,
        contentHash: a.contentHash,
        url: a.url,
        storageKey: a.storageKey,
        checksum: a.checksum,
        contentType: a.contentType,
        byteSize: a.byteSize,
        published: a.published,
        fetchSignals: a.fetchSignals,
        fetchedAt: a.fetchedAt.toISOString(),
      })),
    };
  });

  /** Provenance / Content resolve Artifact → Source / TopicQuery (§30). */
  app.get<{ Params: { id: string } }>("/internal/artifacts/:id", async (request) => {
    const artifact = await prisma.artifact.findUnique({
      where: { id: request.params.id },
      include: {
        source: true,
        topicQuery: true,
        exam: { select: { id: true, examSlug: true, title: true, sourceId: true } },
      },
    });
    if (!artifact) {
      throw Object.assign(new Error("not found"), { statusCode: 404 });
    }
    return {
      artifact: {
        id: artifact.id,
        examId: artifact.examId,
        examSlug: artifact.exam?.examSlug ?? null,
        examTitle: artifact.exam?.title ?? null,
        sourceId: artifact.sourceId,
        topicQueryId: artifact.topicQueryId,
        kind: artifact.kind,
        kindHint: artifact.kindHint,
        roleHint: artifact.roleHint,
        anchorLabel: artifact.anchorLabel,
        contentHash: artifact.contentHash,
        url: artifact.url,
        storageKey: artifact.storageKey,
        checksum: artifact.checksum,
        contentType: artifact.contentType,
        byteSize: artifact.byteSize,
        published: artifact.published,
        fetchSignals: artifact.fetchSignals,
        fetchedAt: artifact.fetchedAt.toISOString(),
      },
      source: artifact.source
        ? {
            id: artifact.source.id,
            domain: artifact.source.domain,
            name: artifact.source.name,
            kind: artifact.source.kind,
            discoveryMode: artifact.source.discoveryMode,
            trust: artifact.source.trust,
            authorityScore: artifact.source.authorityScore,
            status: artifact.source.status,
          }
        : null,
      topicQuery: artifact.topicQuery
        ? {
            id: artifact.topicQuery.id,
            examId: artifact.topicQuery.examId,
            syllabusNodeId: artifact.topicQuery.syllabusNodeId,
            canonicalKey: artifact.topicQuery.canonicalKey,
            queries: artifact.topicQuery.queries,
            status: artifact.topicQuery.status,
            candidatesFound: artifact.topicQuery.candidatesFound,
            candidatesStored: artifact.topicQuery.candidatesStored,
          }
        : null,
    };
  });

  app.patch<{ Params: { id: string }; Body: { published?: boolean } }>(
    "/internal/artifacts/:id",
    async (request) => {
      const artifact = await prisma.artifact.update({
        where: { id: request.params.id },
        data: { published: Boolean(request.body?.published) },
      });
      return { artifact };
    },
  );
}
