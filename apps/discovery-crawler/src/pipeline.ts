// Concept: Ingestion (one crawl pass over the enabled Source registry)
//
// Every write goes to discovery-api. The crawler has no knowledge of topics,
// quizzes, or the question bank — turning a PDF into questions is Content's job.
import { randomUUID } from "node:crypto";
import type { CrawlerRunSummary, CrawlerSource, OpenExamRecord } from "@quizzeira/shared";
import { listingsFingerprint, oabEditionPageUrl } from "@quizzeira/shared";
import { dmzGet, dmzPost, dmzPut, logError, logInfo } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings, listingsToOpenRecords } from "./browser.js";
import { crawlerEnv } from "./env.js";
import { crawlOabSource, type OabExamGroup } from "./oab-fgv.js";

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
        if (source.strategy === "oab-fgv") {
          // No fixture exercises an ASP.NET postback, and the generic fixture
          // would file its listing under OAB exam slugs. Skip instead.
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

        for (const open of listingsToOpenRecords(listings, source)) {
          const upserted = await dmzPost<{
            record: OpenExamRecord;
            created: boolean;
            changed: boolean;
          }>("/internal/open-exams", open);

          if (upserted.changed) summary.openDiscovered += 1;

          // Skip artifact download for unknown nav/chrome rows — they flood
          // Content with junk examSlugs (certificacao, voltar-para-home, …).
          if (upserted.record.status !== "open") continue;

          // Prefer an edital/PDF URL; otherwise keep the listing page so Content
          // still has HTML to extract while the board has not published a PDF.
          // Store even when the exam row is unchanged — first successful crawl
          // may have discovered the listing before artifact download existed.
          const artifactUrl = open.editalUrl || open.listingUrl;
          if (artifactUrl && artifactBudget > 0) {
            const stored = await storeArtifact({
              examId: upserted.record.id,
              sourceId: source.id,
              url: artifactUrl,
              withBytes: true,
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
        // Compose restarts / shared rebuilds close Playwright mid-pass; do not
        // mark the Source broken or the next force crawl is skipped (active-only).
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

/**
 * Ingests the OAB portal. Unlike a listing source, the exams are known in
 * advance: the crawl produces one open-exam row per edition and phase, and
 * every document it carries is stored with the kind the label taxonomy gave it
 * — which is what lets Extraction pair a caderno with its gabarito.
 *
 * Returns the remaining artifact budget.
 */
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
    emphasis: [],
    editalUrl: edital?.url ?? null,
    listingUrl: oabEditionPageUrl(group.edition.fgvKey),
    // The Exame de Ordem runs about three times a year: an edition page is
    // never "closed" material the way a one-off concurso is.
    status: "open" as const,
    sourceId: source.id,
    sourceDomain: source.domain,
  };
}

async function storeArtifact(input: {
  examId: string;
  sourceId: string;
  url: string;
  withBytes: boolean;
  /** Set by sources that classify their own documents (oab-fgv). */
  kind?: string;
}): Promise<{ downloaded: boolean } | null> {
  const kind = input.kind ?? (/edital/i.test(input.url) ? "edital" : "other");
  let base64: string | undefined;
  let contentType: string | undefined;

  if (input.withBytes) {
    try {
      const res = await fetch(input.url, {
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(crawlerEnv.navigationTimeoutMs),
      });
      contentType = res.headers.get("content-type") ?? undefined;
      const okType = /pdf|html|text\/plain/i.test(contentType ?? "");
      if (res.ok && okType) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength <= crawlerEnv.maxArtifactBytes) {
          base64 = buf.toString("base64");
        }
      }
    } catch {
      // Fall through and record the URL reference only.
    }
  }

  const inferredKind =
    input.kind ??
    (/edital/i.test(input.url) || /pdf/i.test(contentType ?? "")
      ? kind
      : /html/i.test(contentType ?? "")
        ? "other"
        : kind);

  try {
    await dmzPost("/internal/artifacts", {
      examId: input.examId,
      sourceId: input.sourceId,
      kind: inferredKind,
      url: input.url,
      contentType: contentType ?? "application/octet-stream",
      base64,
    });
    return { downloaded: Boolean(base64) };
  } catch {
    return null;
  }
}

const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.1 (+https://quizzeira.local; research; polite)";
