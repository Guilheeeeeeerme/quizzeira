import { randomUUID } from "node:crypto";
import type {
  CrawlerRunSummary,
  CrawlerSource,
  OpenExamRecord,
  QuestionBankStats,
} from "@quizzeira/shared";
import { listingsFingerprint } from "@quizzeira/shared";
import { dmzGet, dmzPost, dmzPut } from "@quizzeira/worker-kit";
import { closeBrowser, crawlSourceListings, listingsToOpenRecords } from "./browser.js";
import { crawlerEnv } from "./env.js";

const NAME = "exam-crawler";

export async function runDiscoveryPipeline(): Promise<CrawlerRunSummary> {
  const runId = randomUUID().slice(0, 12);
  const startedAt = new Date().toISOString();
  const summary: CrawlerRunSummary = {
    runId,
    startedAt,
    finishedAt: null,
    status: "running",
    sourcesOk: 0,
    sourcesFailed: 0,
    openDiscovered: 0,
    proposedSources: 0,
    bankUpserts: 0,
    searchTriggered: 0,
    errors: [],
  };

  const lock = await dmzPost<{ acquired: boolean }>("/internal/crawler/lock");
  if (!lock.acquired) {
    summary.status = "failed";
    summary.finishedAt = new Date().toISOString();
    summary.errors.push("another crawl is running");
    await dmzPost("/internal/crawler/runs", summary);
    return summary;
  }

  try {
    // Always ensure Open exams catalog has seed/placeholder rows before crawl.
    await dmzPost("/internal/crawler/catalog/seed");
    await dmzPost("/internal/crawler/sources/seed");
    const { items: sources } = await dmzGet<{ items: CrawlerSource[] }>(
      "/internal/crawler/sources?status=active",
    );

    let searchesLeft = crawlerEnv.maxPastExamSearches;
    const take = sources.slice(0, crawlerEnv.maxSourcesPerRun);

    for (const source of take) {
      try {
        const { listings, outboundDomains } = await crawlSourceListings(source);
        const listingFp = listingsFingerprint(listings);
        const prevFp = await dmzGet<{ fingerprint: string | null }>(
          `/internal/crawler/sources/${source.id}/listing-fingerprint`,
        );
        const listingChanged = prevFp.fingerprint !== listingFp;

        if (!listingChanged) {
          await dmzPost(`/internal/crawler/sources/${source.id}/health`, { ok: true });
          summary.sourcesOk += 1;
          continue;
        }

        const opens = listingsToOpenRecords(listings, source);

        for (const open of opens) {
          const upserted = await dmzPost<{
            record: OpenExamRecord;
            created: boolean;
            changed: boolean;
          }>("/internal/crawler/open-exams", open);

          if (upserted.changed) {
            summary.openDiscovered += 1;
          }

          if (
            searchesLeft > 0 &&
            open.status === "open" &&
            upserted.changed
          ) {
            const statsRes = await dmzGet<{ exams: QuestionBankStats[] }>(
              `/internal/question-bank/stats?examSlug=${encodeURIComponent(open.examSlug)}`,
            );
            const bankTotal = statsRes.exams?.[0]?.total ?? 0;
            if (bankTotal > 0) {
              continue;
            }

            searchesLeft -= 1;
            try {
              const search = await dmzPost<{ upserted?: number }>("/internal/question-bank/search", {
                examSlug: open.examSlug,
                emphasis: open.emphasis[0] ?? null,
                subjects: open.emphasis.length ? open.emphasis : [open.title],
                topicTitle: open.title,
                locale: "pt",
                guidelines: `Órgão / concurso: ${open.org ?? open.title}\nEstilo da banca: ${open.banca ?? ""}`,
              });
              summary.searchTriggered += 1;
              summary.bankUpserts += search.upserted ?? 0;
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              summary.errors.push(`search ${open.examSlug}: ${message.slice(0, 120)}`);
            }
          }
        }

        await dmzPut(`/internal/crawler/sources/${source.id}/listing-fingerprint`, {
          fingerprint: listingFp,
        });

        // Light adaptive stub: propose at most 2 new domains per source (low trust).
        for (const domain of outboundDomains.slice(0, 2)) {
          const proposed = await dmzPost<{ proposed?: boolean }>(
            "/internal/crawler/sources/propose",
            {
              url: `https://${domain}/`,
              name: domain,
              notes: `Discovered from outbound links on ${source.domain}`,
            },
          );
          if (proposed.proposed) summary.proposedSources += 1;
        }

        await dmzPost(`/internal/crawler/sources/${source.id}/health`, { ok: true });
        summary.sourcesOk += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        summary.sourcesFailed += 1;
        summary.errors.push(`${source.domain}: ${message.slice(0, 160)}`);
        await dmzPost(`/internal/crawler/sources/${source.id}/health`, {
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
  } finally {
    summary.finishedAt = new Date().toISOString();
    await dmzPost("/internal/crawler/runs", summary).catch(() => undefined);
    await dmzPost("/internal/crawler/unlock").catch(() => undefined);
    await closeBrowser().catch(() => undefined);
  }

  console.log(
    `[${NAME}] run=${runId} status=${summary.status} open=${summary.openDiscovered} ok=${summary.sourcesOk} fail=${summary.sourcesFailed}`,
  );
  return summary;
}

/** @deprecated alias — prefer runDiscoveryPipeline */
export const runDailyPipeline = runDiscoveryPipeline;
