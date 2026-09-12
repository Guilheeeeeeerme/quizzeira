import { workerEnv } from "./env";
import { llmError, type LlmErrorCode } from "./errors";
import { extractJson, geminiProvider, type LlmProvider } from "./gemini";
import { openaiProvider } from "./openai";
import { fixtureProvider } from "./providers/fixture";
import { fenceUntrusted, renderPrompt, screenUntrusted } from "./guardrails";
import { rankFor, rankForTier } from "./model-rank";
import { getWorkerRedis, resetWorkerRedisForTests } from "./redis";

const PROVIDERS: Record<string, LlmProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  fixture: fixtureProvider,
};

export interface GenerateJsonOptions {
  temperature?: number;
  attempt?: number;
  requiredKeys?: readonly string[];
  grounding?: boolean;
  /** Model tier preference (§27.2). */
  tier?: "cheap" | "mid" | "strong";
  /** Stage key for per-stage token budgets (§27.4). */
  stage?: "ku" | "generation" | "judge" | "residue" | "classify" | "mapping";
  /** Optional Redis cache key; hits skip the provider call. */
  cacheKey?: string;
}

export function requireJsonShape<T>(
  value: unknown,
  requiredKeys: readonly string[],
): T {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw llmError("llm_shape", "model response is not a JSON object");
  }
  const record = value as Record<string, unknown>;
  for (const key of requiredKeys) {
    const field = record[key];
    if (field === undefined || field === null) {
      throw llmError("llm_shape", `model response missing key: ${key}`);
    }
  }
  return record as T;
}

function providerOrder(): LlmProvider[] {
  const seen = new Set<LlmProvider>();
  const names: string[] = [];
  // Prefer explicit LLM_PROVIDER=fixture for deterministic CI / compose (§41.3).
  if ((process.env.LLM_PROVIDER ?? "").trim().toLowerCase() === "fixture") {
    names.push("fixture");
  }
  for (const raw of (process.env.LLM_PROVIDER_ORDER || workerEnv.llmProviderOrder).split(",")) {
    const name = raw.trim().toLowerCase();
    if (name) names.push(name);
  }
  for (const name of names) {
    const provider = PROVIDERS[name];
    if (provider && !seen.has(provider)) seen.add(provider);
  }
  return [...seen].filter((provider) => provider.available());
}

const MINUTE_MS = 60_000;
const RATE_TTL_SECONDS = 120;
const BUDGET_TTL_SECONDS = 172_800;
const minuteWindow = { key: 0, count: 0 };
const dailyWindow = { key: "", count: 0, tokens: 0 };

function assertRedisOrTestMode(): void {
  if (workerEnv.redisUrl) return;
  if (workerEnv.allowMemoryBudget) return;
  throw llmError(
    "llm_budget_exceeded",
    "llm_budget_exceeded: REDIS_URL required for shared LLM budgets",
  );
}

function consumeBudgetMemory(now: number, opts: { tokens?: number; calls?: number } = {}): void {
  const tokens = opts.tokens ?? 0;
  const calls = opts.calls ?? 0;
  const minuteKey = Math.floor(now / MINUTE_MS) * MINUTE_MS;
  if (minuteWindow.key !== minuteKey) {
    minuteWindow.key = minuteKey;
    minuteWindow.count = 0;
  }
  if (calls > 0 && minuteWindow.count + calls > workerEnv.llmRateLimitPerMinute) {
    throw llmError("llm_budget_exceeded", "llm_budget_exceeded: per-minute LLM rate limit hit");
  }
  const dayKey = new Date(now).toISOString().slice(0, 10);
  if (dailyWindow.key !== dayKey) {
    dailyWindow.key = dayKey;
    dailyWindow.count = 0;
    dailyWindow.tokens = 0;
  }
  if (calls > 0 && dailyWindow.count + calls > workerEnv.llmDailyBudget) {
    throw llmError("llm_budget_exceeded", "llm_budget_exceeded: daily LLM budget hit");
  }
  if (tokens > 0 && dailyWindow.tokens + tokens > workerEnv.llmDailyTokenBudget) {
    throw llmError("llm_budget_exceeded", "llm_budget_exceeded: daily LLM token budget hit");
  }
  minuteWindow.count += calls;
  dailyWindow.count += calls;
  dailyWindow.tokens += tokens;
}

async function consumeBudgetRedis(
  now: number,
  opts: { tokens?: number; calls?: number } = {},
): Promise<void> {
  const tokens = opts.tokens ?? 0;
  const calls = opts.calls ?? 0;
  const redis = getWorkerRedis();
  if (!redis) {
    consumeBudgetMemory(now, opts);
    return;
  }
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const dayKey = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");

    if (calls > 0) {
      const minuteBucket = Math.floor(now / MINUTE_MS);
      const rateKey = `llm:rate:${minuteBucket}`;
      const rateCount = await redis.incrby(rateKey, calls);
      if (rateCount === calls) {
        await redis.expire(rateKey, RATE_TTL_SECONDS);
      }
      if (rateCount > workerEnv.llmRateLimitPerMinute) {
        throw llmError("llm_budget_exceeded", "llm_budget_exceeded: per-minute LLM rate limit hit");
      }

      const budgetKey = `llm:budget:${dayKey}`;
      const budgetCount = await redis.incrby(budgetKey, calls);
      if (budgetCount === calls) {
        await redis.expire(budgetKey, BUDGET_TTL_SECONDS);
      }
      if (budgetCount > workerEnv.llmDailyBudget) {
        throw llmError("llm_budget_exceeded", "llm_budget_exceeded: daily LLM budget hit");
      }
    }

    if (tokens > 0) {
      const tokenKey = `llm:tokens:${dayKey}`;
      const tokenCount = await redis.incrby(tokenKey, tokens);
      if (tokenCount === tokens) {
        await redis.expire(tokenKey, BUDGET_TTL_SECONDS);
      }
      if (tokenCount > workerEnv.llmDailyTokenBudget) {
        throw llmError("llm_budget_exceeded", "llm_budget_exceeded: daily LLM token budget hit");
      }
    }
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) throw err;
    throw llmError(
      "llm_budget_exceeded",
      "llm_budget_exceeded: redis budget check failed",
    );
  }
}

