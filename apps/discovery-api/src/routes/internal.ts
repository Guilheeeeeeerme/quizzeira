// Concept: Ingestion (crawler-facing write surface)
//
// discovery-crawler is the only caller. It never touches the study API, and the
// study API never writes here — Discovery owns Source registry + Document store.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { crawlerSourceId, domainFromUrl, openExamId } from "@quizzeira/shared";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { putArtifactObject } from "../lib/storage";
import { consumeForceCrawl } from "../lib/force-crawl";

function assertInternal(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.internalApiKey && key !== env.adminInternalKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function strategyToWire(value: string): string {
  return value.replace("_", "-");
}

function examToWire(row: {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  emphasis: unknown;
  editalUrl: string | null;
  listingUrl: string;
  status: string;
  sourceId: string;
  sourceDomain: string;
  discoveredAt: Date;
  lastSeenAt: Date;
}) {
  return {
    id: row.id,
    examSlug: row.examSlug,
    title: row.title,
    org: row.org,
    banca: row.banca,
    emphasis: row.emphasis,
    editalUrl: row.editalUrl,
    listingUrl: row.listingUrl,
    status: row.status === "open" ? ("open" as const) : ("unknown" as const),
    sourceId: row.sourceId,
    sourceDomain: row.sourceDomain,
    discoveredAt: row.discoveredAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

export async function registerInternalRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/internal")) assertInternal(request);
  });

  // ── Source registry ───────────────────────────────────────────────────────

  app.get("/internal/sources", async (request) => {
    const q = request.query as { status?: string };
    const items = await prisma.source.findMany({
      where: { enabled: true, ...(q.status ? { status: q.status as never } : {}) },
      orderBy: { updatedAt: "desc" },
    });
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
        intervalSec: s.intervalSec,
        politenessMs: s.politenessMs,
        failCount: s.failCount,
        lastOkAt: s.lastOkAt?.toISOString() ?? null,
        lastError: s.lastError,
        notes: s.notes ?? undefined,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  });

  app.post<{ Params: { id: string }; Body: { ok?: boolean; error?: string } }>(
    "/internal/sources/:id/health",
    async (request) => {
      const ok = request.body?.ok !== false;
      const source = await prisma.source.update({
        where: { id: request.params.id },
        data: ok
          ? { failCount: 0, lastOkAt: new Date(), lastError: null, status: "active" }
          : {
              failCount: { increment: 1 },
              lastError: (request.body?.error || "crawl failed").slice(0, 500),
              status: "broken",
            },
      });
      return { source };
    },
  );

  /**
   * Crawler proposes new domains found in outbound links. Proposals stay inert
   * until an admin approves them — the crawler can never widen its own reach.
   */
  app.post<{ Body: Record<string, unknown> }>("/internal/sources/propose", async (request) => {
    const body = request.body ?? {};
    const url = String(body.url || "");
    const domain = String(body.domain || "") || domainFromUrl(url) || "";
    if (!domain) return { proposed: false };
    const name = String(body.name || domain);

    const alreadySource = await prisma.source.findUnique({
      where: { id: crawlerSourceId(domain, name) },
    });
    if (alreadySource) return { proposed: false };
    const alreadyProposed = await prisma.sourceProposal.findFirst({
      where: { domain, status: "proposed" },
    });
    if (alreadyProposed) return { proposed: false, proposal: alreadyProposed };

    const proposal = await prisma.sourceProposal.create({
      data: {
        domain,
        name,
        startUrls: url ? [url] : [],
        reason: (body.notes as string) || null,
      },
    });
    return { proposed: true, proposal };
  });

  // ── Listing fingerprints (skip unchanged portals) ─────────────────────────

  app.get<{ Params: { id: string } }>(
    "/internal/sources/:id/listing-fingerprint",
    async (request) => {
      const q = request.query as { startUrl?: string };
      const row = await prisma.listingFingerprint.findFirst({
        where: {
          sourceId: request.params.id,
          ...(q.startUrl ? { startUrl: q.startUrl } : {}),
        },
        orderBy: { seenAt: "desc" },
      });
      return { fingerprint: row?.fingerprint ?? null, seenAt: row?.seenAt?.toISOString() ?? null };
    },
  );

  app.put<{
    Params: { id: string };
    Body: { fingerprint: string; startUrl?: string; listingCount?: number };
  }>("/internal/sources/:id/listing-fingerprint", async (request) => {
    const startUrl = request.body.startUrl || "*";
    await prisma.listingFingerprint.upsert({
      where: { sourceId_startUrl: { sourceId: request.params.id, startUrl } },
      create: {
        sourceId: request.params.id,
        startUrl,
        fingerprint: request.body.fingerprint,
        listingCount: Number(request.body.listingCount || 0),
      },
      update: {
        fingerprint: request.body.fingerprint,
        listingCount: Number(request.body.listingCount || 0),
        seenAt: new Date(),
      },
    });
    return { ok: true };
  });

  // ── Exams ─────────────────────────────────────────────────────────────────

  app.post<{ Body: Record<string, unknown> }>("/internal/open-exams", async (request) => {
    const body = request.body ?? {};
    const examSlug = String(body.examSlug || "");
    const listingUrl = String(body.listingUrl || "");
    const title = String(body.title || "");
    const editalUrl = (body.editalUrl as string) || null;
    const id = String(body.id || openExamId({ examSlug, listingUrl, title }));
    const existing = await prisma.exam.findUnique({ where: { id } });
    const row = await prisma.exam.upsert({
      where: { id },
      create: {
        id,
        examSlug,
        title,
        org: (body.org as string) || null,
        banca: (body.banca as string) || null,
        emphasis: body.emphasis ?? [],
        editalUrl,
        listingUrl,
        status: (body.status as never) || "open",
        sourceId: String(body.sourceId || ""),
        sourceDomain: String(body.sourceDomain || ""),
      },
      update: {
        title,
        org: (body.org as string) || null,
        banca: (body.banca as string) || null,
        emphasis: body.emphasis ?? [],
        editalUrl,
        lastSeenAt: new Date(),
        status: (body.status as never) || "open",
      },
    });
    return {
      record: examToWire(row),
      created: !existing,
      changed: !existing || existing.title !== title || existing.editalUrl !== editalUrl,
    };
  });

  app.get("/internal/open-exams", async () => {
    const items = await prisma.exam.findMany({
      where: { status: "open" },
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    });
    return { items: items.map(examToWire) };
  });

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
      const key = String(
        body.storageKey ||
          `artifacts/${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      const stored = await putArtifactObject(
        key,
        buf,
        String(body.contentType || "application/pdf"),
      );
      storageKey = stored.storageKey;
      checksum = stored.checksum;
      byteSize = stored.byteSize;
    }
    const artifact = await prisma.artifact.create({
      data: {
        examId: (body.examId as string) || null,
        sourceId: (body.sourceId as string) || null,
        kind: (body.kind as never) || "other",
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
        kind: a.kind,
        url: a.url,
        storageKey: a.storageKey,
        checksum: a.checksum,
        contentType: a.contentType,
        byteSize: a.byteSize,
        published: a.published,
        fetchedAt: a.fetchedAt.toISOString(),
      })),
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
