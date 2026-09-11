// Concept: Ingestion (one crawl pass over the enabled Source registry)
//
// Every write goes to discovery-api. The crawler has no knowledge of topics,
// quizzes, or the question bank — turning a PDF into questions is Content's job.
import { randomUUID } from "node:crypto";
import type { CrawlerRunSummary, CrawlerSource, OpenExamRecord } from "@quizzeira/shared";
import { listingsFingerprint } from "@quizzeira/shared";
import { dmzGet, dmzPost, dmzPut, logError, logInfo } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings, listingsToOpenRecords } from "./browser.js";
import { crawlerEnv } from "./env.js";

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

    // An empty registry is the normal first-boot state: nothing is seeded, an
    // admin adds the first Source through the Admin UI.
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
        const { listings, outboundDomains } = await crawlSourceListings(source);
        const fingerprint = listingsFingerprint(listings);
        const previous = await dmzGet<{ fingerprint: string | null }>(
          `/internal/sources/${source.id}/listing-fingerprint`,
        );

        if (previous.fingerprint === fingerprint) {
          await dmzPost(`/internal/sources/${source.id}/health`, { ok: true });
          summary.sourcesOk += 1;
          summary.sourcesSkipped += 1;
          continue;
        }

        for (const open of listingsToOpenRecords(listings, source)) {
          const upserted = await dmzPost<{
            record: OpenExamRecord;
            created: boolean;
            changed: boolean;
          }>("/internal/open-exams", open);

          if (!upserted.changed) continue;
          summary.openDiscovered += 1;

          // Pull the edital into the Document store so Content has bytes to
          // extract from. URL-only artifacts are still recorded as references.
          if (open.editalUrl) {
            const stored = await storeArtifact({
              examId: upserted.record.id,
              sourceId: source.id,
              url: open.editalUrl,
              withBytes: artifactBudget > 0,
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

        // Adaptive reach, gated: at most 2 proposals per source per pass, and
        // proposals are inert until an admin approves them.
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

async function storeArtifact(input: {
  examId: string;
  sourceId: string;
  url: string;
  withBytes: boolean;
}): Promise<{ downloaded: boolean } | null> {
  const kind = /edital/i.test(input.url) ? "edital" : "other";
  let base64: string | undefined;
  let contentType: string | undefined;

  if (input.withBytes) {
    try {
      const res = await fetch(input.url, {
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(crawlerEnv.navigationTimeoutMs),
      });
      contentType = res.headers.get("content-type") ?? undefined;
      if (res.ok && /pdf/i.test(contentType ?? "")) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength <= crawlerEnv.maxArtifactBytes) {
          base64 = buf.toString("base64");
        }
      }
    } catch {
      // Fall through and record the URL reference only.
    }
  }

  try {
    await dmzPost("/internal/artifacts", {
      examId: input.examId,
      sourceId: input.sourceId,
      kind,
      url: input.url,
      contentType: contentType ?? "application/pdf",
      base64,
    });
    return { downloaded: Boolean(base64) };
  } catch {
    return null;
  }
}

const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.1 (+https://quizzeira.local; research; polite)";
