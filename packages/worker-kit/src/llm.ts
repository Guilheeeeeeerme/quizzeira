import { workerEnv } from "./env";
import { llmError, llmErrorCode, type LlmErrorCode } from "./errors";
import { extractJson, geminiProvider, type LlmProvider } from "./gemini";
import { fixtureProvider } from "./providers/fixture";
import {
  fenceUntrusted,
  neutralizeUntrusted,
  renderPrompt,
  screenUntrusted,
} from "./guardrails";
import { getWorkerRedis, resetWorkerRedisForTests } from "./redis";
import { circuitGuard, circuitRecordFailure, circuitRecordSuccess } from "./circuit";

/**
 * Generation owners. Stack is Gemini (+ fixture in CI) and JEV for typed
 * decisions. Exactly one provider owns a `generateJson` call and uses the
 * pinned env model (`GEMINI_MODEL` / fixture) — no models.list discovery,
 * no cross-model failover. Unknown names in LLM_PROVIDER_ORDER are ignored.
 */
const PROVIDERS: Record<string, LlmProvider> = {
  gemini: geminiProvider,
  fixture: fixtureProvider,
};

export interface GenerateJsonOptions {
  temperature?: number;
  /** @deprecated Ignored — model is always `GEMINI_MODEL` / fixture. */
  attempt?: number;
  requiredKeys?: readonly string[];
  grounding?: boolean;
  /** @deprecated Ignored — model is always `GEMINI_MODEL` / fixture. */
  tier?: "cheap" | "mid" | "strong";
  /** Stage key for per-stage token budgets (§27.4). */
  stage?: "ku" | "generation" | "judge" | "residue" | "classify" | "mapping" | "corrector";
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

/**
 * Resolve the single generation owner. `fixture` wins when explicitly selected
 * (LLM_PROVIDER=fixture or listed in LLM_PROVIDER_ORDER, §41.3); otherwise
 * Gemini when its key is present. Returns an empty list when nothing is
 * configured so readiness can report `no_configured_provider`.
 */
function providerOrder(): LlmProvider[] {
  const names: string[] = [];
  if ((process.env.LLM_PROVIDER ?? "").trim().toLowerCase() === "fixture") {
    names.push("fixture");
  }
  for (const raw of (process.env.LLM_PROVIDER_ORDER || workerEnv.llmProviderOrder).split(",")) {
    const name = raw.trim().toLowerCase();
    if (name) names.push(name);
  }
  const fixture = names.includes("fixture") ? PROVIDERS.fixture : null;
  if (fixture && fixture.available()) return [fixture];
  const gemini = PROVIDERS.gemini;
  return gemini.available() ? [gemini] : [];
}

/** Name of the generation owner, for logs/readiness. */
export function generationOwner(): "gemini" | "fixture" | null {
  return providerOrder()[0]?.name ?? null;
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
  // Pre-check so rejected attempts never increment the counters (§9).
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

const BUDGET_RESERVE_LUA = `
local cur = tonumber(redis.call('GET', KEYS[1]) or '0') or 0
local cap = tonumber(ARGV[1])
local n = tonumber(ARGV[2])
if n <= 0 then return cur end
if cap > 0 and cur + n > cap then return -1 end
return redis.call('INCRBY', KEYS[1], n)
`;

/**
 * Atomic reservation: check-then-increment under a cap in one Redis step.
 * A cap-rejected reservation returns -1 without incrementing, so failed
 * attempts stop consuming the budget instead of burning the counter (§9).
 */
async function reserveBudgetKeyspace(
  keys: Array<{ key: string; cap: number; amount: number; ttl: number }>,
): Promise<void> {
  const redis = getWorkerRedis();
  if (!redis) {
    consumeBudgetMemory(Date.now(), { calls: keys.find((k) => k.cap > 0 && k.amount > 0) ? 1 : 0 });
    return;
  }
  try {
    for (const slot of keys) {
      if (slot.amount <= 0) continue;
      const result = (await redis.eval(
        BUDGET_RESERVE_LUA,
        1,
        slot.key,
        String(slot.cap),
        String(slot.amount),
      )) as number;
      if (result === -1) {
        const name =
          slot.key.startsWith("llm:rate")
            ? "per-minute rate limit"
            : slot.key.startsWith("llm:tokens")
              ? "daily token budget"
              : "daily LLM budget";
        // Reservation rejected: no counter was incremented.
        throw llmError(
          "llm_budget_exceeded",
          `llm_budget_exceeded: ${name} hit (non-incrementing)`,
        );
      }
      if (result === slot.amount) {
        await redis.expire(slot.key, slot.ttl);
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

/**
 * Reserve `amount` on a Redis counter under `cap` (non-incrementing on reject).
 * Falls back to an in-process window when Redis is absent (tests / memory
 * mode). Used by the JEV shadow headroom caps (`jev.ts`).
 */
const memoryCounters = new Map<string, number>();
export async function reserveCounter(
  key: string,
  cap: number,
  amount: number,
  ttlSeconds: number,
): Promise<boolean> {
  if (cap <= 0 || amount <= 0) return true;
  assertRedisOrTestMode();
  const redis = workerEnv.redisUrl ? getWorkerRedis() : null;
  if (!redis) {
    const cur = memoryCounters.get(key) ?? 0;
    if (cur + amount > cap) return false;
    memoryCounters.set(key, cur + amount);
    return true;
  }
  const result = (await redis.eval(BUDGET_RESERVE_LUA, 1, key, String(cap), String(amount))) as number;
  if (result === -1) return false;
  if (result === amount) await redis.expire(key, ttlSeconds);
  return true;
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
  const dayKey = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  const minuteBucket = Math.floor(now / MINUTE_MS);
  await reserveBudgetKeyspace([
    { key: `llm:rate:${minuteBucket}`, cap: workerEnv.llmRateLimitPerMinute, amount: calls, ttl: RATE_TTL_SECONDS },
    { key: `llm:budget:${dayKey}`, cap: workerEnv.llmDailyBudget, amount: calls, ttl: BUDGET_TTL_SECONDS },
    { key: `llm:tokens:${dayKey}`, cap: workerEnv.llmDailyTokenBudget, amount: tokens, ttl: BUDGET_TTL_SECONDS },
  ]);
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
  resetStageRateLimitsForTests();
  memoryCounters.clear();
  void resetWorkerRedisForTests();
}

export function hasLlmProvider(): boolean {
  return providerOrder().length > 0;
}

/** Configured + available provider names, in attempt order (§9 readiness). */
export function configuredProviderNames(): string[] {
  return providerOrder().map((provider) => provider.name);
}

/** Per-stage per-minute call ceiling (§9). 0 = no independent stage ceiling. */
function stageRateLimitCap(stage: GenerateJsonOptions["stage"]): number {
  switch (stage) {
    case "generation":
      return workerEnv.llmRateLimitGenerationPerMinute;
    case "judge":
      return workerEnv.llmRateLimitJudgePerMinute;
    default:
      return 0;
  }
}

const stageMinuteWindows = new Map<string, { key: number; count: number }>();

function consumeStageRateLimitMemory(stage: string, minuteBucket: number, cap: number): void {
  const window = stageMinuteWindows.get(stage) ?? { key: minuteBucket, count: 0 };
  if (window.key !== minuteBucket) {
    window.key = minuteBucket;
    window.count = 0;
  }
  if (window.count + 1 > cap) {
    throw llmError("llm_budget_exceeded", `llm_budget_exceeded: per-minute ${stage} rate limit hit`);
  }
  window.count += 1;
  stageMinuteWindows.set(stage, window);
}

/**
 * Independent per-stage per-minute throttle (§9): "at most one generation
 * batch and one judge item per minute". This is on top of, not instead of,
 * the global `llm:rate:*` limiter above — a burst of cheaper-stage calls
 * (ku/classify/residue/mapping) must never crowd out that minute's
 * generation/judge slot by exhausting the shared counter first.
 */
export async function consumeStageRateLimit(
  stage: GenerateJsonOptions["stage"],
  now: number = Date.now(),
): Promise<void> {
  const cap = stageRateLimitCap(stage);
  if (!cap || !stage) return;
  assertRedisOrTestMode();
  const minuteBucket = Math.floor(now / MINUTE_MS);
  if (!workerEnv.redisUrl) {
    consumeStageRateLimitMemory(stage, minuteBucket, cap);
    return;
  }
  const redis = getWorkerRedis();
  if (!redis) {
    consumeStageRateLimitMemory(stage, minuteBucket, cap);
    return;
  }
  const key = `llm:staterate:${stage}:${minuteBucket}`;
  const result = (await redis.eval(BUDGET_RESERVE_LUA, 1, key, String(cap), "1")) as number;
  if (result === -1) {
    throw llmError(
      "llm_budget_exceeded",
      `llm_budget_exceeded: per-minute ${stage} rate limit hit (non-incrementing)`,
    );
  }
  if (result === 1) await redis.expire(key, RATE_TTL_SECONDS);
}

export function resetStageRateLimitsForTests(): void {
  stageMinuteWindows.clear();
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

export async function consumeStageBudget(stage: GenerateJsonOptions["stage"], tokens: number): Promise<void> {
  const cap = stageBudgetCap(stage);
  if (!cap || !stage) return;
  assertRedisOrTestMode();
  if (!workerEnv.redisUrl) return;
  const redis = getWorkerRedis();
  if (!redis) return;
  const day = new Date().toISOString().slice(0, 10);
  const key = `llm:stage:${stage}:${day}`;
  const result = (await redis.eval(
    BUDGET_RESERVE_LUA,
    1,
    key,
    String(cap),
    String(tokens),
  )) as number;
  if (result === -1) {
    throw llmError(
      "llm_budget_exceeded",
      `llm_budget_exceeded: stage ${stage} daily token budget hit (non-incrementing)`,
    );
  }
  if (result === tokens) {
    await redis.expire(key, BUDGET_TTL_SECONDS);
  }
}

/** Used by circuit classification; Gemini no longer fails over across model ids. */
export function isTransientProviderError(err: unknown): boolean {
  const code = llmErrorCode(err);
  if (code === "llm_budget_exceeded" || code === "guardrail_block" || code === "llm_shape") return false;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /\b(429|503)\b|high demand|overloaded|rate limit|no longer available|not found for api version|is not enabled for|not supported for this model|does not support/i.test(msg);
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
  // Exactly one owner (Gemini, or fixture in CI). Pinned env model only.
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

  // One reservation per generateJson call (§9 stage ceilings).
  await consumeStageRateLimit(opts.stage);

  const guardedSystem = `${system}\n\n${renderPrompt("guardrail.system")}`;
  const fencedUser = fenceUntrusted(cleanUser);
  let lastError: unknown;
  let circuitTripped: string | null = null;
  for (const provider of providers) {
    // Circuit guard (§9): an open provider is skipped instead of retried into
    // a wall of rejected attempts; one probe per cooldown when half-open.
    try {
      await circuitGuard(provider.name);
    } catch (guardErr) {
      circuitTripped = circuitTripped ?? String((guardErr as Error).message ?? "circuit open");
      continue;
    }
    const model = provider.defaultModel();
    await consumeBudget(Date.now(), { calls: 1 });
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
      await circuitRecordSuccess(provider.name);
      const shaped = requireJsonShape<T>(extractJson(completion.text), opts.requiredKeys ?? []);
      if (opts.cacheKey) await writeCache(opts.cacheKey, shaped);
      return shaped;
    } catch (err) {
      lastError = err;
      await circuitRecordFailure(provider.name, err);
    }
  }
  if (lastError == null && circuitTripped) {
    throw llmError("llm_unavailable", circuitTripped);
  }
  throw lastError ?? llmError("llm_unavailable", "llm_unavailable: no provider attempt ran");
}

export type { LlmErrorCode };
