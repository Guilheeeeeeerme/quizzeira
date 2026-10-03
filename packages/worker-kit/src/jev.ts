// Concept: JEV (TypeSafe) typed-decision adapter — Choice / Score questions
// over an explicit state. Owns closed decisions (classify T3 role, mapping T3
// leaf, judge scores + answerIndex) under staged authority off|shadow|active.
// Direct transport to TypeSafe (`POST /v1/systemone`), never via Headroom,
// never through an OpenAI-compatible SDK. Reference: https://docs.typesafe.ai/api
import { workerEnv, type JevMode } from "./env";
import { llmError, type LlmErrorCode } from "./errors";
import {
  consumeBudget,
  consumeStageBudget,
  consumeStageRateLimit,
  reserveCounter,
  type GenerateJsonOptions,
} from "./llm";
import { circuitGuard, circuitRecordFailure, circuitRecordSuccess } from "./circuit";
import { logInfo, logWarn } from "./log";

export type JevTask = "classify" | "mapping" | "judge";
export const JEV_TASKS: readonly JevTask[] = ["classify", "mapping", "judge"];

export interface JevChoiceQuestion {
  type: "choice";
  instructions: string;
  /** option → description (null allowed by the API; max 255 options). */
  criteria: Record<string, string | null>;
}

export interface JevScoreQuestion {
  type: "score";
  instructions: string;
  /** Ordered level descriptions, 2..10. The answer is a probability-weighted level index. */
  criteria: readonly string[];
}

export type JevQuestion = JevChoiceQuestion | JevScoreQuestion;

export interface JevChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface JevScoreAnswer {
  type: "score";
  /** Raw probability-weighted level index in [0, levels-1]. */
  score: number;
  /** `score / (levels - 1)` → 0..1 for rubric fields. */
  normalized: number;
  levels: number;
  probabilities: Record<string, number>;
  confidence: number;
}

export type JevAnswer = JevChoiceAnswer | JevScoreAnswer;

export type JevAnswersFor<Q extends Record<string, JevQuestion>> = {
  [K in keyof Q]: NonNullable<Q[K]> extends JevChoiceQuestion ? JevChoiceAnswer : JevScoreAnswer;
};

export interface JevUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Call metadata for logs/metrics — never payloads (audit plan §7). */
export interface JevCallMetadata {
  task: JevTask;
  provider: "jev";
  mode: JevMode;
  requestedModel: string;
  returnedModel: string | null;
  durationMs: number;
  attempts: number;
  usage: JevUsage | null;
  /** List-price estimate; TypeSafe does not return billed dollars. */
  estimatedUsd: number | null;
  costStatus: "estimated" | "unknown";
  errorCode: string | null;
}

export interface JevDecision<Q extends Record<string, JevQuestion>> {
  answers: JevAnswersFor<Q>;
  meta: JevCallMetadata;
}

export interface JevRequest<Q extends Record<string, JevQuestion>> {
  task: JevTask;
  state: unknown;
  questions: Q;
  /** Overrides the task's configured mode (tests / explicit callers). */
  mode?: JevMode;
}

export interface JevDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export type JevTypedError = Error & {
  code: LlmErrorCode;
  provider: "jev";
  task: JevTask;
  status: number | null;
  attempts: number;
};

/** Dated list price (USD per million input tokens); output is free. */
export const JEV_INPUT_USD_PER_MILLION = 0.042;
const DISTRIBUTION_TOLERANCE = 1e-3;
const MAX_CHOICE_OPTIONS = 255;
const MIN_SCORE_LEVELS = 2;
const MAX_SCORE_LEVELS = 10;
const BACKOFF_BASE_MS = 500;
const BACKOFF_CAP_MS = 4_000;
const SHADOW_RATE_TTL_S = 120;
const SHADOW_DAY_TTL_S = 172_800;

function jevError(
  code: LlmErrorCode,
  message: string,
  task: JevTask,
  status: number | null,
  attempts: number,
): JevTypedError {
  return Object.assign(llmError(code, message), { provider: "jev" as const, task, status, attempts });
}

export function jevModeFor(task: JevTask): JevMode {
  switch (task) {
    case "classify":
      return workerEnv.jevClassifyMode;
    case "mapping":
      return workerEnv.jevMappingMode;
    case "judge":
      return workerEnv.jevJudgeMode;
  }
}

export function jevConfigured(): boolean {
  return Boolean(workerEnv.jevApiKey);
}

export interface JevReadiness {
  ok: boolean;
  configured: boolean;
  modes: Record<JevTask, JevMode>;
  /** `jev_key_missing:<task>` for every task whose mode needs a key it doesn't have. */
  problems: string[];
}

