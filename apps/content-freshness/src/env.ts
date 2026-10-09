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

export const freshnessEnv = {
  port: num("PORT", 3024),
  enabled: flag("CONTENT_FRESHNESS_ENABLED", false),
  /** Log-only; never mutate content-api when true. */
  dryRun: flag("CONTENT_FRESHNESS_DRY_RUN", true),
  maxPerPass: num("CONTENT_FRESHNESS_MAX_PER_PASS", 8),
  probeTimeoutMs: num("CONTENT_FRESHNESS_PROBE_TIMEOUT_MS", 15000),
};
