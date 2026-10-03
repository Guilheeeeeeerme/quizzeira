import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JevDecision } from "@quizzeira/worker-kit";
import {
  buildJudgeQuestions,
  buildJudgeState,
  judgeItem,
  verdictFromJev,
  type JudgeInput,
  type JudgeQuestions,
} from "./judge.js";

const mcq: JudgeInput = {
  examSlug: "tjsp-2026",
  subject: "Língua Portuguesa",
  type: "MULTIPLE_CHOICE",
  prompt: "Assinale a alternativa em que a concordância verbal está correta.",
  options: ["Fazem dois anos.", "Faz dois anos.", "Houveram problemas.", "Existe problemas.", "Haviam dúvidas."],
  correctIndex: 1,
  referenceAnswer: null,
  explanation: "Fazer indicando tempo é impessoal.",
  syllabusPath: ["Língua Portuguesa", "Sintaxe", "Concordância verbal"],
  knowledgeUnitStatements: ["Verbos impessoais ficam na 3ª pessoa do singular."],
};

function score(level: number, confidence = 0.8) {
  const probabilities: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };
  probabilities[String(level)] = 1;
  return { type: "score" as const, score: level, normalized: level / 4, levels: 5, probabilities, confidence };
}
function decision(levels: { score: number; relevance: number; durability: number; grounding: number }, answer: string | null): JevDecision<JudgeQuestions> {
  const answers: Record<string, unknown> = {
    score: score(levels.score),
    relevance: score(levels.relevance),
    durability: score(levels.durability),
    grounding: score(levels.grounding),
  };
  if (answer != null) {
    const probabilities: Record<string, number> = { "0": 0.02, "1": 0.02, "2": 0.02, "3": 0.02, "4": 0.02 };
    probabilities[answer] = 0.92;
    answers.answerIndex = { type: "choice", choice: answer, probabilities, confidence: 0.9 };
  }
  return {
    answers: answers as never,
    meta: { task: "judge", provider: "jev", mode: "active", requestedModel: "jev-1.13.0", returnedModel: "jev-1.13.0", durationMs: 3, attempts: 1, usage: { inputTokens: 500, outputTokens: 0, totalTokens: 500 }, estimatedUsd: 0.000021, costStatus: "estimated", errorCode: null },
  };
}

const geminiRaw = { score: 0.85, answerIndex: 1, relevance: 0.9, durability: 0.9, grounding: 0.8, reasons: ["clara"], notes: "Boa questão." };