/**
 * Missing key + mode off → fine. Missing key + shadow/active → readiness
 * failure for the service; active decisions must never silently no-op.
 */
export function checkJevReadiness(): JevReadiness {
  const modes = {
    classify: jevModeFor("classify"),
    mapping: jevModeFor("mapping"),
    judge: jevModeFor("judge"),
  };
  const configured = jevConfigured();
  const problems = JEV_TASKS.filter((task) => modes[task] !== "off" && !configured).map(
    (task) => `jev_key_missing:${task}`,
  );
  return { ok: problems.length === 0, configured, modes, problems };
}

function isFiniteUnit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateJevQuestions(questions: Record<string, JevQuestion>): void {
  const ids = Object.keys(questions);
  if (ids.length === 0) throw new Error("jev: at least one question is required");
  for (const id of ids) {
    const q = questions[id]!;
    if (!q || typeof q.instructions !== "string" || !q.instructions.trim()) {
      throw new Error(`jev: question "${id}" needs instructions`);
    }
    if (q.type === "choice") {
      const options = Object.keys(q.criteria ?? {});
      if (options.length < 2 || options.length > MAX_CHOICE_OPTIONS) {
        throw new Error(`jev: choice "${id}" needs 2..${MAX_CHOICE_OPTIONS} options`);
      }
    } else if (q.type === "score") {
      const levels = q.criteria?.length ?? 0;
      if (levels < MIN_SCORE_LEVELS || levels > MAX_SCORE_LEVELS) {
        throw new Error(`jev: score "${id}" needs ${MIN_SCORE_LEVELS}..${MAX_SCORE_LEVELS} levels`);
      }
    } else {
      throw new Error(`jev: question "${id}" has unsupported type`);
    }
  }
}

function assertDistribution(
  probabilities: unknown,
  allowed: ReadonlySet<string>,
  where: string,
): Record<string, number> {
  if (probabilities === null || typeof probabilities !== "object" || Array.isArray(probabilities)) {
    throw new Error(`${where}: probabilities missing`);
  }
  const out: Record<string, number> = {};
  let sum = 0;
  for (const [key, value] of Object.entries(probabilities as Record<string, unknown>)) {
    if (!allowed.has(key)) throw new Error(`${where}: probability for unknown option`);
    if (!isFiniteUnit(value)) throw new Error(`${where}: probability out of range`);
    out[key] = value;
    sum += value;
  }
  if (Object.keys(out).length === 0) throw new Error(`${where}: empty distribution`);
  if (Math.abs(sum - 1) > DISTRIBUTION_TOLERANCE) {
    throw new Error(`${where}: distribution not normalized`);
  }
  return out;
}

/**
 * Strict answer validation: exact question-id set, matching types, option
 * names from the supplied criteria, finite in-range probabilities that sum to
 * one (±1e-3), finite confidence. Free text is never interpreted.
 */
export function validateJevAnswers<Q extends Record<string, JevQuestion>>(
  questions: Q,
  raw: unknown,
): JevAnswersFor<Q> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("jev answers: not an object");
  }
  const answers = raw as Record<string, unknown>;
  const expected = Object.keys(questions);
  for (const id of Object.keys(answers)) {
    if (!(id in questions)) throw new Error(`jev answers: unexpected question id`);
  }
  const out: Record<string, JevAnswer> = {};
  for (const id of expected) {
    const q = questions[id]!;
    const a = answers[id];
    if (a === null || typeof a !== "object") throw new Error(`jev answers: missing answer`);
    const rec = a as Record<string, unknown>;
    if (rec.type !== q.type) throw new Error(`jev answers: type mismatch`);
    if (q.type === "choice") {
      const options = new Set(Object.keys(q.criteria));
      if (typeof rec.choice !== "string" || !options.has(rec.choice)) {
        throw new Error(`jev answers: choice not in options`);
      }
      const probabilities = assertDistribution(rec.probabilities, options, "jev choice");
      if (!isFiniteUnit(rec.confidence)) throw new Error("jev choice: confidence out of range");
      out[id] = { type: "choice", choice: rec.choice, probabilities, confidence: rec.confidence };
    } else {
      const levels = q.criteria.length;
      const indices = new Set(Array.from({ length: levels }, (_, i) => String(i)));
      const score = rec.score;
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > levels - 1) {
        throw new Error("jev score: score out of range");
      }
      const probabilities = assertDistribution(rec.probabilities, indices, "jev score");
      if (!isFiniteUnit(rec.confidence)) throw new Error("jev score: confidence out of range");
      out[id] = {
        type: "score",
        score,
        normalized: levels > 1 ? score / (levels - 1) : 0,
        levels,
        probabilities,
        confidence: rec.confidence,
      };
    }
  }
  return out as JevAnswersFor<Q>;
}

