// Concept: Ingestion (one crawl pass over the enabled Source registry)
import { randomUUID } from "node:crypto";
import type { CrawlerRunSummary, CrawlerSource, OpenExamRecord } from "@quizzeira/shared";
import { concursoPathSlug, listingsFingerprint, oabEditionPageUrl, slugifyKey } from "@quizzeira/shared";
import { cesgranrioPortalEventId, fetchCesgranrioPortalDocuments } from "./cesgranrio-portal.js";
import { dmzGet, dmzPost, dmzPut, logError, logInfo, withRunIdAsync } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings, listingsToOpenRecords } from "./browser.js";
import {
  detailFromPdfListing,
  hasExamIdentity,
  isSelfDetailPage,
  parseDetailHtml,
  withinRegistrationGrace,
  type DetailPageParse,
} from "./detail.js";
import { crawlDirectSource } from "./direct.js";
import { crawlerEnv } from "./env.js";
import { fetchPage } from "./fetch.js";
import { crawlOabSource, type OabExamGroup } from "./oab-fgv.js";
import { selectSourcesForPass } from "./source-order.js";
import { storeArtifact, storeSourceListingArtifact } from "./store.js";
import { crawlTopicQueries } from "./topic.js";
import { bindRobotsSource } from "./robots.js";

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

  // Exam documents and topic-query knowledge have separate budgets: topic
  // sources run first and must not starve edital/prova discovery.
  let artifactBudget = crawlerEnv.maxArtifactsPerRun;
  let topicBudget = crawlerEnv.maxArtifactsPerRun;

  try {
    // Forced admin crawls must see broken sources too — a prior failure must not
    // hide the target behind `status=active` (that produced empty-registry no-ops).
    const sourcesPath = onlySourceId
      ? "/internal/sources"
      : "/internal/sources?status=active";
    const { items: sources } = await dmzGet<{ items: CrawlerSource[] }>(sourcesPath);

    if (sources.length === 0) {
      logInfo("source registry empty", { worker: NAME, runId });
      summary.status = "ok";
      return await finish(summary);
    }

    const selected = onlySourceId
      ? sources.filter((s) => s.id === onlySourceId)
      : selectSourcesForPass(sources, crawlerEnv.maxSourcesPerRun);

    for (const source of selected) {
      try {
        bindRobotsSource(source.domain, source.id);
        if (source.discoveryMode === "topic_query") {
          topicBudget = await crawlSource(source, summary, topicBudget, onlySourceId);
        } else {
          artifactBudget = await crawlSource(source, summary, artifactBudget, onlySourceId);
        }
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
  // Exam-specific strategies (strategy registry). Checked before discoveryMode
  // so `discoveryMode=custom` + `strategy=oab-fgv` still routes correctly.
  if (source.strategy === "oab-fgv") {
    if (crawlerEnv.fixtureMode) {
      summary.sourcesSkipped += 1;
      return budget;
    }
    return crawlOab(source, summary, budget, onlySourceId);
  }

  const discoveryMode = source.discoveryMode;
  if (discoveryMode === "topic_query") {
    return crawlTopicQueries(source, summary, budget);
  }
  if (discoveryMode === "direct") {
    return crawlDirectSource(source, summary, budget);
  }
  if (discoveryMode === "custom") {
    // Spec §11.1: custom = registered strategy handler. Unknown strategies must
    // not silently fall through to listing (would reintroduce RC-2 patterns).
    const message = `discoveryMode=custom has no registered handler for strategy=${source.strategy}`;
    logInfo(message, { worker: NAME, sourceId: source.id, strategy: source.strategy });
    summary.sourcesSkipped += 1;
    summary.errors.push(`${source.domain}: ${message}`);
    return budget;
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

  // Start URL is itself the concurso page (IBAM-style "informacoes/<id>"):
  // one exam, its anexos are that exam's documents (§11.2.2 / §11.2.6).
  if (listingPageHtml && listingPageUrl) {
    const self = parseDetailHtml(listingPageHtml, listingPageUrl, source.name);
    if (isSelfDetailPage(self, listings.map((l) => l.href))) {
      remaining = await upsertExamWithDocuments(source, summary, self, listingPageUrl, remaining);
      await dmzPut(`/internal/sources/${source.id}/listing-fingerprint`, {
        fingerprint,
        listingCount: listings.length,
      });
      return remaining;
    }
  }

  const openRecords = listingsToOpenRecords(listings, source);

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i]!;
    const baseOpen = openRecords[i]!;

    const isPdf = /\.pdf(\?|#|$)/i.test(listing.href);
    let detail: DetailPageParse;
    if (isPdf) {
      detail = detailFromPdfListing(listing.title, listing.href, listing.title);
    } else {
      const html = (await fetchPage(listing.href, source)).html;
      detail = parseDetailHtml(html, listing.href, listing.title);
      detail = await enrichDetailWithPortal(detail, html);
    }

    if (!hasExamIdentity(detail)) {
      logInfo("listing skipped: no exam identity", {
        worker: NAME,
        sourceId: source.id,
        href: listing.href.slice(0, 160),
        title: (detail.title || listing.title).slice(0, 80),
      });
      continue;
    }

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

    if (upserted.record.status !== "open" && !withinRegistrationGrace(detail.registrationEnd)) {
      continue;
    }

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

/** Banca portals that hide editais behind a JSON API (Cesgranrio). */
async function enrichDetailWithPortal(
  detail: DetailPageParse,
  html: string,
): Promise<DetailPageParse> {
  const eventId = cesgranrioPortalEventId(html, detail.detailUrl);
  if (!eventId) return detail;
  const portalDocs = await fetchCesgranrioPortalDocuments(eventId);
  if (portalDocs.length === 0) return detail;
  const seen = new Set(detail.documentLinks.map((d) => d.url));
  const documentLinks = [...detail.documentLinks, ...portalDocs.filter((d) => !seen.has(d.url))];
  const editalUrl =
    detail.editalUrl ??
    documentLinks.find((d) => d.kindHint === "edital")?.url ??
    null;
  return { ...detail, documentLinks, editalUrl };
}

/** One exam from an already-parsed detail page plus its document links. */
async function upsertExamWithDocuments(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  detail: DetailPageParse,
  pageUrl: string,
  budget: number,
): Promise<number> {
  const examSlug = detail.examSlug || slugifyKey(detail.title);
  const upserted = await dmzPost<{ record: OpenExamRecord; created: boolean; changed: boolean }>(
    "/internal/open-exams",
    {
      examSlug,
      title: detail.title,
      org: detail.org,
      banca: detail.banca,
      emphasis: detail.emphasis,
      editalUrl: detail.editalUrl,
      listingUrl: pageUrl,
      sourceId: source.id,
      sourceDomain: source.domain,
      status: detail.status,
      kind: detail.kind,
      editionKey: detail.editionKey,
      detailUrl: pageUrl,
      registrationEnd: detail.registrationEnd?.toISOString() ?? null,
      statusSource: detail.statusSource,
      positions: detail.positions,
    },
  );
  if (upserted.changed) summary.openDiscovered += 1;
  logInfo("self-detail source", {
    worker: NAME,
    sourceId: source.id,
    examSlug,
    status: detail.status,
    documents: detail.documentLinks.length,
  });

  let remaining = budget;
  if (upserted.record.status !== "open" && !withinRegistrationGrace(detail.registrationEnd)) {
    return remaining;
  }
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
  onlySourceId?: string | null,
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
  // Admin force (onlySourceId) must re-download even if the edition list is unchanged.
  if (!onlySourceId && previous.fingerprint === fingerprint) {
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