/** Call-count and/or token accounting. Redis required outside tests. */
export async function consumeBudget(
  now: number = Date.now(),
  opts: { tokens?: number; calls?: number } = { calls: 1 },
): Promise<void> {
  assertRedisOrTestMode();
  if (workerEnv.redisUrl) {
    await consumeBudgetRedis(now, opts);
    return;
  }
  consumeBudgetMemory(now, opts);
}

export function resetBudgetForTests(): void {
  minuteWindow.key = 0;
  minuteWindow.count = 0;
  dailyWindow.key = "";
  dailyWindow.count = 0;
  dailyWindow.tokens = 0;
  void resetWorkerRedisForTests();
}

export function hasLlmProvider(): boolean {
  return providerOrder().length > 0;
}

function stageBudgetCap(stage: GenerateJsonOptions["stage"]): number {
  switch (stage) {
    case "ku":
      return workerEnv.llmBudgetKuTokens;
    case "generation":
      return workerEnv.llmBudgetGenerationTokens;
    case "judge":
      return workerEnv.llmBudgetJudgeTokens;
    case "residue":
    case "classify":
    case "mapping":
      return workerEnv.llmBudgetResidueTokens;
    default:
      return 0;
  }
}

async function readCache(cacheKey: string): Promise<unknown | null> {
  if (!workerEnv.redisUrl) return null;
  try {
    const redis = getWorkerRedis();
    if (!redis) return null;
    const raw = await redis.get(`llm:cache:${cacheKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function writeCache(cacheKey: string, value: unknown): Promise<void> {
  if (!workerEnv.redisUrl) return;
  try {
    const redis = getWorkerRedis();
    if (!redis) return;
    const ttl = Math.max(1, workerEnv.llmCacheTtlDays) * 86_400;
    await redis.set(`llm:cache:${cacheKey}`, JSON.stringify(value), "EX", ttl);
  } catch {
    // Cache is best-effort.
  }
}

async function consumeStageBudget(stage: GenerateJsonOptions["stage"], tokens: number): Promise<void> {
  const cap = stageBudgetCap(stage);
  if (!cap || !stage) return;
  assertRedisOrTestMode();
  if (!workerEnv.redisUrl) return;
  const redis = getWorkerRedis();
  if (!redis) return;
  const day = new Date().toISOString().slice(0, 10);
  const key = `llm:stage:${stage}:${day}`;
  const used = Number((await redis.incrby(key, tokens)) || 0);
  await redis.expire(key, BUDGET_TTL_SECONDS);
  if (used > cap) {
    throw llmError(
      "llm_budget_exceeded",
      `llm_budget_exceeded: stage ${stage} daily token budget hit`,
    );
  }
}

export async function generateJson<T>(
  system: string,
  user: string,
  opts: GenerateJsonOptions = {},
): Promise<T> {
  screenUntrusted(user);
  const providers = providerOrder();
  if (providers.length === 0) {
    throw llmError("llm_unavailable", "llm_unavailable: no provider API key configured");
  }

  if (opts.cacheKey) {
    const cached = await readCache(opts.cacheKey);
    if (cached != null) {
      return requireJsonShape<T>(cached, opts.requiredKeys ?? []);
    }
  }

  await consumeBudget(Date.now(), { calls: 1 });
  const guardedSystem = `${system}\n\n${renderPrompt("guardrail.system")}`;
  const fencedUser = fenceUntrusted(user);
  const index = Math.max(0, opts.attempt ?? 0);
  let lastError: unknown;
  for (const provider of providers) {
    const rank = opts.tier
      ? rankForTier(provider.name, opts.tier)
      : rankFor(provider.name);
    const model = rank[index] ?? provider.defaultModel();
    try {
      const completion = await provider.complete({
        system: guardedSystem,
        user: fencedUser,
        model,
        temperature: opts.temperature,
        grounding: opts.grounding,
      });
      const tokens = Math.max(1, completion.usage.totalTokens);
      await consumeBudget(Date.now(), { tokens, calls: 0 });
      await consumeStageBudget(opts.stage, tokens);
      const shaped = requireJsonShape<T>(extractJson(completion.text), opts.requiredKeys ?? []);
      if (opts.cacheKey) await writeCache(opts.cacheKey, shaped);
      return shaped;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? llmError("llm_unavailable", "llm_unavailable: no provider attempt ran");
}

export type { LlmErrorCode };
