import { dmzPost, logInfo, logWarn } from "@quizzeira/worker-kit";
import { isDeniedCatalogDomain, selectCatalogBatch, type CatalogSource } from "./catalog.js";
import { sourceScoutEnv } from "./env.js";

const NAME = "discovery-source-scout";

/** Module-level rotation cursor (process lifetime). */
let catalogCursor = 0;

export interface ScoutProposeResult {
  domain: string;
  url: string;
  action: "proposed" | "rejected" | "dedupe" | "denied" | "error";
  detail?: string;
}

async function proposeSource(entry: CatalogSource): Promise<ScoutProposeResult> {
  const url = entry.startUrls[0] || `https://${entry.domain}/`;
  if (isDeniedCatalogDomain(entry.domain)) {
    return { domain: entry.domain, url, action: "denied", detail: "catalog doNotScrape" };
  }
  try {
    const res = await dmzPost<{
      rejected?: boolean;
      dedupe?: boolean;
      reason?: string;
      decision?: string;
    }>("/internal/scout/candidates", {
      url,
      domain: entry.domain,
      name: entry.name,
      notes: [
        `source-scout:${entry.id}`,
        `priority=${entry.priority}`,
        `category=${entry.category}`,
        `kind=${entry.kind}`,
        `mode=${entry.discoveryMode}`,
        entry.topicTags.length ? `tags=${entry.topicTags.join(",")}` : null,
        entry.notes ? `note=${entry.notes.slice(0, 160)}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    });
    if (res.rejected) {
      return { domain: entry.domain, url, action: "rejected", detail: res.reason };
    }
    if (res.dedupe) {
      return { domain: entry.domain, url, action: "dedupe" };
    }
    return { domain: entry.domain, url, action: "proposed", detail: res.decision };
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : String(err);
    logWarn("scout propose failed", { worker: NAME, domain: entry.domain, error: detail });
    return { domain: entry.domain, url, action: "error", detail };
  }
}

export interface SourceScoutPassSummary {
  scanned: number;
  proposed: number;
  rejected: number;
  deduped: number;
  denied: number;
  errors: number;
  results: ScoutProposeResult[];
}

/** One pass: rotate curated official portals into SourceCandidate quarantine. */
export async function runSourceScoutPass(): Promise<SourceScoutPassSummary> {
  const { items, nextCursor } = selectCatalogBatch(
    catalogCursor,
    sourceScoutEnv.maxPerPass,
    sourceScoutEnv.priorityFilter || undefined,
  );
  catalogCursor = nextCursor;

  const results: ScoutProposeResult[] = [];
  for (const entry of items) {
    results.push(await proposeSource(entry));
  }

  const summary: SourceScoutPassSummary = {
    scanned: results.length,
    proposed: results.filter((r) => r.action === "proposed").length,
    rejected: results.filter((r) => r.action === "rejected").length,
    deduped: results.filter((r) => r.action === "dedupe").length,
    denied: results.filter((r) => r.action === "denied").length,
    errors: results.filter((r) => r.action === "error").length,
    results,
  };

  logInfo("source scout pass", {
    worker: NAME,
    scanned: summary.scanned,
    proposed: summary.proposed,
    rejected: summary.rejected,
    deduped: summary.deduped,
    denied: summary.denied,
    errors: summary.errors,
  });
  return summary;
}
