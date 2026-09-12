// Concept: Ingestion (crawler-facing write surface) — pipeline v2 (§29.1, §39)
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  crawlerSourceId,
  domainFromUrl,
  openExamId,
  SOURCE_KIND_DEFAULT_ROLES,
  SOURCE_KIND_AUTHORITY,
  kindToHints,
  type SourceKind,
} from "@quizzeira/shared";
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

function strategyFromWire(value: string): string {
  return value.replace("-", "_");
}

function sourceToWire(s: {
  id: string;
  domain: string;
  name: string;
  startUrls: unknown;
  strategy: string;
  kind: string;
  discoveryMode: string;
  allowedRoles: unknown;
  authorityScore: number | null;
  licenseNote: string | null;
  robotsCache: unknown;
  linkSelector: string | null;
  linkPatterns: unknown;
  openPatterns: unknown;
  trust: string;
  status: string;
  intervalSec: number;
  politenessMs: number;
  failCount: number;
  lastOkAt: Date | null;
  lastError: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const kind = (s.kind || "aggregator") as SourceKind;
  const allowed =
    Array.isArray(s.allowedRoles) && (s.allowedRoles as unknown[]).length > 0
      ? (s.allowedRoles as string[])
      : [...(SOURCE_KIND_DEFAULT_ROLES[kind] ?? ["administrative"])];
  return {
    id: s.id,
    domain: s.domain,
    name: s.name,
    startUrls: s.startUrls,
    strategy: strategyToWire(String(s.strategy)),
    kind,
    discoveryMode: s.discoveryMode || "listing",
    allowedRoles: allowed,
    authorityScore: s.authorityScore ?? SOURCE_KIND_AUTHORITY[kind] ?? null,
    licenseNote: s.licenseNote,
    robotsCache: s.robotsCache ?? null,
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
  };
}

function examToWire(row: {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  kind: string;
  editionKey: string | null;
  detailUrl: string | null;
  registrationEnd: Date | null;
  statusSource: string | null;
  positions: unknown;
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
    kind: row.kind || "concurso",
    editionKey: row.editionKey,
    detailUrl: row.detailUrl,
    registrationEnd: row.registrationEnd?.toISOString().slice(0, 10) ?? null,
    statusSource: row.statusSource,
    positions: Array.isArray(row.positions) ? row.positions : [],
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

  app.get("/internal/sources", async (request) => {
    const q = request.query as { status?: string; discoveryMode?: string };
    const items = await prisma.source.findMany({
      where: {
        enabled: true,
        ...(q.status ? { status: q.status as never } : {}),
        ...(q.discoveryMode ? { discoveryMode: q.discoveryMode as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return { items: items.map(sourceToWire) };
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/sources/:id",
    async (request) => {
      const body = request.body ?? {};
      const data: Record<string, unknown> = {};
      if (body.kind != null) data.kind = body.kind;
      if (body.discoveryMode != null) data.discoveryMode = body.discoveryMode;
      if (body.allowedRoles != null) data.allowedRoles = body.allowedRoles;
      if (body.authorityScore != null) data.authorityScore = Number(body.authorityScore);
      if (body.licenseNote !== undefined) data.licenseNote = body.licenseNote;
      if (body.robotsCache !== undefined) data.robotsCache = body.robotsCache;
      if (body.strategy != null) data.strategy = strategyFromWire(String(body.strategy));
      const source = await prisma.source.update({
        where: { id: request.params.id },
        data: data as never,
      });
      return { source: sourceToWire(source) };
    },
  );

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
      return { source: sourceToWire(source) };
    },
  );

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

  app.post<{ Body: Record<string, unknown> }>("/internal/open-exams", async (request) => {
    const body = request.body ?? {};
    const examSlug = String(body.examSlug || "");
    const listingUrl = String(body.listingUrl || "");
    const title = String(body.title || "");
    const editalUrl = (body.editalUrl as string) || null;
    const id = String(body.id || openExamId({ examSlug, listingUrl, title }));
    const existing =
      (await prisma.exam.findUnique({
        where: { examSlug_listingUrl: { examSlug, listingUrl } },
      })) || (await prisma.exam.findUnique({ where: { id } }));
    const incomingStatus = (body.status as string) || "open";
    const nextStatus =
      existing?.status === "closed"
        ? "closed"
        : existing?.status === "open" && incomingStatus === "unknown"
          ? "open"
          : incomingStatus;
    const kind = String(body.kind || "concurso");
    const editionKey = (body.editionKey as string) || null;
    const detailUrl = (body.detailUrl as string) || null;
    const registrationEnd = body.registrationEnd
      ? new Date(String(body.registrationEnd))
      : null;
    const statusSource = (body.statusSource as string) || null;
    const positions = body.positions ?? [];
    const row = await prisma.exam.upsert({
      where: { examSlug_listingUrl: { examSlug, listingUrl } },
      create: {
        id: existing?.id || id,
        examSlug,
        title,
        org: (body.org as string) || null,
        banca: (body.banca as string) || null,
        kind: kind as never,
        editionKey,
        detailUrl,
        registrationEnd,
        statusSource,
        positions: positions as never,
        emphasis: body.emphasis ?? [],
        editalUrl,
        listingUrl,
        status: nextStatus as never,
        sourceId: String(body.sourceId || ""),
        sourceDomain: String(body.sourceDomain || ""),
      },
      update: {
        title,
        org: (body.org as string) || null,
        banca: (body.banca as string) || null,
        kind: kind as never,
        editionKey,
        detailUrl,
        registrationEnd,
        statusSource,
        positions: positions as never,
        emphasis: body.emphasis ?? [],
        editalUrl,
        lastSeenAt: new Date(),
        status: nextStatus as never,
      },
    });
    return {
      record: examToWire(row),
      created: !existing,
      changed:
        !existing ||
        existing.title !== title ||
        existing.editalUrl !== editalUrl ||
        existing.kind !== kind ||
        existing.editionKey !== editionKey,
    };
  });

  app.get("/internal/open-exams", async (request) => {
    const q = request.query as { kind?: string };
    const items = await prisma.exam.findMany({
      where: {
        status: "open",
        ...(q.kind ? { kind: q.kind as never } : { kind: { not: "certification" } }),
      },
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    });
    return { items: items.map(examToWire) };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/artifacts", async (request) => {
    const body = request.body ?? {};
    let storageKey: string | null = null;
    let checksum: string | null = null;
    let contentHash: string | null = (body.contentHash as string) || null;
    let byteSize: number | null = null;
    if (typeof body.base64 === "string" && body.base64) {
      const buf = Buffer.from(body.base64, "base64");
      const key = String(
        body.storageKey ||
          `artifacts/${contentHash || Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      const stored = await putArtifactObject(
        key,
        buf,
        String(body.contentType || "application/pdf"),
      );
      storageKey = stored.storageKey;
      checksum = stored.checksum;
      contentHash = contentHash || stored.checksum;
      byteSize = stored.byteSize;
    }
    const kind = (body.kind as string) || "other";
    const hints =
      body.kindHint || body.roleHint
        ? {
            kindHint: String(body.kindHint || "unknown"),
            roleHint: String(body.roleHint || "unknown"),
          }
        : kindToHints(kind);
    const artifact = await prisma.artifact.create({
      data: {
        examId: (body.examId as string) || null,
        sourceId: (body.sourceId as string) || null,
        kind: kind as never,
        kindHint: hints.kindHint as never,
        roleHint: hints.roleHint as never,
        anchorLabel: (body.anchorLabel as string) || null,
        topicQueryId: (body.topicQueryId as string) || null,
        url: (body.url as string) || null,
        storageKey,
        checksum,
        contentHash,
        etag: (body.etag as string) || null,
        lastModified: body.lastModified ? new Date(String(body.lastModified)) : null,
        contentType: (body.contentType as string) || null,
        byteSize,
        fetchSignals: (body.fetchSignals as never) || undefined,
        published: Boolean(body.published),
      },
    });
    return { artifact };
  });

  app.get("/internal/artifacts", async (request) => {
    const q = request.query as {
      kind?: string;
      published?: string;
      roleHint?: string;
      limit?: string;
    };
    const items = await prisma.artifact.findMany({
      where: {
        ...(q.kind ? { kind: q.kind as never } : {}),
        ...(q.published != null ? { published: q.published === "true" } : {}),
        ...(q.roleHint ? { roleHint: q.roleHint as never } : {}),
        // Listing pages are never handed to content (§11.2).
        NOT: { OR: [{ kind: "listing" }, { roleHint: "administrative", kindHint: "listing" }] },
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
        kindHint: a.kindHint,
        roleHint: a.roleHint,
        anchorLabel: a.anchorLabel,
        topicQueryId: a.topicQueryId,
        url: a.url,
        storageKey: a.storageKey,
        checksum: a.checksum,
        contentHash: a.contentHash,
        contentType: a.contentType,
        byteSize: a.byteSize,
        fetchSignals: a.fetchSignals,
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

  // ── Topic queries (§11.3 / §17) ───────────────────────────────────────────

  app.get("/internal/topic-queries", async (request) => {
    const q = request.query as { status?: string; limit?: string };
    const items = await prisma.topicQuery.findMany({
      where: {
        ...(q.status ? { status: q.status } : { status: "queued" }),
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: new Date() } }],
      },
      orderBy: { createdAt: "asc" },
      take: Math.min(50, Number(q.limit || 10)),
    });
    return { items };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/topic-queries", async (request) => {
    const body = request.body ?? {};
    const row = await prisma.topicQuery.create({
      data: {
        examId: String(body.examId || ""),
        examSlug: String(body.examSlug || ""),
        syllabusNodeId: String(body.syllabusNodeId || ""),
        canonicalKey: String(body.canonicalKey || ""),
        queries: (body.queries as never) || [],
        status: String(body.status || "queued"),
        nextRunAt: body.nextRunAt ? new Date(String(body.nextRunAt)) : null,
      },
    });
    return { topicQuery: row };
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/topic-queries/:id",
    async (request) => {
      const body = request.body ?? {};
      const data: Record<string, unknown> = {};
      for (const key of [
        "status",
        "candidatesFound",
        "candidatesStored",
        "attempts",
        "nextRunAt",
        "finishedAt",
      ] as const) {
        if (body[key] !== undefined) {
          data[key] =
            key === "nextRunAt" || key === "finishedAt"
              ? body[key]
                ? new Date(String(body[key]))
                : null
              : body[key];
        }
      }
      if (body.bumpAttempts) data.attempts = { increment: 1 };
      const row = await prisma.topicQuery.update({
        where: { id: request.params.id },
        data: data as never,
      });
      return { topicQuery: row };
    },
  );

  app.get("/internal/domain-stats", async () => {
    const items = await prisma.domainStats.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
    return { items };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/domain-stats", async (request) => {
    const body = request.body ?? {};
    const domain = String(body.domain || "");
    if (!domain) return { ok: false };
    const row = await prisma.domainStats.upsert({
      where: { domain },
      create: {
        domain,
        fetched: Number(body.fetched || 0),
        becameKnowledge: Number(body.becameKnowledge || 0),
        rejectedLowValue: Number(body.rejectedLowValue || 0),
        avgDensity: body.avgDensity != null ? Number(body.avgDensity) : null,
        authority: body.authority != null ? Number(body.authority) : null,
      },
      update: {
        fetched: body.fetched != null ? { increment: Number(body.fetched) } : undefined,
        becameKnowledge:
          body.becameKnowledge != null ? { increment: Number(body.becameKnowledge) } : undefined,
        rejectedLowValue:
          body.rejectedLowValue != null ? { increment: Number(body.rejectedLowValue) } : undefined,
        avgDensity: body.avgDensity != null ? Number(body.avgDensity) : undefined,
        authority: body.authority != null ? Number(body.authority) : undefined,
      },
    });
    return { domainStats: row };
  });

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

  app.post("/internal/crawl/force/consume", async () => consumeForceCrawl());
}
