import { workerEnv } from "./env";
import { llmError, type LlmErrorCode } from "./errors";
import { extractJson, geminiProvider, type LlmProvider } from "./gemini";
import { openaiProvider } from "./openai";
import { fenceUntrusted, renderPrompt, screenUntrusted } from "./guardrails";
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
const dailyWindow = { key: "", count: 0 };

function consumeBudgetMemory(now: number): void {
  const minuteKey = Math.floor(now / MINUTE_MS) * MINUTE_MS;
  if (minuteWindow.key !== minuteKey) {
    minuteWindow.key = minuteKey;
    minuteWindow.count = 0;
  }
  if (minuteWindow.count >= workerEnv.llmRateLimitPerMinute) {
    throw llmError("llm_budget_exceeded", "llm_budget_exceeded: per-minute LLM rate limit hit");
  }
  const dayKey = new Date(now).toISOString().slice(0, 10);
  if (dailyWindow.key !== dayKey) {
    dailyWindow.key = dayKey;
    dailyWindow.count = 0;
  }
  if (dailyWindow.count >= workerEnv.llmDailyBudget) {
    throw llmError("llm_budget_exceeded", "llm_budget_exceeded: daily LLM budget hit");
  }
  minuteWindow.count += 1;
  dailyWindow.count += 1;
}

async function consumeBudgetRedis(now: number): Promise<void> {
  const redis = getWorkerRedis();
  if (!redis) {
    consumeBudgetMemory(now);
    return;
  }
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const minuteBucket = Math.floor(now / MINUTE_MS);
    const rateKey = `llm:rate:${minuteBucket}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) {
      await redis.expire(rateKey, RATE_TTL_SECONDS);
    }
    if (rateCount > workerEnv.llmRateLimitPerMinute) {
      throw llmError("llm_budget_exceeded", "llm_budget_exceeded: per-minute LLM rate limit hit");
    }

    const dayKey = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
    const budgetKey = `llm:budget:${dayKey}`;
    const budgetCount = await redis.incr(budgetKey);
    if (budgetCount === 1) {
      await redis.expire(budgetKey, BUDGET_TTL_SECONDS);
    }
    if (budgetCount > workerEnv.llmDailyBudget) {
      throw llmError("llm_budget_exceeded", "llm_budget_exceeded: daily LLM budget hit");
    }
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) throw err;
    throw llmError(
      "llm_budget_exceeded",
      "llm_budget_exceeded: redis budget check failed",
    );
  }
}

/** Shared Redis fixed-window budgets when REDIS_URL is set; otherwise in-process (tests). */
export async function consumeBudget(now: number = Date.now()): Promise<void> {
  if (workerEnv.redisUrl) {
    await consumeBudgetRedis(now);
    return;
  }
  consumeBudgetMemory(now);
}

export function resetBudgetForTests(): void {
  minuteWindow.key = 0;
  minuteWindow.count = 0;
  dailyWindow.key = "";
  dailyWindow.count = 0;
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
  screenUntrusted(user);
  const providers = providerOrder();
  if (providers.length === 0) {
    throw llmError("llm_unavailable", "llm_unavailable: no provider API key configured");
  }
  await consumeBudget();
  const guardedSystem = `${system}\n\n${renderPrompt("guardrail.system")}`;
  const fencedUser = fenceUntrusted(user);
  const index = Math.max(0, opts.attempt ?? 0);
  let lastError: unknown;
  for (const provider of providers) {
    const rank = rankFor(provider.name);
    const model = rank[index] ?? provider.defaultModel();
    try {
      const text = await provider.complete({
        system: guardedSystem,
        user: fencedUser,
        model,
        temperature: opts.temperature,
        grounding: opts.grounding,
      });
      return requireJsonShape<T>(extractJson(text), opts.requiredKeys ?? []);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? llmError("llm_unavailable", "llm_unavailable: no provider attempt ran");
}

export type { LlmErrorCode };
