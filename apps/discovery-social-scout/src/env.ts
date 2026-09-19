import { config } from "dotenv";
import { resolve } from "path";
import { DEFAULT_LIVE_ADAPTERS } from "./adapters/index.js";

config({ path: resolve(__dirname, "../../../.env") });

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function list(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (!raw?.trim()) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const socialEnv = {
  enabled: (process.env.DISCOVERY_SOCIAL_ENABLED ?? "false") === "true",
  /** /health + /internal/tick listener (compose/infra healthcheck). */
  port: num("PORT", 3013),
  /** Reddit's anonymous .json endpoint is the only credential-less live path;
   * it must be opted into explicitly so FIXTURE_MODE=false never reaches the
   * public internet by accident. */
  redditAllowAnonymous: (process.env.REDDIT_ALLOW_ANONYMOUS ?? "false") === "true",
  /** Prefer fixture posts over live adapters (CI / first boot). */
  fixtureMode: (process.env.DISCOVERY_SOCIAL_FIXTURE_MODE ?? "true") !== "false",
  /** Also POST URL-only artifacts with social provenance. Default observe-only. */
  storeUrlArtifacts: (process.env.DISCOVERY_SOCIAL_STORE_URL_ARTIFACTS ?? "false") === "true",
  /** Scout locale — pt-BR by default (concurso-BR). */
  locale: process.env.DISCOVERY_SOCIAL_LOCALE?.trim() || "pt-BR",
  /** Optional live HTTP smoke behind operator flag (not run in CI). */
  smokeEnabled: (process.env.DISCOVERY_SOCIAL_SMOKE ?? "false") === "true",
  adapters: list("DISCOVERY_SOCIAL_ADAPTERS", ["fixture"]),
  /** Used when fixture mode is off and adapters list is empty. */
  defaultLiveAdapters: DEFAULT_LIVE_ADAPTERS,
  maxPostsPerPass: num("DISCOVERY_SOCIAL_MAX_POSTS", 40),
  maxFilesPerPass: num("DISCOVERY_SOCIAL_MAX_FILES", 12),
};
