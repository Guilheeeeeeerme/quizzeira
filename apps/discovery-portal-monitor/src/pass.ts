import { dmzGet, dmzPost, logInfo, logWarn } from "@quizzeira/worker-kit";
import { portalMonitorEnv } from "./env.js";
import { isStale, probeUrl } from "./probe.js";

const NAME = "discovery-portal-monitor";

export interface SourceRow {
  id: string;
  domain: string;
  name: string;
  startUrls: unknown;
  status: string;
  enabled?: boolean;
  discoveryMode?: string;
  lastOkAt: string | null;
  failCount: number;
}

function firstStartUrl(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const first = raw[0];
  return typeof first === "string" && first.startsWith("http") ? first : null;
}

export interface MonitorAction {
  sourceId: string;
  domain: string;
  probeOk: boolean;
  healthReported: boolean;
  forceQueued: boolean;
  detail?: string;
}

export interface PortalMonitorPassSummary {
  scanned: number;
  healthy: number;
  unhealthy: number;
  forceQueued: number;
  actions: MonitorAction[];
}

async function listSources(): Promise<SourceRow[]> {
  // includeDisabled so broken+disabled rows still get probed for recovery.
  const res = await dmzGet<{ items: SourceRow[] }>("/internal/sources?includeDisabled=1");
  return res.items ?? [];
}

/** Probe registered portals, report health, optionally force-crawl recoveries. */
export async function runPortalMonitorPass(): Promise<PortalMonitorPassSummary> {
  const sources = await listSources();
  // Prefer broken / stale listing sources; skip pure topic_query shells with no URLs.
  const ranked = sources
    .filter((s) => s.discoveryMode !== "topic_query" || firstStartUrl(s.startUrls))
    .sort((a, b) => {
      const rank = (s: SourceRow) =>
        (s.status === "broken" ? 0 : 1) + (isStale(s.lastOkAt, portalMonitorEnv.staleHours) ? 0 : 2);
      return rank(a) - rank(b);
    })
    .slice(0, portalMonitorEnv.maxPerPass);

  const actions: MonitorAction[] = [];
  for (const source of ranked) {
    const url = firstStartUrl(source.startUrls);
    if (!url) {
      actions.push({
        sourceId: source.id,
        domain: source.domain,
        probeOk: false,
        healthReported: false,
        forceQueued: false,
        detail: "no_start_url",
      });
      continue;
    }

    const probe = await probeUrl(url, portalMonitorEnv.probeTimeoutMs);
    let healthReported = false;
    let forceQueued = false;
    try {
      await dmzPost(`/internal/sources/${source.id}/health`, {
        ok: probe.ok,
        error: probe.ok ? undefined : probe.error || `http_${probe.status}`,
      });
      healthReported = true;
    } catch (err) {
      logWarn("health report failed", {
        worker: NAME,
        sourceId: source.id,
        error: err instanceof Error ? err.message.slice(0, 160) : String(err),
      });
    }

    const wasBroken = source.status === "broken" || source.failCount > 0;
    const stale = isStale(source.lastOkAt, portalMonitorEnv.staleHours);
    // Only force-crawl enabled Sources — disabled rows stay opt-out.
    if (
      probe.ok &&
      source.enabled !== false &&
      portalMonitorEnv.forceCrawlOnRecover &&
      (wasBroken || stale)
    ) {
      try {
        await dmzPost("/internal/crawl/force", { sourceId: source.id });
        forceQueued = true;
      } catch (err) {
        logWarn("force crawl failed", {
          worker: NAME,
          sourceId: source.id,
          error: err instanceof Error ? err.message.slice(0, 160) : String(err),
        });
      }
    }

    actions.push({
      sourceId: source.id,
      domain: source.domain,
      probeOk: probe.ok,
      healthReported,
      forceQueued,
      detail: probe.error,
    });
  }

  const summary: PortalMonitorPassSummary = {
    scanned: actions.length,
    healthy: actions.filter((a) => a.probeOk).length,
    unhealthy: actions.filter((a) => !a.probeOk).length,
    forceQueued: actions.filter((a) => a.forceQueued).length,
    actions,
  };
  logInfo("portal monitor pass", {
    worker: NAME,
    scanned: summary.scanned,
    healthy: summary.healthy,
    unhealthy: summary.unhealthy,
    forceQueued: summary.forceQueued,
  });
  return summary;
}
