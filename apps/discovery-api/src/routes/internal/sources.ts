import type { FastifyInstance } from "fastify";
import { crawlerSourceId, domainFromUrl } from "@quizzeira/shared";
import { prisma } from "../../lib/prisma";
import { strategyToWire } from "./helpers";

export async function registerInternalSourceRoutes(app: FastifyInstance): Promise<void> {
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
        kind: s.kind,
        discoveryMode: s.discoveryMode,
        allowedRoles: s.allowedRoles,
        authorityScore: s.authorityScore,
        licenseNote: s.licenseNote ?? undefined,
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
}
