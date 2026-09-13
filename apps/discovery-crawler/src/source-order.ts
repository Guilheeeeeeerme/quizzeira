// Concept: per-pass Source slice (§11 / §17.5).
//
// A pass only crawls `maxSources` rows. Topic-query sources are cheap and feed
// the coverage planner, so they always ride along; the rest rotate by
// least-recently-succeeded so a large registry is fully covered over time.

export interface OrderableSource {
  id: string;
  discoveryMode?: string;
  lastOkAt?: string | null;
}

export function selectSourcesForPass<T extends OrderableSource>(
  sources: T[],
  maxSources: number,
): T[] {
  const topic = sources.filter((s) => s.discoveryMode === "topic_query");
  const rest = sources
    .filter((s) => s.discoveryMode !== "topic_query")
    .sort((a, b) => {
      const ta = a.lastOkAt ? Date.parse(a.lastOkAt) : 0;
      const tb = b.lastOkAt ? Date.parse(b.lastOkAt) : 0;
      return ta - tb || a.id.localeCompare(b.id);
    });
  const budget = Math.max(0, maxSources - topic.length);
  return [...topic, ...rest.slice(0, budget)];
}
