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
  enabled: (process.env.EXAM_CRAWLER_ENABLED ?? "true") !== "false",
  /** Prefer fixture HTML over live net (CI / first boot). */
  fixtureMode: (process.env.EXAM_CRAWLER_FIXTURE_MODE ?? "false") === "true",
  maxSourcesPerRun: num("EXAM_CRAWLER_MAX_SOURCES", 6),
  maxOpenPerSource: num("EXAM_CRAWLER_MAX_OPEN_PER_SOURCE", 8),
  maxPastExamSearches: num("EXAM_CRAWLER_MAX_SEARCHES", 4),
  headless: (process.env.EXAM_CRAWLER_HEADLESS ?? "true") !== "false",
  navigationTimeoutMs: num("EXAM_CRAWLER_NAV_TIMEOUT_MS", 45_000),
};