describe("judge — JEV Score×4 + Choice ownership", () => {
  it("builds four 5-level Score questions and a Choice over option indices for MCQ", () => {
    const q = buildJudgeQuestions(mcq);
    for (const key of ["score", "relevance", "durability", "grounding"] as const) {
      assert.equal(q[key].type, "score");
      assert.equal(q[key].criteria.length, 5);
    }
    assert.equal(q.answerIndex?.type, "choice");
    assert.deepEqual(Object.keys(q.answerIndex!.criteria), ["0", "1", "2", "3", "4"]);
    const open = buildJudgeQuestions({ ...mcq, type: "OPEN", options: null, correctIndex: null, referenceAnswer: "Faz dois anos." });
    assert.equal(open.answerIndex, undefined);
    const state = buildJudgeState(mcq) as { keyedIndex: number; options: unknown[] };
    assert.equal(state.keyedIndex, 1);
    assert.equal(state.options.length, 5);
  });

  it("verdictFromJev clamps scores, maps reason tags in code and never emits model prose", () => {
    const good = verdictFromJev(decision({ score: 4, relevance: 4, durability: 4, grounding: 3 }, "1").answers, mcq, "jev-1.13.0");
    assert.equal(good.score, 1);
    assert.equal(good.grounding, 0.75);
    assert.equal(good.answerIndex, 1);
    assert.deepEqual(good.reasons, ["jev_scored"]);
    assert.match(good.notes, /^JEV judge-jev-v1: score 1\.00/);
    assert.equal(good.model, "jev-1.13.0");

    const bad = verdictFromJev(decision({ score: 1, relevance: 4, durability: 0, grounding: 1 }, "3").answers, mcq, null);
    assert.equal(bad.durability, 0);
    assert.ok(bad.reasons.includes("jev_low_overall"));
    assert.ok(bad.reasons.includes("jev_low_durability"));
    assert.ok(bad.reasons.includes("jev_low_grounding"));
    assert.ok(bad.reasons.includes("jev_answer_disagrees"));
    assert.equal(bad.answerIndex, 3);
  });

  it("OPEN items get answerIndex null", () => {
    const open = { ...mcq, type: "OPEN" as const, options: null, correctIndex: null };
    const v = verdictFromJev(decision({ score: 3, relevance: 3, durability: 3, grounding: 3 }, null).answers, open, null);
    assert.equal(v.answerIndex, null);
    assert.deepEqual(v.reasons, ["jev_scored"]);
  });

  it("off: Gemini judge; JEV never called", async () => {
    let jev = 0;
    const v = await judgeItem(mcq, {
      mode: "off",
      hasProvider: () => true,
      generate: (async () => geminiRaw) as never,
      jev: (async () => { jev += 1; throw new Error("x"); }) as never,
    });
    assert.equal(v.score, 0.85);
    assert.equal(v.notes, "Boa questão.");
    assert.equal(jev, 0);
  });

  it("shadow: Gemini verdict is returned; comparison logged; JEV failure harmless", async () => {
    const logged: Array<Record<string, unknown>> = [];
    const log = { info: (_m: string, f?: Record<string, unknown>) => { logged.push(f ?? {}); }, warn: (_m: string, f?: Record<string, unknown>) => { logged.push(f ?? {}); } };
    const v = await judgeItem(mcq, {
      mode: "shadow",
      hasProvider: () => true,
      generate: (async () => geminiRaw) as never,
      jev: (async () => decision({ score: 2, relevance: 4, durability: 4, grounding: 4 }, "3")) as never,
      log,
    });
    assert.equal(v.score, 0.85);
    assert.equal(v.answerIndex, 1);
    const cmp = logged.find((f) => f.event === "jev_shadow_compare");
    assert.ok(cmp);
    assert.equal(cmp!.answerAgree, false);
    assert.equal(cmp!.jevScore, 0.5);

    const v2 = await judgeItem(mcq, {
      mode: "shadow",
      hasProvider: () => true,
      generate: (async () => geminiRaw) as never,
      jev: (async () => { throw Object.assign(new Error("JEV 429: rate limit"), { code: "llm_provider_failed", status: 429 }); }) as never,
      log,
    });
    assert.equal(v2.score, 0.85);
    assert.ok(logged.some((f) => f.event === "jev_shadow_error"));
  });

  it("shadow: a Gemini failure still propagates (no silent publish)", async () => {
    await assert.rejects(
      judgeItem(mcq, {
        mode: "shadow",
        hasProvider: () => true,
        generate: (async () => { throw Object.assign(new Error("Gemini 503: high demand"), { code: "llm_provider_failed" }); }) as never,
        jev: (async () => decision({ score: 4, relevance: 4, durability: 4, grounding: 4 }, "1")) as never,
      }),
      /Gemini 503/,
    );
  });

  it("active: JEV verdict with code reasons; Gemini never called; failure propagates", async () => {
    let gemini = 0;
    const v = await judgeItem(mcq, {
      mode: "active",
      generate: (async () => { gemini += 1; return geminiRaw; }) as never,
      jev: (async () => decision({ score: 4, relevance: 4, durability: 4, grounding: 4 }, "1")) as never,
    });
    assert.equal(gemini, 0);
    assert.equal(v.score, 1);
    assert.equal(v.answerIndex, 1);
    assert.equal(v.model, "jev-1.13.0");
    await assert.rejects(
      judgeItem(mcq, {
        mode: "active",
        generate: (async () => { gemini += 1; return geminiRaw; }) as never,
        jev: (async () => { throw Object.assign(new Error("JEV 529: overloaded"), { code: "llm_provider_failed" }); }) as never,
      }),
      /JEV 529/,
    );
    assert.equal(gemini, 0);
  });
});
