import { llmError } from "./errors";
import { logInfo, logWarn } from "./log";
import { getWorkerRedis } from "./redis";

/**
 * Provider circuit breaker (§9): healthy / open / half_open / disabled.
 * Authentication and billing failures open the circuit for hours; transient
 * 429/5xx failures use exponential backoff with a single half-open probe per
 * cooldown. State lives in Redis (shared across worker processes) with an
 * in-process fallback for tests and memory-only mode.
 */
export type CircuitState = "healthy" | "open" | "half_open";

export type ProviderErrorClass =
  | "authentication"
  | "billing"
  | "rate_limit"
  | "transient"
  | "budget"
  | "policy"
  | "invalid_response";

const AUTH_OPEN_MS = Number(process.env.CIRCUIT_AUTH_OPEN_MS ?? 6 * 3_600_000);
const HALF_OPEN_PROBE_TTL_S = Number(process.env.CIRCUIT_HALF_OPEN_COOLDOWN_MS ?? 60_000) / 1000;
const TRANSIENT_BASE_MS = 30_000;
const TRANSIENT_MAX_MS = 3_600_000;

interface CircuitMemoryState {
  state: CircuitState;
  openUntil: number;
  attempt: number;
}

interface CircuitRecord {
  state: CircuitState;
  openUntil: number;
  attempt: number;
}

const memory = new Map<string, CircuitMemoryState>();
const probeMemo = new Set<string>();

/** Classify a provider error message into a normalized error class (§11). */
export function classifyProviderError(err: unknown): ProviderErrorClass {
  const message = err instanceof Error ? `${err.message}` : String(err ?? "");
  if (/\b(401|403)\b|unauthori[sz]ed|invalid api key|api key not valid|permission denied/i.test(message)) {
    return "authentication";
  }
  if (/billing|credit|insufficient|quota project|exceeded your current quota|plan|purchase/i.test(message)) {
    return "billing";
  }
  if (/\b429\b|rate limit|resource.?has.?been.?exhausted|high demand|overloaded/i.test(message)) {
    return "rate_limit";
  }
  if (/\b(500|502|503|504)\b|timeout|network|fetch failed|ECONNREFUSED|ENOTFOUND/i.test(message)) {
    return "transient";
  }
  if (/budget_exceeded/i.test(message)) return "budget";
  if (/guardrail|policy/i.test(message)) return "policy";
  return "invalid_response";
}

function isHardFailure(cls: ProviderErrorClass): boolean {
  return cls === "authentication" || cls === "billing";
}

function nextOpenUntil(cls: ProviderErrorClass, attempt: number, now: number): number {
  if (isHardFailure(cls)) return now + AUTH_OPEN_MS;
  if (cls === "budget" || cls === "policy" || cls === "invalid_response") return 0;
  const backoff = Math.min(TRANSIENT_BASE_MS * 2 ** Math.max(0, attempt), TRANSIENT_MAX_MS);
  return now + backoff;
}

function readMemory(key: string): CircuitMemoryState | null {
  return memory.get(key) ?? null;
}

function writeMemory(key: string, rec: CircuitRecord): void {
  memory.set(key, { ...rec });
}

async function readRedis(key: string): Promise<CircuitRecord | null> {
  const redis = getWorkerRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(`circuit:${key}`);
    return raw ? (JSON.parse(raw) as CircuitRecord) : null;
  } catch {
    return null;
  }
}

async function writeRedis(key: string, rec: CircuitRecord): Promise<void> {
  const redis = getWorkerRedis();
  if (!redis) return;
  try {
    await redis.set(`circuit:${key}`, JSON.stringify(rec));
  } catch {
    // Circuit state is best effort; in-process state remains.
  }
}

