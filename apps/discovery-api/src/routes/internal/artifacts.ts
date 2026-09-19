import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { putArtifactObject } from "../../lib/storage";
import { enqueueJob } from "../../lib/jobs";

/** Job kind content-worker's import pass claims (§5, item 1b). String contract
 * shared with apps/content-worker/src/stages/import.ts — keep both in sync. */
export const IMPORT_ARTIFACT_JOB_KIND = "import_artifact";

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
    // Idempotent per exam: the same bytes (or the same URL) must not become a
    // second artifact/document every pass (§10.2 retries upsert, never duplicate).
    const examId = (body.examId as string) || null;
    const url = (body.url as string) || null;
    if (examId) {
      const existing = await prisma.artifact.findFirst({
        where: {
          examId,
          OR: [
            ...(contentHash ? [{ contentHash }] : []),
            ...(url ? [{ url }] : []),
          ],
        },
        orderBy: { fetchedAt: "asc" },
      });
      if (existing) return { artifact: existing, created: false };
    }
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
    // One import job per artifact (§5, item 1b): content-worker's import pass
    // claims from this instead of polling published=false. dedupeKey makes
    // this safe even if the same artifact is somehow enqueued twice.
    await enqueueJob({
      kind: IMPORT_ARTIFACT_JOB_KIND,
      entityId: artifact.id,
      dedupeKey: `${IMPORT_ARTIFACT_JOB_KIND}:${artifact.id}`,
    });
    return { artifact, created: true };
  });

  /**
   * Idempotent backfill (§5, item 1b): enqueue import jobs for artifacts
   * created before this migration. Safe to re-run — `enqueueJob` is a no-op
   * per dedupeKey, so an artifact already imported (or already queued) is
   * never re-enqueued.
   */
  app.post("/internal/artifacts/backfill-import-jobs", async () => {
    const artifacts = await prisma.artifact.findMany({
      where: { published: false },
      select: { id: true },
    });
    for (const a of artifacts) {
      await enqueueJob({
        kind: IMPORT_ARTIFACT_JOB_KIND,
        entityId: a.id,
        dedupeKey: `${IMPORT_ARTIFACT_JOB_KIND}:${a.id}`,
      });
    }
    return { ok: true, scanned: artifacts.length };
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

  /** Content's retention/prune passes report which artifact objects are gone. */
  app.post<{ Body: { artifactIds?: string[] } }>(
    "/internal/artifacts/mark-purged",
    async (request) => {
      const ids = (request.body?.artifactIds ?? []).filter((id) => typeof id === "string");
      if (ids.length === 0) return { updated: 0 };
      const { count } = await prisma.artifact.updateMany({
        where: { id: { in: ids.slice(0, 1000) }, bytesPurgedAt: null },
        data: { bytesPurgedAt: new Date() },
      });
      return { updated: count };
    },
  );
}
