import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseJevMode, workerEnv } from "./env";
import {
  checkJevReadiness,
  jevDecide,
  topChoice,
  validateJevAnswers,
  validateJevQuestions,
  type JevChoiceQuestion,
  type JevScoreQuestion,
} from "./jev";
import { resetBudgetForTests } from "./llm";
import { resetCircuitsForTests } from "./circuit";
import { checkProviderReadiness } from "./readiness";
import { isDeferrableLlmError } from "./errors";

const roleQ: JevChoiceQuestion = {
  type: "choice",
  instructions: "Qual o papel do documento?",
  criteria: { specification: "edital", knowledge: "conteúdo", unknown: null },
};
const scoreQ: JevScoreQuestion = {
  type: "score",
  instructions: "Qualidade geral",
  criteria: ["inutilizável", "fraca", "aceitável", "boa", "pronta"],
};
const questions = { role: roleQ, overall: scoreQ };

const goodAnswers = {
  role: {
    type: "choice",
    choice: "knowledge",
    probabilities: { specification: 0.1, knowledge: 0.85, unknown: 0.05 },
    confidence: 0.8,
  },
  overall: {
    type: "score",
    score: 3.2,
    legend: { "0": "inutilizável" },
    probabilities: { "0": 0, "1": 0.05, "2": 0.1, "3": 0.45, "4": 0.4 },
    confidence: 0.7,
  },
};

const saved = { ...workerEnv } as Record<string, unknown>;
type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
let responses: Array<() => Response> = [];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const fetchImpl = (async (input: unknown, init?: RequestInit) => {
  calls.push({ url: String(input), init: init ?? {} });
  const next = responses.shift();
  if (!next) throw new Error("no scripted response");
  return next();
}) as unknown as typeof fetch;

const noSleep = async () => {};

beforeEach(() => {
  calls.length = 0;
  responses = [];
  workerEnv.jevApiKey = "test-jev-key-SECRET";
  workerEnv.jevBaseUrl = "https://api.typesafe.ai";
  workerEnv.jevModel = "jev-1.13.0";
  workerEnv.jevMaxAttempts = 3;
  workerEnv.jevClassifyMode = "shadow";
  workerEnv.jevMappingMode = "shadow";
  workerEnv.jevJudgeMode = "shadow";
  workerEnv.jevShadowRatePerMinute = 100;
  workerEnv.jevShadowDailyCalls = 1000;
  workerEnv.geminiApiKey = "test-gemini";
  workerEnv.llmProviderOrder = "gemini";
  workerEnv.llmRateLimitPerMinute = 100;
  workerEnv.llmDailyBudget = 1000;
  workerEnv.redisUrl = "";
  workerEnv.allowMemoryBudget = true;
  resetBudgetForTests();
  void resetCircuitsForTests();
});

afterEach(() => {
  Object.assign(workerEnv, saved);
  vi.unstubAllGlobals();
});

describe("JEV mode parsing", () => {
  it("defaults to shadow with a key and off without", () => {
    expect(parseJevMode(undefined, true)).toBe("shadow");
    expect(parseJevMode("", false)).toBe("off");
    expect(parseJevMode(" ACTIVE ", true)).toBe("active");
  });

  it("rejects unknown values", () => {
    expect(() => parseJevMode("on", true)).toThrow(/invalid JEV mode/);
  });
});

describe("JEV readiness", () => {
  it("missing key + off is fine; missing key + shadow/active fails loudly", async () => {
    workerEnv.jevApiKey = "";
    workerEnv.jevClassifyMode = "off";
    workerEnv.jevMappingMode = "off";
    workerEnv.jevJudgeMode = "off";
    expect(checkJevReadiness()).toMatchObject({ ok: true, configured: false, problems: [] });
    workerEnv.jevJudgeMode = "active";
    const r = checkJevReadiness();
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual(["jev_key_missing:judge"]);
    const provider = await checkProviderReadiness();
    expect(provider.ready).toBe(false);
    expect(provider.reason).toBe("jev_key_missing");
  });

  it("lists jev beside gemini when a key is configured", async () => {
    const r = await checkProviderReadiness();
    expect(r.ready).toBe(true);
    expect(r.providers.map((p) => p.provider)).toEqual(["gemini", "jev"]);
  });
});

