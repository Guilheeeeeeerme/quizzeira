// Concept: Ingestion (listing + detail + topic + direct modes)
//
// Spec §11: never store the listing page as an exam artifact. Document
// candidates come from the detail page with kind/role hints.
import { randomUUID } from "node:crypto";
import type { CrawlerRunSummary, CrawlerSource, OpenExamRecord } from "@quizzeira/shared";
import {
  classifyExamKind,
  isConcursoEligible,
  listingsFingerprint,
  normalizeOpenExam,
  oabEditionPageUrl,
} from "@quizzeira/shared";
import { dmzGet, dmzPost, dmzPut, logError, logInfo } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings, listingsToOpenRecords } from "./browser.js";
import { parseDetailHtml } from "./detail.js";
import { crawlerEnv } from "./env.js";
import { fetchBytes } from "./fetch.js";
import { crawlOabSource, type OabExamGroup } from "./oab-fgv.js";
import { politeWait } from "./politeness.js";
import { fetchRobots, isAllowedByRobots } from "./robots.js";
import { storeArtifact, USER_AGENT } from "./store.js";
import { runTopicDiscoveryPass } from "./topic.js";

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
      // Still drain topic queries even with empty source registry.
      const topic = await runTopicDiscoveryPass(artifactBudget);
      summary.artifactsStored += topic.stored;
      summary.status = "ok";
      return await finish(summary);
    }

    const selected = onlySourceId
      ? sources.filter((s) => s.id === onlySourceId)
      : sources.slice(0, crawlerEnv.maxSourcesPerRun);

    for (const source of selected) {
      try {
        if (source.strategy === "oab-fgv") {
          if (crawlerEnv.fixtureMode) {
            summary.sourcesSkipped += 1;
            continue;
          }
          artifactBudget = await crawlOab(source, summary, artifactBudget);
          await dmzPost(`/internal/sources/${source.id}/health`, { ok: true });
          summary.sourcesOk += 1;
          continue;
        }

        const { listings, outboundDomains } = await crawlSourceListings(source);
        const fingerprint = listingsFingerprint(listings);
        const previous = await dmzGet<{ fingerprint: string | null }>(
          `/internal/sources/${source.id}/listing-fingerprint`,
        );

        if (!onlySourceId && previous.fingerprint === fingerprint) {
          await dmzPost(`/internal/sources/${source.id}/health`, { ok: true });
          summary.sourcesOk += 1;
          summary.sourcesSkipped += 1;
          continue;
        }

        // Optional: store listing HTML attached to Source only (debug), never as exam artifact.
        for (const startUrl of source.startUrls.slice(0, 1)) {
          if (artifactBudget <= 0) break;
          await storeArtifact({
            examId: null,
            sourceId: source.id,
            url: startUrl,
            withBytes: crawlerEnv.fixtureMode,
            kind: "other",
            kindHint: "listing",
            roleHint: "administrative",
            anchorLabel: "listing",
          });
        }

        const robots = await fetchRobots(`https://${source.domain}`, USER_AGENT);

        for (const open of listingsToOpenRecords(listings, source)) {
          if (!isConcursoEligible(open.kind ?? classifyExamKind(open.title, open.listingUrl))) {
            continue;
          }

          const detailUrl = open.listingUrl;
          let detail = parseDetailHtml("", detailUrl);
          let documents = detail.documents;

          if (isAllowedByRobots(detailUrl, robots)) {
            await politeWait(source.domain, source.politenessMs);
            const fetched = await fetchBytes(detailUrl);
            if (fetched.ok && fetched.buffer && /html/i.test(fetched.contentType)) {
              detail = parseDetailHtml(fetched.buffer.toString("utf8"), detailUrl);
              documents = detail.documents;
            }
          }

          const record = normalizeOpenExam({
            title: detail.title || open.title,
            href: detailUrl,
            sourceId: source.id,
            sourceDomain: source.domain,
            orgHint: detail.org || open.org,
            bancaHint: detail.banca || open.banca,
            editionKey: detail.editionKey || open.editionKey,
            detailUrl,
            registrationEnd: detail.registrationEnd,
            positions: detail.positions,
            kind: open.kind,
          });

          const upserted = await dmzPost<{
            record: OpenExamRecord;
            created: boolean;
            changed: boolean;
          }>("/internal/open-exams", record);

          if (upserted.changed) summary.openDiscovered += 1;
          if (upserted.record.status !== "open") continue;

          // CRITICAL: never fall back to listingUrl as exam artifact (§11.2 / checklist #1).
          for (const doc of documents) {
            if (artifactBudget <= 0) break;
            if (doc.roleHint === "administrative" && doc.kindHint === "listing") continue;
            if (!isAllowedByRobots(doc.url, robots)) continue;
            await politeWait(source.domain, source.politenessMs);
            const stored = await storeArtifact({
              examId: upserted.record.id,
              sourceId: source.id,
              url: doc.url,
              withBytes: true,
              kindHint: doc.kindHint,
              roleHint: doc.roleHint,
              anchorLabel: doc.label,
            });
            if (stored) {
              summary.artifactsStored += 1;
              if (stored.downloaded) artifactBudget -= 1;
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

    const topic = await runTopicDiscoveryPass(artifactBudget);
    summary.artifactsStored += topic.stored;

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
        kindHint: doc.kind === "edital" ? "edital" : doc.kind === "prova" ? "prova" : doc.kind === "gabarito" ? "gabarito" : "unknown",
        roleHint:
          doc.kind === "edital"
            ? "specification"
            : doc.kind === "prova" || doc.kind === "gabarito"
              ? "evidence"
              : "unknown",
        anchorLabel: doc.label,
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
    status: "open" as const,
    sourceId: source.id,
    sourceDomain: source.domain,
    kind: "oab" as const,
  };
}
