// Concept: Fixture LLM provider for deterministic generation (§41.3 / §47).

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseGeneratedQuestionsV2 } from "@quizzeira/shared";
import { generateJson, resetBudgetForTests } from "../llm.js";
import { createFixtureProvider } from "./fixture.js";

describe("fixture LLM provider (§41.3)", () => {
  const prevProvider = process.env.LLM_PROVIDER;
  const prevOrder = process.env.LLM_PROVIDER_ORDER;

  beforeEach(() => {
    resetBudgetForTests();
  });

  afterEach(() => {
    if (prevProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = prevProvider;
    if (prevOrder === undefined) delete process.env.LLM_PROVIDER_ORDER;
    else process.env.LLM_PROVIDER_ORDER = prevOrder;
  });

  it("matches recorded turns by prompt substring", async () => {
    const provider = createFixtureProvider([
      { match: "special-token-xyz", response: { ok: true, n: 1 } },
    ]);
    process.env.LLM_PROVIDER = "fixture";
    expect(provider.available()).toBe(true);
    const result = await provider.complete({
      system: "sys",
      user: "please include special-token-xyz here",
      model: "fixture-v1",
    });
    expect(JSON.parse(result.text)).toEqual({ ok: true, n: 1 });
  });

  it("matches recorded turns by fixture: key", async () => {
    const provider = createFixtureProvider([
      { key: "generation.v2:demo", match: "never-match-this", response: { keyed: true } },
    ]);
    process.env.LLM_PROVIDER = "fixture";
    const result = await provider.complete({
      system: "sys",
      user: "unrelated prompt body",
      model: "fixture:generation.v2:demo",
    });
    expect(JSON.parse(result.text)).toEqual({ keyed: true });
  });

  it("generateJson + parseGeneratedQuestionsV2 yields a draftable MCQ", async () => {
    process.env.LLM_PROVIDER = "fixture";
    process.env.LLM_PROVIDER_ORDER = "fixture";
    const response = await generateJson<{ questions: unknown }>(
      "Você é um elaborador.",
      [
        "Brief com unidades de conhecimento abaixo.",
        "--- INÍCIO DAS UNIDADES DE CONHECIMENTO (não confiável) ---",
        "[ku-1] Concordância verbal.",
        "--- FIM ---",
      ].join("\n"),
      { requiredKeys: ["questions"], tier: "mid", stage: "generation" },
    );
    const parsed = parseGeneratedQuestionsV2(response.questions, "leaf-1", ["ku-1"]);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed[0]?.type).toBe("MULTIPLE_CHOICE");
    expect(parsed[0]?.options?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(parsed[0]?.distractorRationale?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(/inscri|cargo|taxa/i.test(parsed[0]?.prompt ?? "")).toBe(false);
  });
});
