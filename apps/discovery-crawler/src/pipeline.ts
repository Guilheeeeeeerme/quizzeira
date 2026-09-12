// Concept: Ingestion (one crawl pass over the enabled Source registry)
import { randomUUID } from "node:crypto";
import type { CrawlerRunSummary, CrawlerSource, OpenExamRecord } from "@quizzeira/shared";
import { concursoPathSlug, listingsFingerprint, oabEditionPageUrl } from "@quizzeira/shared";
import { dmzGet, dmzPost, dmzPut, logError, logInfo, withRunIdAsync } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings, listingsToOpenRecords } from "./browser.js";
import { detailFromPdfListing, parseDetailHtml } from "./detail.js";
import { crawlDirectSource } from "./direct.js";
import { crawlerEnv } from "./env.js";
import { fetchPage } from "./fetch.js";
import { crawlOabSource, type OabExamGroup } from "./oab-fgv.js";
import { storeArtifact, storeSourceListingArtifact } from "./store.js";
import { crawlTopicQueries } from "./topic.js";

const NAME = "discovery-crawler";

export async function runDiscoveryPipeline(
  onlySourceId?: string | null,
): Promise<CrawlerRunSummary> {
  const runId = randomUUID().slice(0, 12);
  return withRunIdAsync(runId, async () => {
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
        artifactBudget = await crawlSource(source, summary, artifactBudget, onlySourceId);
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

    summary.status =
      summary.sourcesFailed === 0 ? "ok" : summary.sourcesOk > 0 ? "partial" : "failed";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    summary.status = "failed";
    summary.errors.push(message.slice(0, 200));
    logError("ingestion pass failed", { worker: NAME, runId, error: message });
  }

  return finish(summary);
  });
}

async function crawlSource(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  budget: number,
  onlySourceId?: string | null,
): Promise<number> {
  if (source.strategy === "oab-fgv") {
    if (crawlerEnv.fixtureMode) {
      summary.sourcesSkipped += 1;
      return budget;
    }
    return crawlOab(source, summary, budget);
  }

  const discoveryMode = source.discoveryMode;
  if (discoveryMode === "topic_query") {
    return crawlTopicQueries(source, summary, budget);
  }
  if (discoveryMode === "direct") {
    return crawlDirectSource(source, summary, budget);
  }

  return crawlListingMode(source, summary, budget, onlySourceId);
}

async function crawlListingMode(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  budget: number,
  onlySourceId?: string | null,
): Promise<number> {
  const { listings, outboundDomains, listingPageHtml, listingPageUrl } =
    await crawlSourceListings(source);
  const fingerprint = listingsFingerprint(listings);
  const previous = await dmzGet<{ fingerprint: string | null }>(
    `/internal/sources/${source.id}/listing-fingerprint`,
  );

  if (!onlySourceId && previous.fingerprint === fingerprint) {
    summary.sourcesSkipped += 1;
    return budget;
  }

  // Listing page → Source artifact only (administrative), never exam content (RC-2).
  if (listingPageHtml && listingPageUrl && budget > 0) {
    const stored = await storeSourceListingArtifact({
      sourceId: source.id,
      url: listingPageUrl,
      html: listingPageHtml,
    });
    if (stored) {
      summary.artifactsStored += 1;
      if (stored.downloaded) budget -= 1;
    }
  }

  let remaining = budget;
  const openRecords = listingsToOpenRecords(listings, source);

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i]!;
    const baseOpen = openRecords[i]!;

    const isPdf = /\.pdf(\?|#|$)/i.test(listing.href);
    const detail = isPdf
      ? detailFromPdfListing(listing.title, listing.href, listing.title)
      : parseDetailHtml(
          (await fetchPage(listing.href, source)).html,
          listing.href,
          listing.title,
        );

    const examSlug =
      detail.examSlug ||
      baseOpen.examSlug ||
      concursoPathSlug(listing.href) ||
      baseOpen.examSlug;

    const openPayload = {
      ...baseOpen,
      examSlug,
      title: detail.title || baseOpen.title,
      org: detail.org ?? baseOpen.org,
      banca: detail.banca ?? baseOpen.banca,
      emphasis: detail.emphasis.length > 0 ? detail.emphasis : baseOpen.emphasis,
      editalUrl: detail.editalUrl ?? baseOpen.editalUrl,
      listingUrl: listing.href,
      status: detail.status,
      kind: detail.kind,
      editionKey: detail.editionKey,
      detailUrl: isPdf ? listing.href : detail.detailUrl,
      registrationEnd: detail.registrationEnd?.toISOString() ?? null,
      statusSource: detail.statusSource,
      positions: detail.positions,
    };

    const upserted = await dmzPost<{
      record: OpenExamRecord;
      created: boolean;
      changed: boolean;
    }>("/internal/open-exams", openPayload);

    await dmzPost(`/internal/exams/${upserted.record.id}/detail`, {
      editionKey: detail.editionKey,
      detailUrl: openPayload.detailUrl,
      registrationEnd: openPayload.registrationEnd,
      statusSource: detail.statusSource,
      positions: detail.positions,
      kind: detail.kind,
    }).catch(() => undefined);

    if (upserted.changed) summary.openDiscovered += 1;

    if (upserted.record.status !== "open") continue;

    // Store ONLY document links from the detail page — never the listing URL (RC-2).
    for (const doc of detail.documentLinks) {
      if (remaining <= 0) break;
      const stored = await storeArtifact({
        examId: upserted.record.id,
        sourceId: source.id,
        url: doc.url,
        withBytes: true,
        kindHint: doc.kindHint,
        roleHint: doc.roleHint,
        anchorLabel: doc.anchorLabel,
        domain: source.domain,
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
        domain: source.domain,
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
    emphasis: [],
    editalUrl: edital?.url ?? null,
    listingUrl: oabEditionPageUrl(group.edition.fgvKey),
    kind: "oab" as const,
    status: "open" as const,
    sourceId: source.id,
    sourceDomain: source.domain,
  };
}
