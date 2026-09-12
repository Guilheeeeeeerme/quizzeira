import { workerEnv } from "./env";
import { llmError, type LlmErrorCode } from "./errors";
import { extractJson, geminiProvider, type LlmProvider } from "./gemini";
import { openaiProvider } from "./openai";
import {
  fenceUntrusted,
  neutralizeUntrusted,
  renderPrompt,
  screenUntrusted,
} from "./guardrails";
import { rankFor } from "./model-rank";
import { getWorkerRedis, resetWorkerRedisForTests } from "./redis";

const PROVIDERS: Record<string, LlmProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
};

export interface GenerateJsonOptions {
  temperature?: number;
  attempt?: number;
  requiredKeys?: readonly string[];
  grounding?: boolean;
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
  for (const raw of workerEnv.llmProviderOrder.split(",")) {
    const name = raw.trim().toLowerCase();
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

export async function generateJson<T>(
  system: string,
  user: string,
  opts: GenerateJsonOptions = {},
): Promise<T> {
  // Neutralize first so invisible-character obfuscation cannot carry a payload
  // past the policy screen (OWASP LLM01 encoding axis).
  const cleanUser = neutralizeUntrusted(user);
  screenUntrusted(cleanUser);
  const providers = providerOrder();
  if (providers.length === 0) {
    throw llmError("llm_unavailable", "llm_unavailable: no provider API key configured");
  }
  const guardedSystem = `${system}\n\n${renderPrompt("guardrail.system")}`;
  const fencedUser = fenceUntrusted(cleanUser);
  const index = Math.max(0, opts.attempt ?? 0);
  let lastError: unknown;
  for (const provider of providers) {
    // Every failover attempt is a separate billable call, so charge each one
    // rather than the request as a whole (OWASP LLM06).
    await consumeBudget(Date.now(), { calls: 1 });
    const rank = rankFor(provider.name);
    const model = rank[index] ?? provider.defaultModel();
    try {
      const completion = await provider.complete({
        system: guardedSystem,
        user: fencedUser,
        model,
        temperature: opts.temperature,
        grounding: opts.grounding,
      });
      await consumeBudget(Date.now(), {
        tokens: Math.max(1, completion.usage.totalTokens),
        calls: 0,
      });
      return requireJsonShape<T>(extractJson(completion.text), opts.requiredKeys ?? []);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? llmError("llm_unavailable", "llm_unavailable: no provider attempt ran");
}

export type { LlmErrorCode };
