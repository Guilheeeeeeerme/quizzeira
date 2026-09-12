// Concept: Ingestion orchestrator — listing → detail → topic → direct (§11).
import { randomUUID } from "node:crypto";
import type { CrawlerRunSummary, CrawlerSource, OpenExamRecord } from "@quizzeira/shared";
import { listingsFingerprint, oabEditionPageUrl } from "@quizzeira/shared";
import { dmzGet, dmzPost, dmzPut, logError, logInfo } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings } from "./browser.js";
import { parseDetailHtml } from "./detail.js";
import { crawlDirectSource } from "./direct.js";
import { crawlerEnv } from "./env.js";
import { fetchUrl } from "./fetch.js";
import { listingsToOpenRecords } from "./listing.js";
import { crawlOabSource, type OabExamGroup } from "./oab-fgv.js";
import { getRobotsForDomain, isPathAllowed } from "./robots.js";
import { storeArtifact } from "./store.js";
import { runTopicQueries } from "./topic.js";

const NAME = "discovery-crawler";

export async function runDiscoveryPipeline(
  onlySourceId?: string | null,
): Promise<CrawlerRunSummary> {
  const runId = randomUUID().slice(0, 12);
  const summary: CrawlerRunSummary = {
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: "running",
    sourcesOk: 0,
    sourcesFailed: 0,
    sourcesSkipped: 0,
    openDiscovered: 0,
    proposedSources: 0,
    artifactsStored: 0,
    topicQueriesRun: 0,
    errors: [],
  };

  await dmzPost("/internal/runs", summary).catch(() => undefined);

  let artifactBudget = crawlerEnv.maxArtifactsPerRun;

  try {
    const { items: sources } = await dmzGet<{ items: CrawlerSource[] }>(
      "/internal/sources?status=active",
    );

    if (sources.length === 0) {
      logInfo("source registry empty", { worker: NAME, runId });
      summary.status = "ok";
      return await finish(summary);
    }

    const selected = onlySourceId
      ? sources.filter((s) => s.id === onlySourceId)
      : sources.slice(0, crawlerEnv.maxSourcesPerRun);

    for (const source of selected) {
      try {
        if (source.strategy === "oab-fgv" || source.discoveryMode === "custom") {
          if (crawlerEnv.fixtureMode) {
            summary.sourcesSkipped += 1;
            continue;
          }
          artifactBudget = await crawlOab(source, summary, artifactBudget);
          await dmzPost(`/internal/sources/${source.id}/health`, { ok: true });
          summary.sourcesOk += 1;
          continue;
        }

        if (source.discoveryMode === "direct") {
          const direct = await crawlDirectSource(source, artifactBudget);
          summary.artifactsStored += direct.stored;
          artifactBudget = direct.remainingBudget;
          await dmzPost(`/internal/sources/${source.id}/health`, { ok: true });
          summary.sourcesOk += 1;
          continue;
        }

        if (source.discoveryMode === "topic_query") {
          // Topic queries are global; handled once after listing sources.
          summary.sourcesSkipped += 1;
          continue;
        }

        artifactBudget = await crawlListingSource(source, summary, artifactBudget);
        await dmzPost(`/internal/sources/${source.id}/health`, { ok: true });
        summary.sourcesOk += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/Target .+ closed|browser has been closed|browserContext\.close/i.test(message)) {
          logInfo("crawl interrupted (browser closed)", {
            worker: NAME,
            runId,
            sourceId: source.id,
            error: message.slice(0, 160),
          });
          continue;
        }
        summary.sourcesFailed += 1;
        summary.errors.push(`${source.domain}: ${message.slice(0, 160)}`);
        await dmzPost(`/internal/sources/${source.id}/health`, {
          ok: false,
          error: message.slice(0, 400),
        }).catch(() => undefined);
      }
    }

    // Topic-query pass (knowledge discovery).
    if (artifactBudget > 0 && !onlySourceId) {
      const topic = await runTopicQueries(artifactBudget);
      summary.topicQueriesRun += topic.ran;
      summary.artifactsStored += topic.stored;
      artifactBudget = topic.remainingBudget;
    }

    summary.status =
      summary.sourcesFailed === 0 ? "ok" : summary.sourcesOk > 0 ? "partial" : "failed";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    summary.status = "failed";
    summary.errors.push(message.slice(0, 200));
    logError("ingestion pass failed", { worker: NAME, runId, error: message });
  }

  return finish(summary);
}

