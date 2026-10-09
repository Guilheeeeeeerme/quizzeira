import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";

/**
 * Amendment / knowledge freshness API for `content-freshness`.
 * Deterministic only — no LLM on this path.
 */
export async function registerInternalFreshnessRoutes(app: FastifyInstance): Promise<void> {
  app.get("/internal/freshness/watches", async (request) => {
    const q = request.query as { limit?: string };
    const take = Math.min(100, Math.max(1, Number(q.limit || 40)));
    const items = await prisma.freshnessWatch.findMany({
      orderBy: { lastCheckedAt: "asc" },
      take,
    });
    return {
      items: items.map((w) => ({
        watchId: w.watchId,
        url: w.url,
        title: w.title,
        fingerprint: w.fingerprint,
        lastCheckedAt: w.lastCheckedAt.toISOString(),
        lastChangedAt: w.lastChangedAt?.toISOString() ?? null,
        changeCount: w.changeCount,
      })),
    };
  });

  app.post<{
    Body: {
      watchId: string;
      url: string;
      title?: string;
      topicTags?: string[];
      fingerprint: string;
      etag?: string | null;
      lastModified?: string | null;
      contentLength?: string | null;
      changed?: boolean;
    };
  }>("/internal/freshness/observe", async (request) => {
    const body = request.body;
    if (!body?.watchId || !body.url || body.fingerprint == null) {
      throw Object.assign(new Error("watchId, url, fingerprint required"), { statusCode: 400 });
    }
    const changed = Boolean(body.changed);
    const now = new Date();
    const watch = await prisma.freshnessWatch.upsert({
      where: { watchId: body.watchId },
      create: {
        watchId: body.watchId,
        url: body.url,
        title: body.title ?? null,
        topicTags: body.topicTags ?? [],
        fingerprint: body.fingerprint,
        etag: body.etag ?? null,
        lastModified: body.lastModified ?? null,
        contentLength: body.contentLength ?? null,
        lastCheckedAt: now,
        lastChangedAt: changed ? now : null,
        changeCount: changed ? 1 : 0,
      },
      update: {
        url: body.url,
        title: body.title ?? undefined,
        topicTags: body.topicTags ?? undefined,
        fingerprint: body.fingerprint,
        etag: body.etag ?? null,
        lastModified: body.lastModified ?? null,
        contentLength: body.contentLength ?? null,
        lastCheckedAt: now,
        ...(changed
          ? { lastChangedAt: now, changeCount: { increment: 1 } }
          : {}),
      },
    });

    let requeued = 0;
    if (changed) {
      // Re-extract knowledge docs that point at this official URL.
      const result = await prisma.document.updateMany({
        where: {
          sourceUrl: body.url,
          role: { in: ["knowledge", "unknown"] },
        },
        data: {
          status: "pending",
          failReason: "freshness:source_changed",
          attempts: 0,
        },
      });
      requeued = result.count;
    }

    return {
      watch: {
        watchId: watch.watchId,
        fingerprint: watch.fingerprint,
        changeCount: watch.changeCount,
        lastChangedAt: watch.lastChangedAt?.toISOString() ?? null,
      },
      requeued,
      changed,
    };
  });
}
