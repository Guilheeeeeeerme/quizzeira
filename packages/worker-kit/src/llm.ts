import { workerEnv } from "./env";
import { llmError, type LlmErrorCode } from "./errors";
import { extractJson, geminiProvider, type LlmProvider } from "./gemini";
import { openaiProvider } from "./openai";
import { fenceUntrusted, renderPrompt, screenUntrusted } from "./guardrails";
import { rankFor } from "./model-rank";

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
const minuteWindow = { key: 0, count: 0 };
const dailyWindow = { key: "", count: 0 };

export function consumeBudget(now: number = Date.now()): void {
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

export function resetBudgetForTests(): void {
  minuteWindow.key = 0;
  minuteWindow.count = 0;
  dailyWindow.key = "";
  dailyWindow.count = 0;
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
  consumeBudget();
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
