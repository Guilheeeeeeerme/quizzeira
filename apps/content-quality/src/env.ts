import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const qualityEnv = {
  enabled: (process.env.CONTENT_QUALITY_ENABLED ?? "true") !== "false",
  itemsPerPass: Math.max(1, num("CONTENT_QUALITY_ITEMS_PER_PASS", 10)),
  /** Publish/fail thresholds for the judge score; see gate.ts. */
  publishThreshold: num("CONTENT_QUALITY_PUBLISH_THRESHOLD", 0.8),
  failThreshold: num("CONTENT_QUALITY_FAIL_THRESHOLD", 0.5),
  contentApiUrl: (process.env.CONTENT_API_URL ?? "http://content-api:3020").replace(/\/$/, ""),
  contentApiKey:
    process.env.INTERNAL_API_KEY_CONTENT || process.env.INTERNAL_API_KEY || "dev-content-key",
};
