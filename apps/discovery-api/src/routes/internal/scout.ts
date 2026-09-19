import type { FastifyInstance } from "fastify";
import { domainFromUrl } from "@quizzeira/shared";
import { prisma } from "../../lib/prisma";
import { hardDeny, scoreCandidate, type CandidateSignals } from "../../lib/scouting";

/**
 * Autonomous scouting intake (§6.2 observe-only rollout): candidates are
 * scored deterministically and stored with evidence. Auto-activation only
 * happens with DISCOVERY_SCOUT_AUTO_ACTIVATE=true; the default keeps every
 * candidate observed/quarantined for admin review — the crawler can never
 * widen its own reach by itself.
 */
const AUTO_ACTIVATE = process.env.DISCOVERY_SCOUT_AUTO_ACTIVATE === "true";

async function candidateSignals(domain: string, urls: string[]): Promise<CandidateSignals> {
  const [stats, priorSources] = await Promise.all([
    prisma.domainStats.findUnique({ where: { domain } }).catch(() => null),
    prisma.source.count({ where: { domain } }).catch(() => 0),
  ]);
  void urls;
  return {
    urls,
    name: domain,
    robotsAllowed: null,
    domainStats: stats
      ? {
          fetched: stats.fetched,
          becameKnowledge: stats.becameKnowledge,
          rejectedLowValue: stats.rejectedLowValue,
          avgDensity: stats.avgDensity,
        }
      : null,
    priorSources,
  };
}

export async function registerInternalScoutRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: Record<string, unknown> }>("/internal/scout/candidates", async (request) => {
    const body = request.body ?? {};
    const url = String(body.url || "");
    const domain = String(body.domain || "") || domainFromUrl(url) || "";
    if (!domain) return { rejected: true, reason: "no domain" };
    const name = String(body.name || domain);
    const urls: string[] = url ? [url] : [];
    const domainNorm = domain.toLowerCase().replace(/^www\./, "");

    // Already known: nothing to scout.
    const knownSource = await prisma.source.findFirst({
      where: { domain: { contains: domainNorm } },
    });
    if (knownSource) return { rejected: true, reason: "existing source" };
    const knownCandidate = await prisma.sourceCandidate.findFirst({
      where: { domain: { contains: domainNorm } },
      orderBy: { updatedAt: "desc" },
    });
    if (knownCandidate) {
      return { rejected: false, dedupe: true, candidate: knownCandidate };
    }

    const deny = hardDeny(name, [...urls, domain]);
    if (deny) {
      // Blocked domains are recorded with evidence and a permanent expiry.
      const blocked = await prisma.sourceCandidate.create({
        data: {
          domain,
          name,
          startUrls: urls,
          url: url || null,
          notes: (body.notes as string) || null,
          score: 0,
          classification: "unknown",
          signals: { deny },
          decision: "blocklist",
          status: "blocked",
        },
      });
      return { rejected: false, candidate: blocked, decision: "blocked" };
    }

    const scoring = scoreCandidate(await candidateSignals(domain, urls));
    // Auto-activation is off in observe-only mode: the decision is recorded
    // but never executed.
    const status = AUTO_ACTIVATE && scoring.decision === "auto_activate" ? "activated" : "observed";
    const candidate = await prisma.sourceCandidate.create({
      data: {
        domain,
        name,
        startUrls: urls,
        url: url || null,
        notes: (body.notes as string) || null,
        score: scoring.score,
        classification: scoring.classification,
        signals: { ...scoring.signals, deny: deny ?? undefined },
        decision: scoring.decision,
        status:
          scoring.decision === "observe"
            ? "observed"
            : scoring.decision === "quarantine"
              ? "quarantined"
              : status,
        decidedAt: status === "activated" ? new Date() : null,
      },
    });
    return { rejected: false, candidate, decision: candidate.status };
  });

  app.get("/internal/scout/dead-letters", async () => {
    // Blocklist view with evidence (§6.1: blocklist carries expiry).
    const blocked = await prisma.sourceCandidate.findMany({
      where: { status: "blocked" },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return { items: blocked };
  });
}
