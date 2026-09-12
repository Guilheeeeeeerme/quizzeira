// Concept: Topic-query discovery mode (§11.3).
import type { TopicQueryDto } from "@quizzeira/shared";
import { domainFromUrl } from "@quizzeira/shared";
import { dmzGet, dmzPatch, dmzPost, logInfo } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { getRobotsForDomain, isPathAllowed } from "./robots.js";
import { shouldRejectBeforeFetch } from "./search/filter.js";
import {
  allowlistProvider,
  fixtureSearchProvider,
  webApiSearchProvider,
  type SearchProvider,
} from "./search/provider.js";
import { storeArtifact } from "./store.js";

const NAME = "discovery-crawler/topic";

function pickProviders(): SearchProvider[] {
  if (crawlerEnv.fixtureMode) return [fixtureSearchProvider()];
  return [allowlistProvider(), webApiSearchProvider()];
}

export async function runTopicQueries(budget: number): Promise<{
  ran: number;
  stored: number;
  remainingBudget: number;
}> {
  let remaining = budget;
  let ran = 0;
  let stored = 0;
  const { items } = await dmzGet<{ items: TopicQueryDto[] }>(
    `/internal/topic-queries?status=queued&limit=${crawlerEnv.maxTopicQueriesPerPass}`,
  );
  const providers = pickProviders();

  for (const tq of items) {
    if (remaining <= 0) break;
    ran += 1;
    await dmzPatch(`/internal/topic-queries/${tq.id}`, {
      status: "running",
      bumpAttempts: true,
    });
    let found = 0;
    let kept = 0;
    try {
      for (const query of tq.queries.slice(0, 3)) {
        for (const provider of providers) {
          const hits = await provider.search(query, { lang: "pt", limit: 10 });
          found += hits.length;
          for (const hit of hits) {
            if (remaining <= 0) break;
            const reject = shouldRejectBeforeFetch({ url: hit.url, title: hit.title, minAuthority: 0.4, authority: 0.5 });
            if (reject) continue;
            const domain = domainFromUrl(hit.url);
            if (!domain) continue;
            const robots = await getRobotsForDomain(domain);
            if (!isPathAllowed(hit.url, robots.disallow)) continue;
            const result = await storeArtifact({
              examId: tq.examId,
              sourceId: `topic:${domain}`,
              url: hit.url,
              kind: "other",
              kindHint: "artigo",
              roleHint: "knowledge",
              topicQueryId: tq.id,
              withBytes: true,
              fetchSignals: {
                provider: hit.provider,
                rank: hit.rank,
                query,
                searchTitle: hit.title,
              },
              politenessMs: crawlerEnv.topicPolitenessMs,
            });
            if (result) {
              kept += 1;
              stored += 1;
              if (result.downloaded) remaining -= 1;
              await dmzPost("/internal/domain-stats", {
                domain,
                fetched: 1,
                becameKnowledge: result.downloaded ? 1 : 0,
              }).catch(() => undefined);
            }
          }
        }
      }
      await dmzPatch(`/internal/topic-queries/${tq.id}`, {
        status: "done",
        candidatesFound: found,
        candidatesStored: kept,
        finishedAt: new Date().toISOString(),
        nextRunAt: kept === 0 ? new Date(Date.now() + 7 * 86400_000).toISOString() : null,
      });
    } catch (err) {
      await dmzPatch(`/internal/topic-queries/${tq.id}`, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        nextRunAt: new Date(Date.now() + 14 * 86400_000).toISOString(),
      });
      logInfo("topic query failed", {
        worker: NAME,
        id: tq.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { ran, stored, remainingBudget: remaining };
}
