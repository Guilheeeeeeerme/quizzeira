import type { CrawlerRunSummary, CrawlerSource } from "@quizzeira/shared";
import { domainFromUrl } from "@quizzeira/shared";
import { dmzGet, dmzPatch, dmzPost, logInfo } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { AllowlistSearchProvider } from "./search/allowlist-provider.js";
import { filterSearchCandidates } from "./search/filter.js";
import { FixtureSearchProvider } from "./search/fixture.js";
import type { SearchProvider } from "./search/provider.js";
import { WebApiSearchProvider } from "./search/web-api.js";
import { storeArtifact } from "./store.js";

const NAME = "discovery-crawler";

function pickProvider(): SearchProvider {
  if (crawlerEnv.fixtureMode) return new FixtureSearchProvider();
  if (process.env.SEARCH_API_URL) return new WebApiSearchProvider();
  // Default: allowlist-only (§17.4) — no paid search when SEARCH_API_URL unset.
  return new AllowlistSearchProvider();
}

async function observeDomain(
  domain: string | null,
  delta: { fetched?: number; becameKnowledge?: number; rejectedLowValue?: number },
): Promise<void> {
  if (!domain) return;
  await dmzPost(`/internal/domain-stats/${encodeURIComponent(domain)}/observe`, delta).catch(
    () => undefined,
  );
}

/** §11.3 topic-query mode: dequeue TopicQuery rows → search → store knowledge artifacts. */
export async function crawlTopicQueries(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  budget: number,
): Promise<number> {
  const { items } = await dmzGet<{
    items: Array<{
      id: string;
      examId: string;
      syllabusNodeId: string;
      canonicalKey: string;
      queries: string[] | unknown;
      attempts?: number;
    }>;
  }>("/internal/topic-queries?status=queued&limit=5").catch(() => ({ items: [] }));

  if (items.length === 0) return budget;

  const provider = pickProvider();
  let remaining = budget;

  for (const row of items) {
    if (remaining <= 0) break;
    const queries = Array.isArray(row.queries) ? row.queries.map(String) : [];
    let found = 0;
    let stored = 0;

    await dmzPatch(`/internal/topic-queries/${row.id}`, {
      status: "running",
    }).catch(() => undefined);

    for (const query of queries.slice(0, 3)) {
      if (remaining <= 0) break;
      const candidates = await provider.search(query, 10);
      found += candidates.length;

      for (const candidate of filterSearchCandidates(candidates).slice(0, 5)) {
        if (remaining <= 0) break;
        const domain = domainFromUrl(candidate.url);
        await observeDomain(domain, { fetched: 1 });

        const ok = await storeArtifact({
          examId: row.examId,
          sourceId: source.id,
          url: candidate.url,
          kindHint: "artigo",
          roleHint: "knowledge",
          anchorLabel: candidate.title,
          topicQueryId: row.id,
          withBytes: true,
          domain: domain ?? undefined,
          politenessMs: source.politenessMs,
          fetchSignals: {
            provider: provider.constructor.name,
            rank: candidate.rank,
            query,
            searchTitle: candidate.title,
          },
        });

        if (ok?.rejected) {
          await observeDomain(domain, { rejectedLowValue: 1 });
          continue;
        }
        if (ok) {
          stored += 1;
          summary.artifactsStored += 1;
          // Candidate accepted into discovery; becameKnowledge increments after content classify.
          if (ok.downloaded) remaining -= 1;
        }
      }
    }

    await dmzPatch(`/internal/topic-queries/${row.id}`, {
      status: "done",
      candidatesFound: found,
      candidatesStored: stored,
      attempts: (row.attempts ?? 0) + 1,
      finishedAt: new Date().toISOString(),
    }).catch(() => undefined);

    logInfo("topic query done", {
      worker: NAME,
      topicQueryId: row.id,
      found,
      stored,
    });
  }

  return remaining;
}
