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
export const DEFAULT_OPENAI_MODEL = "gpt-5-nano";
export const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

/**
 * When false, workers talk to public Gemini/OpenAI URLs even if GEMINI_BASE_URL
 * / OPENAI_BASE_URL point at Headroom. Use this when Headroom breaks a path
 * (auth, Docker networking to 127.0.0.1:8787, etc.). Host-side Cursor tooling
 * can keep using Headroom independently.
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

export const workerEnv = {
  /** Explicit opt-in/out for Headroom LLM proxy. */
  llmUseHeadroom,
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  geminiBaseUrl: resolveLlmBaseUrl(process.env.GEMINI_BASE_URL, DEFAULT_GEMINI_BASE_URL),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
  openaiBaseUrl: resolveLlmBaseUrl(process.env.OPENAI_BASE_URL, DEFAULT_OPENAI_BASE_URL),
  llmProviderOrder: process.env.LLM_PROVIDER_ORDER || "gemini,openai",
  modelRankRefreshMs: num("MODEL_RANK_REFRESH_MS", 43_200_000),
  modelRankTopN: num("MODEL_RANK_TOP_N", 3),
  llmRateLimitPerMinute: num("LLM_RATE_LIMIT_PER_MINUTE", 20),
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