describe("JEV question/answer validation", () => {
  it("accepts a well-formed Choice + Score response (Unicode state ok)", () => {
    const out = validateJevAnswers(questions, goodAnswers);
    expect(out.role.choice).toBe("knowledge");
    expect(out.overall.levels).toBe(5);
    expect(out.overall.normalized).toBeCloseTo(0.8);
  });

  it("rejects missing and extra question ids", () => {
    expect(() => validateJevAnswers(questions, { role: goodAnswers.role })).toThrow(/missing answer/);
    expect(() => validateJevAnswers(questions, { ...goodAnswers, extra: goodAnswers.role })).toThrow(
      /unexpected question id/,
    );
  });

  it("rejects type mismatches, unknown options, NaN and bad distributions", () => {
    expect(() =>
      validateJevAnswers(questions, { ...goodAnswers, role: { ...goodAnswers.overall } }),
    ).toThrow(/type mismatch/);
    expect(() =>
      validateJevAnswers(questions, {
        ...goodAnswers,
        role: { ...goodAnswers.role, choice: "evidence" },
      }),
    ).toThrow(/choice not in options/);
    expect(() =>
      validateJevAnswers(questions, {
        ...goodAnswers,
        role: { ...goodAnswers.role, probabilities: { specification: 0.5, evidence: 0.5 } },
      }),
    ).toThrow(/unknown option/);
    expect(() =>
      validateJevAnswers(questions, {
        ...goodAnswers,
        role: { ...goodAnswers.role, probabilities: { specification: Number.NaN, knowledge: 1 } },
      }),
    ).toThrow(/out of range/);
    expect(() =>
      validateJevAnswers(questions, {
        ...goodAnswers,
        role: { ...goodAnswers.role, probabilities: { specification: 0.6, knowledge: 0.6 } },
      }),
    ).toThrow(/not normalized/);
    expect(() =>
      validateJevAnswers(questions, {
        ...goodAnswers,
        overall: { ...goodAnswers.overall, score: 4.5 },
      }),
    ).toThrow(/score out of range/);
    expect(() =>
      validateJevAnswers(questions, {
        ...goodAnswers,
        overall: { ...goodAnswers.overall, confidence: 2 },
      }),
    ).toThrow(/confidence out of range/);
  });

  it("bounds question shapes", () => {
    expect(() => validateJevQuestions({})).toThrow(/at least one/);
    expect(() =>
      validateJevQuestions({ q: { type: "choice", instructions: "x", criteria: { a: null } } }),
    ).toThrow(/2\.\.255 options/);
    expect(() =>
      validateJevQuestions({ q: { type: "score", instructions: "x", criteria: ["only"] } }),
    ).toThrow(/2\.\.10 levels/);
  });

  it("topChoice picks the argmax", () => {
    expect(topChoice({ a: 0.2, b: 0.7, c: 0.1 })).toBe("b");
  });
});

