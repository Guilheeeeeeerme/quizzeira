import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const crawlerEnv = {
  enabled: (process.env.DISCOVERY_CRAWLER_ENABLED ?? "true") !== "false",
  /** Prefer fixture HTML over live net (CI / first boot). */
  fixtureMode: (process.env.DISCOVERY_CRAWLER_FIXTURE_MODE ?? "false") === "true",
  maxSourcesPerRun: num("DISCOVERY_CRAWLER_MAX_SOURCES", 6),
  maxOpenPerSource: num("DISCOVERY_CRAWLER_MAX_OPEN_PER_SOURCE", 8),
  /** Edital PDFs downloaded into the Document store per run. */
  maxArtifactsPerRun: num("DISCOVERY_CRAWLER_MAX_ARTIFACTS", 4),
  maxArtifactBytes: num("DISCOVERY_CRAWLER_MAX_ARTIFACT_BYTES", 16 * 1024 * 1024),
  headless: (process.env.DISCOVERY_CRAWLER_HEADLESS ?? "true") !== "false",
  navigationTimeoutMs: num("DISCOVERY_CRAWLER_NAV_TIMEOUT_MS", 45_000),
};