async function acquireProbe(key: string): Promise<boolean> {
  const redis = getWorkerRedis();
  if (!redis) {
    if (probeMemo.has(key)) return false;
    probeMemo.add(key);
    setTimeout(() => probeMemo.delete(key), HALF_OPEN_PROBE_TTL_S * 1000).unref?.();
    return true;
  }
  try {
    const ok = await redis.set(`circuit:probe:${key}`, "1", "EX", Math.max(1, Math.ceil(HALF_OPEN_PROBE_TTL_S)), "NX");
    return ok === "OK";
  } catch {
    return true; // Redis failure must not wedge the pipeline.
  }
}

async function clearProbe(key: string): Promise<void> {
  const redis = getWorkerRedis();
  probeMemo.delete(key);
  if (!redis) return;
  try {
    await redis.del(`circuit:probe:${key}`);
  } catch {
    // best effort
  }
}

export async function resetCircuitsForTests(): Promise<void> {
  memory.clear();
  probeMemo.clear();
}

/**
 * Guard before a provider attempt: throws llm_unavailable when the circuit is
 * open. A half_open circuit admits exactly one probe per cooldown.
 */
export async function circuitGuard(capability: string, now: number = Date.now()): Promise<void> {
  const rec =
    (await readRedis(capability)) ??
    readMemory(capability) ??
    ({ state: "healthy", openUntil: 0, attempt: 0 } as CircuitRecord);
  const stillOpen =
    (rec.state === "open" || rec.state === "half_open") && rec.openUntil > now;
  if (stillOpen) {
    throw llmError("llm_unavailable", `circuit open: ${capability} (${rec.state} until ${new Date(rec.openUntil).toISOString()})`);
  }
  if (rec.state === "half_open" && rec.openUntil <= now) {
    // Cooldown elapsed: keep broken circuit entry but require a fresh probe.
    if (!(await acquireProbe(capability))) {
      throw llmError("llm_unavailable", `circuit probe in flight: ${capability}`);
    }
    return;
  }
  if (rec.state === "open") {
    // Cooldown expired: transition to half_open with a probe.
    if (!(await acquireProbe(capability))) {
      throw llmError("llm_unavailable", `circuit probe in flight: ${capability}`);
    }
    const next: CircuitRecord = { state: "half_open", openUntil: 0, attempt: rec.attempt };
    writeRedis(capability, next);
    writeMemory(capability, next);
    return;
  }
}

export async function circuitRecordSuccess(capability: string): Promise<void> {
  await clearProbe(capability);
  const prev = memory.get(capability);
  if (prev && prev.state !== "healthy") {
    logInfo("provider circuit recovered", {
      capability,
      event: "circuit_closed",
      outcome: "ok",
      attemptsBeforeRecovery: prev.attempt,
    });
  }
  const rec: CircuitRecord = { state: "healthy", openUntil: 0, attempt: 0 };
  writeMemory(capability, rec);
  await writeRedis(capability, rec);
}

export async function circuitRecordFailure(
  capability: string,
  err: unknown,
  now: number = Date.now(),
): Promise<void> {
  const cls = classifyProviderError(err);
  const prev =
    (await readRedis(capability)) ??
    readMemory(capability) ??
    ({ state: "healthy", openUntil: 0, attempt: 0 } as CircuitRecord);
  const attempt = prev.state === "healthy" ? 0 : prev.attempt + 1;
  const openUntil = nextOpenUntil(cls, attempt, now);
  if (openUntil > now) {
    const rec: CircuitRecord = { state: "open", openUntil, attempt };
    writeMemory(capability, rec);
    await writeRedis(capability, rec);
    logWarn("provider circuit opened", {
      capability,
      event: "circuit_opened",
      outcome: "fail",
      errorClass: cls,
      attempt,
      reopenUntil: new Date(openUntil).toISOString(),
    });
    return;
  }
  await clearProbe(capability);
}

/** Sanitized provider-health snapshot for readiness endpoints / logs. */
export async function circuitHealth(capability: string): Promise<CircuitRecord> {
  return (
    (await readRedis(capability)) ??
    readMemory(capability) ??
    ({ state: "healthy", openUntil: 0, attempt: 0 } as CircuitRecord)
  );
}
