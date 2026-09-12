/** Topic-query discovery mode (§11.3, §17). */

import { dmzGet, dmzPost, logInfo } from "@quizzeira/worker-kit";
import type { RoleHint } from "@quizzeira/shared";
import { createSearchProvider } from "./search/provider.js";
import { filterSearchHit } from "./search/filter.js";
import { politeWait } from "./politeness.js";
import { storeArtifact } from "./store.js";
import { domainFromUrl } from "@quizzeira/shared";

const NAME = "discovery-crawler/topic";

export interface TopicQueryRow {
  id: string;
  examId: string;
  syllabusNodeId: string;
  canonicalKey: string;
  queries: string[];
  status: string;
}

export async function runTopicDiscoveryPass(budget: number): Promise<{
  queries: number;
  stored: number;
  remainingBudget: number;
}> {
  let remaining = budget;
  let queries = 0;
  let stored = 0;

  const { items } = await dmzGet<{ items: TopicQueryRow[] }>(
    "/internal/topic-queries?status=queued&limit=20",
  ).catch(() => ({ items: [] as TopicQueryRow[] }));

  if (items.length === 0) return { queries: 0, stored: 0, remainingBudget: remaining };

  const provider = createSearchProvider();

  for (const row of items) {
    if (remaining <= 0) break;
    queries += 1;
    await dmzPost(`/internal/topic-queries/${row.id}`, { status: "running" }).catch(() => undefined);

    let candidatesFound = 0;
    let candidatesStored = 0;

    for (const q of row.queries.slice(0, 3)) {
      const hits = await provider.search(q, { lang: "pt", limit: 8 });
      for (const hit of hits) {
        candidatesFound += 1;
        if (!filterSearchHit(hit)) continue;
        if (remaining <= 0) break;
        const domain = domainFromUrl(hit.url);
        if (domain) await politeWait(domain, 800);
        const result = await storeArtifact({
          examId: row.examId,
          sourceId: "topic-discovery",
          url: hit.url,
          withBytes: true,
          kindHint: "artigo",
          roleHint: "knowledge" as RoleHint,
          anchorLabel: hit.title,
          topicQueryId: row.id,
        });
        if (result) {
          candidatesStored += 1;
          stored += 1;
          if (result.downloaded) remaining -= 1;
        }
      }
    }

    await dmzPost(`/internal/topic-queries/${row.id}`, {
      status: "done",
      candidatesFound,
      candidatesStored,
      finishedAt: new Date().toISOString(),
    }).catch(() => undefined);

    logInfo("topic query done", {
      worker: NAME,
      id: row.id,
      candidatesFound,
      candidatesStored,
    });
  }

  return { queries, stored, remainingBudget: remaining };
}
