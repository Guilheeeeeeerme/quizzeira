import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

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

function looksLikeHeadroom(url: string): boolean {
  return /headroom|:8787\b/i.test(url);
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
export const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
export const DEFAULT_JEV_MODEL = "jev-1.13.0";
export const DEFAULT_JEV_BASE_URL = "https://api.typesafe.ai";

/** Staged authority for a JEV-owned decision (JEV audit plan §6). */
export type JevMode = "off" | "shadow" | "active";
export const JEV_MODES: readonly JevMode[] = ["off", "shadow", "active"];

/**
 * When false, workers talk to the public Gemini URL even if GEMINI_BASE_URL
 * points at Headroom. Use this when Headroom breaks a path (auth, Docker
 * networking to 127.0.0.1:8787, etc.). Host-side tooling can keep using
 * Headroom independently. JEV never goes through Headroom.
 */
const llmUseHeadroom = flag("LLM_USE_HEADROOM", true);

function resolveLlmBaseUrl(
  configured: string | undefined,
  publicDefault: string,
): string {
  const raw = (configured || publicDefault).replace(/\/$/, "");
  if (!llmUseHeadroom && looksLikeHeadroom(raw)) return publicDefault;
  return raw;
}

/**
 * Provider roots are operator configuration, not user input, but a typo that
 * embeds credentials or a query string in the root would leak into every
 * request log line. Fail loudly instead of normalizing it away.
 */
export function normalizeProviderRoot(configured: string | undefined, publicDefault: string): string {
  const raw = (configured || publicDefault).trim().replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`invalid provider base URL (unparseable)`);
  }
  if (url.username || url.password) throw new Error("provider base URL must not embed credentials");
  if (url.search || url.hash) throw new Error("provider base URL must not carry a query or fragment");
  if (url.protocol !== "https:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) {
    throw new Error("provider base URL must use https");
  }
  return raw;
}

/**
 * `JEV_<TASK>_MODE` parsing. Unset → `active` when a key is present, `off`
 * otherwise (cheapest stable prod default: JEV owns closed decisions, Gemini
 * is not double-paid). Use explicit `shadow` only in staging/holdout to
 * compare against Gemini. An explicit `shadow`/`active` without a key is a
 * readiness failure, surfaced by `checkJevReadiness`, never a silent no-op.
 * Unknown values are rejected.
 */
export function parseJevMode(raw: string | undefined, hasKey: boolean): JevMode {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return hasKey ? "active" : "off";
  if ((JEV_MODES as readonly string[]).includes(value)) return value as JevMode;
  throw new Error(`invalid JEV mode "${value}" (expected off | shadow | active)`);
}

const jevApiKey = (process.env.JEV_API_KEY ?? "").trim();

export const workerEnv = {
  /** Explicit opt-in/out for Headroom LLM proxy. */
  llmUseHeadroom,
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  geminiBaseUrl: resolveLlmBaseUrl(process.env.GEMINI_BASE_URL, DEFAULT_GEMINI_BASE_URL),
  /**
   * Generation owner list. Only `gemini` and `fixture` are registered; the
   * list exists so deterministic CI can select `fixture`. There is no
   * cross-provider failover any more (JEV audit plan §6 Stage A).
   */
  llmProviderOrder: process.env.LLM_PROVIDER_ORDER || "gemini",
  /** JEV (TypeSafe) — typed Choice/Score decisions, direct transport. */
  jevApiKey,
  jevBaseUrl: normalizeProviderRoot(process.env.JEV_BASE_URL, DEFAULT_JEV_BASE_URL),
  jevModel: process.env.JEV_MODEL || DEFAULT_JEV_MODEL,
  jevTimeoutMs: num("JEV_TIMEOUT_SECONDS", 10) * 1000,
  jevMaxAttempts: num("JEV_MAX_ATTEMPTS", 3),
  /** Largest `state` payload (chars) sent to JEV; keeps requests under its 32k-token state limit. */
  jevMaxStateChars: num("JEV_MAX_STATE_CHARS", 60_000),
  jevClassifyMode: parseJevMode(process.env.JEV_CLASSIFY_MODE, Boolean(jevApiKey)),
  jevMappingMode: parseJevMode(process.env.JEV_MAPPING_MODE, Boolean(jevApiKey)),
  jevJudgeMode: parseJevMode(process.env.JEV_JUDGE_MODE, Boolean(jevApiKey)),
  /**
   * Shadow headroom rule: shadow JEV calls have their own per-minute and daily
   * call caps and never draw from the shared `llm:rate:*` limiter, so a wide
   * shadow sample cannot starve the generation/judge production slots.
   */
  jevShadowRatePerMinute: num("JEV_SHADOW_RATE_PER_MINUTE", 10),
  jevShadowDailyCalls: num("JEV_SHADOW_DAILY_CALLS", 500),
  llmRateLimitPerMinute: num("LLM_RATE_LIMIT_PER_MINUTE", 20),
  /**
   * Per-stage per-minute call ceilings (§9): "at most one generation batch
   * and one judge item per minute" independent of the global per-minute
   * rate limit above, so a burst of cheaper-stage calls (ku/classify/...)
   * can never crowd out that minute's generation/judge slot.
   */
  llmRateLimitGenerationPerMinute: num("LLM_RATE_GENERATION_PER_MINUTE", 1),
  llmRateLimitJudgePerMinute: num("LLM_RATE_JUDGE_PER_MINUTE", 1),
  llmDailyBudget: num("LLM_DAILY_BUDGET", 500),
  /** Hard daily token halt (OWASP LLM06). Default ~2M tokens/day. */
  llmDailyTokenBudget: num("LLM_DAILY_TOKEN_BUDGET", 2_000_000),
  /** Per-stage daily token budgets (§27.4). 0 = unlimited within global budget. */
  llmBudgetKuTokens: num("LLM_BUDGET_KU_TOKENS", 500_000),
  llmBudgetGenerationTokens: num("LLM_BUDGET_GENERATION_TOKENS", 800_000),
  llmBudgetJudgeTokens: num("LLM_BUDGET_JUDGE_TOKENS", 400_000),
  llmBudgetResidueTokens: num("LLM_BUDGET_RESIDUE_TOKENS", 200_000),
  llmCacheTtlDays: num("LLM_CACHE_TTL_DAYS", 90),
  /** Allow in-process budgets only under test runners. */
  allowMemoryBudget:
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.LLM_ALLOW_MEMORY_BUDGET === "true",
  intervalMs: num("WORKER_INTERVAL_MS", 60_000),
  windows: (process.env.WORKER_WINDOWS ?? "").trim(),
  timeZone: process.env.WORKER_TZ || "UTC",
  internalApiUrl: (process.env.INTERNAL_API_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  internalApiKey: process.env.INTERNAL_API_KEY ?? "dev-internal-key",
  redisUrl: (process.env.REDIS_URL ?? "").trim(),
};
