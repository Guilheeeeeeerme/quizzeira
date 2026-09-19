import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { workerEnv } from "./env";
import {
  circuitGuard,
  circuitRecordFailure,
  circuitRecordSuccess,
  classifyProviderError,
  circuitHealth,
  resetCircuitsForTests,
} from "./circuit";

// Force in-process circuit state so tests never attempt the host REDIS_URL.
workerEnv.redisUrl = "";

beforeEach(async () => {
  await resetCircuitsForTests();
});

afterEach(async () => {
  await resetCircuitsForTests();
});

describe("classifyProviderError", () => {
  it("classifies authentication failures", () => {
    expect(classifyProviderError(new Error("Gemini 401: API key not valid"))).toBe("authentication");
    expect(classifyProviderError(new Error("OpenAI 403: unauthorized"))).toBe("authentication");
  });

  it("classifies billing/credit failures", () => {
    expect(classifyProviderError(new Error("OpenAI 429: insufficient_quota, no credits"))).toBe("billing");
    expect(classifyProviderError(new Error("quota project misconfigured"))).toBe("billing");
  });

  it("classifies rate limits and transient outages", () => {
    expect(classifyProviderError(new Error("Gemini 429: high demand"))).toBe("rate_limit");
    expect(classifyProviderError(new Error("Gemini 503: overloaded"))).toBe("rate_limit");
    expect(classifyProviderError(new Error("fetch failed"))).toBe("transient");
  });
});

describe("circuit state machine", () => {
  it("starts healthy and admits attempts", async () => {
    await expect(circuitGuard("gemini")).resolves.toBeUndefined();
    expect((await circuitHealth("gemini")).state).toBe("healthy");
  });

  it("opens for hours on authentication failures", async () => {
    await circuitRecordFailure("gemini", new Error("Gemini 401: API key not valid"));
    const health = await circuitHealth("gemini");
    expect(health.state).toBe("open");
    expect(health.openUntil).toBeGreaterThan(Date.now() + 3 * 3_600_000);
    await expect(circuitGuard("gemini")).rejects.toMatchObject({ code: "llm_unavailable" });
  });

  it("uses short exponential backoff for transient failures", async () => {
    await circuitRecordFailure("gemini", new Error("Gemini 503: overloaded"));
    const first = await circuitHealth("gemini");
    expect(first.state).toBe("open");
    const waitMs = first.openUntil - Date.now();
    expect(waitMs).toBeGreaterThan(20_000);
    expect(waitMs).toBeLessThan(120_000);
  });

  it("recovers to healthy after one success", async () => {
    await circuitRecordFailure("gemini", new Error("Gemini 429: high demand"));
    await circuitRecordSuccess("gemini");
    expect((await circuitHealth("gemini")).state).toBe("healthy");
    await expect(circuitGuard("gemini")).resolves.toBeUndefined();
  });

  it("keeps failed budget/guardrail errors out of the circuit", async () => {
    await circuitRecordFailure("gemini", new Error("llm_budget_exceeded: cap hit"));
    expect((await circuitHealth("gemini")).state).toBe("healthy");
    await circuitRecordFailure("gemini", new Error("guardrail_block: injection"));
    expect((await circuitHealth("gemini")).state).toBe("healthy");
  });
});