async function crawlListingSource(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  budget: number,
): Promise<number> {
  const robots = await getRobotsForDomain(
    source.domain,
    source.id,
    (source as { robotsCache?: unknown }).robotsCache as never,
  );
  const { listings, outboundDomains } = await crawlSourceListings(source);
  const fingerprint = listingsFingerprint(listings);
  const previous = await dmzGet<{ fingerprint: string | null }>(
    `/internal/sources/${source.id}/listing-fingerprint`,
  );

  if (previous.fingerprint === fingerprint) {
    summary.sourcesSkipped += 1;
    return budget;
  }

  let remaining = budget;
  for (const open of listingsToOpenRecords(listings, source)) {
    // Never store the listing page as an exam artifact (§11.2 item 1).
    const detailUrl = open.detailUrl || open.listingUrl;
    if (/\.pdf(\?|#|$)/i.test(detailUrl)) {
      const upserted = await dmzPost<{
        record: OpenExamRecord;
        created: boolean;
        changed: boolean;
      }>("/internal/open-exams", {
        ...open,
        editalUrl: detailUrl,
        kind: open.kind,
        status: open.kind === "concurso" || open.kind === "oab" ? open.status : "unknown",
      });
      if (upserted.changed) summary.openDiscovered += 1;
      if (
        upserted.record.status === "open" &&
        upserted.record.kind === "concurso" &&
        remaining > 0 &&
        isPathAllowed(detailUrl, robots.disallow)
      ) {
        const stored = await storeArtifact({
          examId: upserted.record.id,
          sourceId: source.id,
          url: detailUrl,
          kind: "edital",
          kindHint: "edital",
          roleHint: "specification",
          withBytes: true,
          politenessMs: source.politenessMs,
        });
        if (stored) {
          summary.artifactsStored += 1;
          if (stored.downloaded) remaining -= 1;
        }
      }
      continue;
    }

    // One hop: fetch detail page for identity + document links.
    let detail;
    try {
      if (!isPathAllowed(detailUrl, robots.disallow)) continue;
      const page = await fetchUrl(detailUrl, {
        politenessMs: source.politenessMs,
        allowPlaywright: true,
      });
      detail = parseDetailHtml(page.body.toString("utf8"), detailUrl, open.org);
    } catch {
      // Fall back to listing-derived candidate without artifacts.
      const upserted = await dmzPost<{ record: OpenExamRecord; changed: boolean }>(
        "/internal/open-exams",
        open,
      );
      if (upserted.changed) summary.openDiscovered += 1;
      continue;
    }

    if (detail.looksLikeListing) {
      // Store listing HTML against the Source only, never as exam content.
      if (remaining > 0) {
        const stored = await storeArtifact({
          examId: null,
          sourceId: source.id,
          url: detailUrl,
          kind: "listing",
          kindHint: "listing",
          roleHint: "administrative",
          withBytes: false,
        });
        if (stored) summary.artifactsStored += 1;
      }
      continue;
    }

    const record = {
      examSlug: detail.examSlug || open.examSlug,
      title: detail.title || open.title,
      org: detail.org || open.org,
      banca: open.banca,
      kind: detail.examKind,
      editionKey: detail.editionKey,
      detailUrl,
      registrationEnd: detail.registrationEnd,
      statusSource: detail.statusSource,
      positions: detail.positions,
      editalUrl: detail.documents.find((d) => d.kindHint === "edital")?.url ?? null,
      listingUrl: open.listingUrl,
      status:
        detail.examKind === "concurso" || detail.examKind === "oab"
          ? detail.status === "open"
            ? ("open" as const)
            : ("unknown" as const)
          : ("unknown" as const),
      sourceId: source.id,
      sourceDomain: source.domain,
    };

    const upserted = await dmzPost<{
      record: OpenExamRecord;
      created: boolean;
      changed: boolean;
    }>("/internal/open-exams", record);
    if (upserted.changed) summary.openDiscovered += 1;

    // Non-concurso stays catalogued but never feeds study content.
    if (record.kind !== "concurso" && record.kind !== "oab") continue;
    if (upserted.record.status !== "open" && detail.status !== "open") continue;

    for (const doc of detail.documents) {
      if (remaining <= 0) break;
      if (doc.roleHint === "administrative") continue;
      if (!isPathAllowed(doc.url, robots.disallow)) continue;
      const stored = await storeArtifact({
        examId: upserted.record.id,
        sourceId: source.id,
        url: doc.url,
        kind:
          doc.kindHint === "edital"
            ? "edital"
            : doc.kindHint === "prova"
              ? "prova"
              : doc.kindHint === "gabarito"
                ? "gabarito"
                : doc.kindHint === "programa"
                  ? "programa"
                  : "other",
        kindHint: doc.kindHint,
        roleHint: doc.roleHint,
        anchorLabel: doc.label,
        withBytes: true,
        politenessMs: source.politenessMs,
      });
      if (stored) {
        summary.artifactsStored += 1;
        if (stored.downloaded) remaining -= 1;
      }
    }
  }

  await dmzPut(`/internal/sources/${source.id}/listing-fingerprint`, {
    fingerprint,
    listingCount: listings.length,
  });

  for (const domain of outboundDomains.slice(0, 2)) {
    const proposed = await dmzPost<{ proposed?: boolean }>("/internal/sources/propose", {
      url: `https://${domain}/`,
      domain,
      name: domain,
      notes: `Discovered from outbound links on ${source.domain}`,
    });
    if (proposed.proposed) summary.proposedSources += 1;
  }

  return remaining;
}

async function finish(summary: CrawlerRunSummary): Promise<CrawlerRunSummary> {
  summary.finishedAt = new Date().toISOString();
  await dmzPost("/internal/runs", summary).catch(() => undefined);
  await closeBrowser().catch(() => undefined);
  logInfo("ingestion pass done", {
    worker: NAME,
    runId: summary.runId,
    status: summary.status,
    open: summary.openDiscovered,
    ok: summary.sourcesOk,
    skipped: summary.sourcesSkipped,
    failed: summary.sourcesFailed,
    artifacts: summary.artifactsStored,
    topicQueries: summary.topicQueriesRun,
  });
  return summary;
}

async function crawlOab(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  budget: number,
): Promise<number> {
  const groups = await crawlOabSource(source);
  const fingerprint = listingsFingerprint(
    groups.flatMap((group) =>
      group.documents.map((doc) => ({
        title: doc.label,
        href: doc.url,
        textBlob: `${group.examSlug} ${doc.label}`,
      })),
    ),
  );

  const previous = await dmzGet<{ fingerprint: string | null }>(
    `/internal/sources/${source.id}/listing-fingerprint`,
  );
  if (previous.fingerprint === fingerprint) {
    summary.sourcesSkipped += 1;
    return budget;
  }

  let remaining = budget;
  for (const group of groups) {
    const upserted = await dmzPost<{ record: OpenExamRecord; changed: boolean }>(
      "/internal/open-exams",
      oabOpenExamRecord(source, group),
    );
    if (upserted.changed) summary.openDiscovered += 1;

    for (const doc of group.documents) {
      if (remaining <= 0) break;
      const stored = await storeArtifact({
        examId: upserted.record.id,
        sourceId: source.id,
        url: doc.url,
        kind: doc.kind,
        withBytes: true,
      });
      if (stored) {
        summary.artifactsStored += 1;
        if (stored.downloaded) remaining -= 1;
      }
    }
  }

  await dmzPut(`/internal/sources/${source.id}/listing-fingerprint`, {
    fingerprint,
    listingCount: groups.reduce((total, group) => total + group.documents.length, 0),
  });

  return remaining;
}

function oabOpenExamRecord(source: CrawlerSource, group: OabExamGroup) {
  const edital = group.documents.find((doc) => doc.kind === "edital");
  return {
    examSlug: group.examSlug,
    title: group.title,
    org: "Ordem dos Advogados do Brasil",
    banca: "FGV",
    kind: "oab" as const,
    editionKey: group.edition?.fgvKey ?? null,
    detailUrl: oabEditionPageUrl(group.edition.fgvKey),
    registrationEnd: null,
    statusSource: "admin" as const,
    positions: ["Advogado"],
    emphasis: [],
    editalUrl: edital?.url ?? null,
    listingUrl: oabEditionPageUrl(group.edition.fgvKey),
    status: "open" as const,
    sourceId: source.id,
    sourceDomain: source.domain,
  };
}
