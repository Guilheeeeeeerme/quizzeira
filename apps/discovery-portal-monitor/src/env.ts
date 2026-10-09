import "dotenv/config";

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function flag(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  return raw !== "false" && raw !== "0";
}

export const portalMonitorEnv = {
  port: num("PORT", 3015),
  enabled: flag("DISCOVERY_PORTAL_MONITOR_ENABLED", false),
  /** Probe timeout for startUrl HEAD/GET. */
  probeTimeoutMs: num("DISCOVERY_PORTAL_MONITOR_PROBE_TIMEOUT_MS", 15000),
  maxPerPass: num("DISCOVERY_PORTAL_MONITOR_MAX_PER_PASS", 8),
  /**
   * When true, queue force-crawl for sources that were broken and now probe OK,
   * or whose lastOkAt is older than staleHours.
   */
  forceCrawlOnRecover: flag("DISCOVERY_PORTAL_MONITOR_FORCE_CRAWL", true),
  staleHours: num("DISCOVERY_PORTAL_MONITOR_STALE_HOURS", 36),
};
