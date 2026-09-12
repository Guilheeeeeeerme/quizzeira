// Concept: Ingestion (admin control plane for the Source registry)
//
// These routes are consumed by the study API's /admin/discovery/* proxy, which
// is what the web Admin UI talks to. They are guarded by the same internal key
// as /internal/* — discovery-api is never exposed outside the private network.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { crawlerSourceId, domainFromUrl } from "@quizzeira/shared";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { consumeForceCrawl, requestForceCrawl } from "../lib/force-crawl";

function assertAdmin(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.adminInternalKey && key !== env.internalApiKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function strategyToWire(value: string): string {
  return value.replace("_", "-");
}

function strategyFromWire(
  value: string,
): "listing_links" | "banca_portal" | "fixture" | "oab_fgv" {
  if (value === "banca-portal" || value === "banca_portal") return "banca_portal";
  if (value === "fixture") return "fixture";
  if (value === "oab-fgv" || value === "oab_fgv") return "oab_fgv";
  return "listing_links";
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/admin")) assertAdmin(request);
  });

  app.get("/admin/sources", async () => {
    const items = await prisma.source.findMany({ orderBy: { createdAt: "desc" } });
    return {
      items: items.map((s) => ({
        id: s.id,
        domain: s.domain,
        name: s.name,
        startUrls: s.startUrls,
        strategy: strategyToWire(String(s.strategy)),
        linkSelector: s.linkSelector,
        linkPatterns: s.linkPatterns,
        openPatterns: s.openPatterns,
        trust: s.trust,
        status: s.status,
        enabled: s.enabled,
        intervalSec: s.intervalSec,
        politenessMs: s.politenessMs,
        failCount: s.failCount,
        lastOkAt: s.lastOkAt?.toISOString() ?? null,
        lastError: s.lastError,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  });

  app.post<{ Body: Record<string, unknown> }>("/admin/sources", async (request) => {
    const body = request.body ?? {};
    const startUrls = asStringArray(body.startUrls);
    const domain =
      String(body.domain || "").trim() ||
      (startUrls[0] ? domainFromUrl(startUrls[0]) ?? "" : "");
    const name = String(body.name || "").trim() || domain;
    if (!domain || startUrls.length === 0) {
      throw Object.assign(new Error("domain and startUrls are required"), { statusCode: 400 });
    }
    const id = String(body.id || crawlerSourceId(domain, name));
    const source = await prisma.source.upsert({
      where: { id },
      create: {
        id,
        domain,
        name,
        startUrls,
        strategy: strategyFromWire(String(body.strategy || "listing-links")),
        linkSelector: (body.linkSelector as string) || null,
        linkPatterns: asStringArray(body.linkPatterns),
        openPatterns: asStringArray(body.openPatterns),
        trust: (body.trust as never) || "medium",
        status: "active",
        enabled: body.enabled !== false,
        intervalSec: Number(body.intervalSec || 1800),
        politenessMs: Number(body.politenessMs || 1000),
        notes: (body.notes as string) || null,
      },
      update: {
        domain,
        name,
        startUrls,
        strategy: strategyFromWire(String(body.strategy || "listing-links")),
        linkSelector: (body.linkSelector as string) || null,
        linkPatterns: asStringArray(body.linkPatterns),
        openPatterns: asStringArray(body.openPatterns),
        trust: (body.trust as never) || undefined,
        enabled: body.enabled !== false,
        intervalSec: Number(body.intervalSec || 1800),
        politenessMs: Number(body.politenessMs || 1000),
        notes: (body.notes as string) || null,
      },
    });
    return { source };
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/admin/sources/:id",
    async (request) => {
      const body = request.body ?? {};
      const source = await prisma.source.update({
        where: { id: request.params.id },
        data: {
          enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
          intervalSec: body.intervalSec != null ? Number(body.intervalSec) : undefined,
          politenessMs: body.politenessMs != null ? Number(body.politenessMs) : undefined,
          trust: (body.trust as never) || undefined,
          status: (body.status as never) || undefined,
          notes: body.notes !== undefined ? (body.notes as string) : undefined,
          startUrls: body.startUrls !== undefined ? asStringArray(body.startUrls) : undefined,
          linkPatterns:
            body.linkPatterns !== undefined ? asStringArray(body.linkPatterns) : undefined,
          openPatterns:
            body.openPatterns !== undefined ? asStringArray(body.openPatterns) : undefined,
        },
      });
      return { source };
    },
  );

  app.delete<{ Params: { id: string } }>("/admin/sources/:id", async (request) => {
    await prisma.source.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  app.get("/admin/source-proposals", async () => {
    const items = await prisma.sourceProposal.findMany({
      where: { status: "proposed" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return {
      items: items.map((p) => ({
        id: p.id,
        domain: p.domain,
        name: p.name,
        startUrls: p.startUrls,
        reason: p.reason,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  });

  /** Promote a crawler-discovered proposal into a real (low-trust) Source. */
  app.post<{ Params: { id: string } }>("/admin/source-proposals/:id/approve", async (request) => {
    const proposal = await prisma.sourceProposal.findUnique({ where: { id: request.params.id } });
    if (!proposal) throw Object.assign(new Error("not found"), { statusCode: 404 });
    const id = crawlerSourceId(proposal.domain, proposal.name);
    const source = await prisma.source.upsert({
      where: { id },
      create: {
        id,
        domain: proposal.domain,
        name: proposal.name,
        startUrls: proposal.startUrls ?? [],
        linkPatterns: [],
        openPatterns: [],
        trust: "low",
        status: "active",
        enabled: true,
        notes: proposal.reason,
      },
      update: { status: "active", enabled: true },
    });
    await prisma.sourceProposal.update({
      where: { id: proposal.id },
      data: { status: "active", sourceId: source.id, reviewedAt: new Date() },
    });
    return { source };
  });

  app.post<{ Params: { id: string } }>("/admin/source-proposals/:id/reject", async (request) => {
    await prisma.sourceProposal.update({
      where: { id: request.params.id },
      data: { status: "disabled", reviewedAt: new Date() },
    });
    return { ok: true };
  });

  app.get("/admin/exams", async (request) => {
    const q = request.query as { status?: string; limit?: string };
    const items = await prisma.exam.findMany({
      where: q.status ? { status: q.status as never } : undefined,
      orderBy: { lastSeenAt: "desc" },
      take: Math.min(200, Number(q.limit || 100)),
      include: { _count: { select: { artifacts: true } } },
    });
    return {
      items: items.map((e) => ({
        id: e.id,
        examSlug: e.examSlug,
        title: e.title,
        org: e.org,
        banca: e.banca,
        emphasis: e.emphasis,
        editalUrl: e.editalUrl,
        listingUrl: e.listingUrl,
        status: e.status,
        sourceDomain: e.sourceDomain,
        artifactCount: e._count.artifacts,
        discoveredAt: e.discoveredAt.toISOString(),
        lastSeenAt: e.lastSeenAt.toISOString(),
      })),
    };
  });

  /** Admins close exams the crawler cannot tell are over (site left the page up). */
  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    "/admin/exams/:id",
    async (request) => {
      const status = request.body?.status;
      if (status !== "open" && status !== "closed" && status !== "unknown") {
        throw Object.assign(new Error("status must be open, closed or unknown"), {
          statusCode: 400,
        });
      }
      const exam = await prisma.exam.update({
        where: { id: request.params.id },
        data: { status },
      });
      return { exam };
    },
  );

  /** Queue a crawl that bypasses the interval; the crawler consumes this flag. */
  app.post<{ Body: { sourceId?: string } }>("/admin/crawl/force", async (request) => {
    await requestForceCrawl(request.body?.sourceId ?? null);
    return { queued: true };
  });

  app.post("/admin/crawl/force/consume", async () => {
    const forced = await consumeForceCrawl();
    return forced;
  });

  app.get("/admin/health", async () => {
    const [total, active, broken, proposed, disabled, openExams, artifacts, lastRun] =
      await Promise.all([
        prisma.source.count(),
        prisma.source.count({ where: { status: "active" } }),
        prisma.source.count({ where: { status: "broken" } }),
        prisma.sourceProposal.count({ where: { status: "proposed" } }),
        prisma.source.count({ where: { enabled: false } }),
        prisma.exam.count({ where: { status: "open" } }),
        prisma.artifact.count(),
        prisma.crawlRun.findFirst({ orderBy: { startedAt: "desc" } }),
      ]);
    return {
      sources: { total, active, broken, proposed, disabled },
      openExams,
      artifacts,
      lastRun: lastRun
        ? {
            runId: lastRun.id,
            startedAt: lastRun.startedAt.toISOString(),
            finishedAt: lastRun.finishedAt?.toISOString() ?? null,
            status: lastRun.status,
            sourcesOk: lastRun.sourcesOk,
            sourcesFailed: lastRun.sourcesFailed,
            openDiscovered: lastRun.openDiscovered,
            proposedSources: lastRun.proposedSources,
            errors: lastRun.errors,
          }
        : null,
    };
  });

  app.get("/admin/runs", async (request) => {
    const q = request.query as { limit?: string };
    const items = await prisma.crawlRun.findMany({
      orderBy: { startedAt: "desc" },
      take: Math.min(50, Number(q.limit || 20)),
    });
    return {
      items: items.map((r) => ({
        runId: r.id,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
        status: r.status,
        sourcesOk: r.sourcesOk,
        sourcesFailed: r.sourcesFailed,
        openDiscovered: r.openDiscovered,
        proposedSources: r.proposedSources,
        errors: r.errors,
      })),
    };
  });
}