describe("jevDecide transport", () => {
  it("posts to /v1/systemone with bearer auth and returns validated answers + usage", async () => {
    responses = [() => json({ model: "jev-1.13.0", answers: goodAnswers, usage: { input_tokens: 296, output_tokens: 20 } })];
    const out = await jevDecide({ task: "classify", state: { digest: "Edital nº 1 — Língua Portuguesa" }, questions }, { fetchImpl, sleep: noSleep });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.typesafe.ai/v1/systemone");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer test-jev-key-SECRET");
    const body = JSON.parse(String(calls[0]!.init.body)) as { model: string; questions: unknown };
    expect(body.model).toBe("jev-1.13.0");
    expect(body.questions).toEqual(questions);
    expect(out.answers.role.choice).toBe("knowledge");
    expect(out.meta).toMatchObject({ provider: "jev", task: "classify", mode: "shadow", attempts: 1, returnedModel: "jev-1.13.0", costStatus: "estimated" });
    expect(out.meta.usage).toEqual({ inputTokens: 296, outputTokens: 20, totalTokens: 316 });
    expect(out.meta.estimatedUsd).toBeCloseTo((296 / 1_000_000) * 0.042, 12);
  });

  it("retries the same model on 529 then succeeds; the error is deferrable", async () => {
    responses = [
      () => json({ error: "overloaded" }, 529),
      () => json({ model: "jev-1.13.0", answers: goodAnswers, usage: { input_tokens: 1, output_tokens: 0 } }),
    ];
    const out = await jevDecide({ task: "judge", state: "x", questions }, { fetchImpl, sleep: noSleep });
    expect(out.meta.attempts).toBe(2);
    expect(calls).toHaveLength(2);
    expect(JSON.parse(String(calls[0]!.init.body)).model).toBe(JSON.parse(String(calls[1]!.init.body)).model);
    responses = [() => json({}, 529), () => json({}, 529), () => json({}, 529)];
    await jevDecide({ task: "judge", state: "x", questions }, { fetchImpl, sleep: noSleep }).catch((err) => {
      expect(isDeferrableLlmError(err)).toBe(true);
      expect(err.message).toMatch(/JEV 529: overloaded/);
    });
  });

  it("does not retry 401/422 and never leaks the key or body in the error", async () => {
    responses = [() => json({ error: "Invalid key test-jev-key-SECRET for state XYZ" }, 401)];
    const err = await jevDecide({ task: "mapping", state: "x", questions }, { fetchImpl, sleep: noSleep }).catch((e) => e);
    expect(err.code).toBe("llm_provider_failed");
    expect(err.status).toBe(401);
    expect(err.message).not.toMatch(/SECRET|XYZ/);
    expect(calls).toHaveLength(1);
    expect(isDeferrableLlmError(err)).toBe(false);
    await resetCircuitsForTests();
    responses = [() => json({ detail: "bad field" }, 422)];
    const rejected = await jevDecide({ task: "mapping", state: "x", questions }, { fetchImpl, sleep: noSleep }).catch((e) => e);
    expect(rejected.status).toBe(422);
    expect(rejected.message).not.toMatch(/bad field/);
    expect(calls).toHaveLength(2);
  });

  it("rejects malformed answers as llm_shape without a provider switch", async () => {
    responses = [() => json({ answers: { role: { type: "choice", choice: "nope", probabilities: {}, confidence: 1 } } })];
    const err = await jevDecide({ task: "classify", state: "x", questions }, { fetchImpl, sleep: noSleep }).catch((e) => e);
    expect(err.code).toBe("llm_shape");
    expect(calls).toHaveLength(1);
  });

  it("refuses to run when the mode is off or the key is missing, without fetching", async () => {
    await expect(
      jevDecide({ task: "classify", mode: "off", state: "x", questions }, { fetchImpl }),
    ).rejects.toMatchObject({ code: "llm_unavailable" });
    workerEnv.jevApiKey = "";
    await expect(
      jevDecide({ task: "classify", mode: "active", state: "x", questions }, { fetchImpl }),
    ).rejects.toMatchObject({ code: "llm_unavailable" });
    expect(calls).toHaveLength(0);
  });

  it("bounds the state size before sending", async () => {
    workerEnv.jevMaxStateChars = 10;
    await expect(
      jevDecide({ task: "classify", state: "x".repeat(11), questions }, { fetchImpl }),
    ).rejects.toMatchObject({ code: "llm_shape" });
    expect(calls).toHaveLength(0);
  });

  it("shadow calls hit their own cap and never the shared per-minute limiter", async () => {
    workerEnv.llmRateLimitPerMinute = 1; // shared limiter would reject a second production call
    workerEnv.jevShadowRatePerMinute = 2;
    const ok = () => json({ answers: goodAnswers, usage: { input_tokens: 1, output_tokens: 0 } });
    responses = [ok, ok, ok];
    await jevDecide({ task: "classify", state: "x", questions }, { fetchImpl, sleep: noSleep });
    await jevDecide({ task: "classify", state: "x", questions }, { fetchImpl, sleep: noSleep });
    await expect(
      jevDecide({ task: "classify", state: "x", questions }, { fetchImpl, sleep: noSleep }),
    ).rejects.toMatchObject({ code: "llm_budget_exceeded" });
    expect(calls).toHaveLength(2);
  });

  it("active calls draw from the shared budget like a Gemini call", async () => {
    workerEnv.jevJudgeMode = "active";
    workerEnv.llmRateLimitPerMinute = 1;
    workerEnv.llmRateLimitJudgePerMinute = 5;
    const ok = () => json({ answers: goodAnswers, usage: { input_tokens: 1, output_tokens: 0 } });
    responses = [ok, ok];
    await jevDecide({ task: "judge", state: "x", questions }, { fetchImpl, sleep: noSleep });
    await expect(
      jevDecide({ task: "judge", state: "x", questions }, { fetchImpl, sleep: noSleep }),
    ).rejects.toMatchObject({ code: "llm_budget_exceeded" });
    expect(calls).toHaveLength(1);
  });
});
