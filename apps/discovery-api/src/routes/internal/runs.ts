import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { consumeForceCrawl } from "../../lib/force-crawl";

export async function registerInternalRunRoutes(app: FastifyInstance): Promise<void> {
  // ── Crawl runs / control ──────────────────────────────────────────────────

  app.post<{ Body: Record<string, unknown> }>("/internal/runs", async (request) => {
    const body = request.body ?? {};
    const id = String(body.runId || body.id);
    const run = await prisma.crawlRun.upsert({
      where: { id },
      create: {
        id,
        sourceId: (body.sourceId as string) || null,
        startedAt: new Date(String(body.startedAt || Date.now())),
        finishedAt: body.finishedAt ? new Date(String(body.finishedAt)) : null,
        status: (body.status as never) || "running",
        sourcesOk: Number(body.sourcesOk || 0),
        sourcesFailed: Number(body.sourcesFailed || 0),
        openDiscovered: Number(body.openDiscovered || 0),
        proposedSources: Number(body.proposedSources || 0),
        errors: body.errors ?? [],
      },
      update: {
        finishedAt: body.finishedAt ? new Date(String(body.finishedAt)) : null,
        status: (body.status as never) || undefined,
        sourcesOk: body.sourcesOk != null ? Number(body.sourcesOk) : undefined,
        sourcesFailed: body.sourcesFailed != null ? Number(body.sourcesFailed) : undefined,
        openDiscovered: body.openDiscovered != null ? Number(body.openDiscovered) : undefined,
        proposedSources:
          body.proposedSources != null ? Number(body.proposedSources) : undefined,
        errors: body.errors ?? undefined,
      },
    });
    return { run };
  });

  /** Admin "crawl now" handoff, consumed once per crawler tick. */
  app.post("/internal/crawl/force/consume", async () => consumeForceCrawl());
}