function parseUsage(raw: unknown): JevUsage | null {
  if (raw === null || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const input = Number(rec.input_tokens ?? 0);
  const output = Number(rec.output_tokens ?? 0);
  if (!Number.isFinite(input) || !Number.isFinite(output)) return null;
  return { inputTokens: input, outputTokens: output, totalTokens: input + output };
}

export function estimateJevUsd(usage: JevUsage | null): number | null {
  if (!usage) return null;
  return (usage.inputTokens / 1_000_000) * JEV_INPUT_USD_PER_MILLION;
}

function serializedStateLength(state: unknown): number {
  const text = typeof state === "string" ? state : JSON.stringify(state ?? null);
  return text.length;
}

/** 429 / 529 / 5xx / timeout / network: retry the SAME model within the attempt budget. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 529 || (status >= 500 && status <= 599);
}

function backoffMs(attempt: number): number {
  const cap = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
  return Math.floor(Math.random() * cap);
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function stageFor(task: JevTask): GenerateJsonOptions["stage"] {
  return task;
}

async function reserveShadowHeadroom(task: JevTask): Promise<void> {
  const now = Date.now();
  const minute = Math.floor(now / 60_000);
  const day = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  const okMinute = await reserveCounter(
    `llm:jev:shadow:rate:${minute}`,
    workerEnv.jevShadowRatePerMinute,
    1,
    SHADOW_RATE_TTL_S,
  );
  if (!okMinute) {
    throw jevError("llm_budget_exceeded", "jev_shadow_cap: per-minute shadow cap hit", task, null, 0);
  }
  const okDay = await reserveCounter(
    `llm:jev:shadow:day:${day}`,
    workerEnv.jevShadowDailyCalls,
    1,
    SHADOW_DAY_TTL_S,
  );
  if (!okDay) {
    throw jevError("llm_budget_exceeded", "jev_shadow_cap: daily shadow cap hit", task, null, 0);
  }
}

/**
 * One typed decision. Budget model:
 *  - `active`: counted exactly like a Gemini call (global per-minute, daily
 *    calls, daily tokens, per-stage rate + token caps). Failure after same-model
 *    retries throws; the caller must NOT substitute Gemini for the decision.
 *  - `shadow`: own per-minute/daily caps (`JEV_SHADOW_*`), never the shared
 *    `llm:rate:*` limiter; tokens still land on the stage token cap so spend
 *    is visible. Caller logs the comparison and keeps the production result.
 *  - `off`: throws `llm_unavailable` — callers check the mode first.
 */
export async function jevDecide<Q extends Record<string, JevQuestion>>(
  req: JevRequest<Q>,
  deps: JevDeps = {},
): Promise<JevDecision<Q>> {
  const mode = req.mode ?? jevModeFor(req.task);
  const task = req.task;
  if (mode === "off") {
    throw jevError("llm_unavailable", `jev_off: ${task} mode is off`, task, null, 0);
  }
  if (!workerEnv.jevApiKey) {
    throw jevError("llm_unavailable", "jev_unavailable: JEV_API_KEY not set", task, null, 0);
  }
  try {
    validateJevQuestions(req.questions);
  } catch (err) {
    throw jevError("llm_shape", (err as Error).message, task, null, 0);
  }
  if (serializedStateLength(req.state) > workerEnv.jevMaxStateChars) {
    throw jevError("llm_shape", "jev: state exceeds JEV_MAX_STATE_CHARS", task, null, 0);
  }

  if (mode === "shadow") {
    await reserveShadowHeadroom(task);
  } else {
    await consumeStageRateLimit(stageFor(task));
  }

  try {
    await circuitGuard("jev");
  } catch (guardErr) {
    throw jevError(
      "llm_unavailable",
      String((guardErr as Error).message ?? "jev circuit open"),
      task,
      null,
      0,
    );
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const sleep = deps.sleep ?? defaultSleep;
  const url = `${workerEnv.jevBaseUrl}/v1/systemone`;
  const body = JSON.stringify({ model: workerEnv.jevModel, state: req.state, questions: req.questions });
  const started = Date.now();
  const maxAttempts = Math.max(1, workerEnv.jevMaxAttempts);
  let lastError: JevTypedError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (mode === "active") await consumeBudget(Date.now(), { calls: 1 });
    let status: number | null = null;
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${workerEnv.jevApiKey}`,
        },
        body,
        signal: AbortSignal.timeout(workerEnv.jevTimeoutMs),
      });
      status = res.status;
      if (!res.ok) {
        // Never surface the response body: it can echo state or auth detail.
        const label =
          status === 401 || status === 403
            ? "unauthorized"
            : status === 404 || status === 422
              ? "request rejected"
              : status === 429
                ? "rate limit"
                : status === 529
                  ? "overloaded"
                  : "upstream error";
        const err = jevError("llm_provider_failed", `JEV ${status}: ${label}`, task, status, attempt + 1);
        await circuitRecordFailure("jev", err);
        lastError = err;
        if (!isRetryableStatus(status)) break;
        if (attempt + 1 < maxAttempts) await sleep(backoffMs(attempt));
        continue;
      }
      const data = (await res.json()) as { model?: unknown; answers?: unknown; usage?: unknown };
      let answers: JevAnswersFor<Q>;
      try {
        answers = validateJevAnswers(req.questions, data.answers);
      } catch (shapeErr) {
        const err = jevError("llm_shape", (shapeErr as Error).message, task, status, attempt + 1);
        await circuitRecordFailure("jev", err);
        throw err;
      }
      const usage = parseUsage(data.usage);
      const tokens = Math.max(1, usage?.totalTokens ?? 1);
      if (mode === "active") await consumeBudget(Date.now(), { tokens, calls: 0 });
      await consumeStageBudget(stageFor(task), tokens);
      await circuitRecordSuccess("jev");
      return {
        answers,
        meta: {
          task,
          provider: "jev",
          mode,
          requestedModel: workerEnv.jevModel,
          returnedModel: typeof data.model === "string" ? data.model : null,
          durationMs: Date.now() - started,
          attempts: attempt + 1,
          usage,
          estimatedUsd: estimateJevUsd(usage),
          costStatus: usage ? "estimated" : "unknown",
          errorCode: null,
        },
      };
    } catch (err) {
      if (err && typeof err === "object" && (err as { provider?: string }).provider === "jev") {
        throw err;
      }
      // Timeout / connection failure: transient, same-model retry.
      const name = err instanceof Error ? err.name : "";
      const label = /timeout|abort/i.test(name) ? "timeout" : "network";
      const wrapped = jevError("llm_provider_failed", `JEV ${label}: request failed`, task, null, attempt + 1);
      await circuitRecordFailure("jev", wrapped);
      lastError = wrapped;
      if (attempt + 1 < maxAttempts) await sleep(backoffMs(attempt));
    }
  }
  throw lastError ?? jevError("llm_provider_failed", "JEV: no attempt ran", task, null, 0);
}

/** Argmax helper for Choice distributions (ties → first key in iteration order). */
export function topChoice(probabilities: Record<string, number>): string | null {
  let best: string | null = null;
  let bestP = -1;
  for (const [key, p] of Object.entries(probabilities)) {
    if (p > bestP) {
      best = key;
      bestP = p;
    }
  }
  return best;
}

export interface JevShadowDeps extends JevDeps {
  decide?: typeof jevDecide;
  log?: { info: typeof logInfo; warn: typeof logWarn };
}

/**
 * Shadow run: fire the JEV decision, log the comparison the caller computes
 * (agreement flags, deltas — never payloads) and swallow every failure. The
 * production result is decided elsewhere and is never touched here.
 */
export async function jevShadow<Q extends Record<string, JevQuestion>>(
  req: Omit<JevRequest<Q>, "mode">,
  compare: (decision: JevDecision<Q>) => Record<string, unknown>,
  deps: JevShadowDeps = {},
): Promise<JevDecision<Q> | null> {
  const decide = deps.decide ?? jevDecide;
  const log = deps.log ?? { info: logInfo, warn: logWarn };
  try {
    const decision = await decide({ ...req, mode: "shadow" }, deps);
    log.info("jev shadow decision", {
      event: "jev_shadow",
      task: req.task,
      model: decision.meta.returnedModel ?? decision.meta.requestedModel,
      durationMs: decision.meta.durationMs,
      attempts: decision.meta.attempts,
      inputTokens: decision.meta.usage?.inputTokens ?? null,
      estimatedUsd: decision.meta.estimatedUsd,
      ...compare(decision),
    });
    return decision;
  } catch (err) {
    const typed = err as Partial<JevTypedError> | undefined;
    log.warn("jev shadow failed (production result unchanged)", {
      event: "jev_shadow_error",
      task: req.task,
      code: typed?.code ?? null,
      status: typed?.status ?? null,
      attempts: typed?.attempts ?? null,
    });
    return null;
  }
}
