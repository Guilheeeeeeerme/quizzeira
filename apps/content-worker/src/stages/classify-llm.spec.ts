import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedDocument } from "@quizzeira/shared";
import type { JevDecision } from "@quizzeira/worker-kit";
import {
  ROLE_CRITERIA,
  buildRoleQuestion,
  classifyRoleLlmResidue,
  decisionFromJev,
} from "./classify-llm.js";
import type { ClassificationResult } from "./classify.js";

const doc = {
  contentHash: "abc",
  metadata: { title: "Apostila de Língua Portuguesa — Concordância verbal e nominal" },
  sections: [
    { heading: "Concordância verbal", text: "O verbo concorda com o sujeito em número e pessoa. ".repeat(6) },
    { heading: "Concordância nominal", text: "Adjetivos concordam com o substantivo. ".repeat(6) },
  ],
} as unknown as NormalizedDocument;

const current: ClassificationResult = {
  role: "unknown",
  roleConfidence: 0.2,
  roleMethod: "tier1_lexical",
  subtype: null,
  sections: [],
};

type Q = ReturnType<typeof buildRoleQuestion>;
function jevAnswer(role: string, p: number): JevDecision<Q> {
  const others = Object.keys(ROLE_CRITERIA).filter((r) => r !== role);
  const rest = (1 - p) / others.length;
  const probabilities: Record<string, number> = { [role]: p };
  for (const o of others) probabilities[o] = rest;
  return {
    answers: { role: { type: "choice", choice: role, probabilities, confidence: p } },
    meta: {
      task: "classify", provider: "jev", mode: "shadow", requestedModel: "jev-1.13.0", returnedModel: "jev-1.13.0",
      durationMs: 5, attempts: 1, usage: { inputTokens: 10, outputTokens: 0, totalTokens: 10 }, estimatedUsd: 0, costStatus: "estimated", errorCode: null,
    },
  };
}

const geminiKnowledge = async () => ({ role: "knowledge", subtype: null, confidence: 0.8, reason: "x" }) as never;

describe("classify T3 residue — staged JEV ownership", () => {
  it("builds a Choice question over the closed role set only", () => {
    const q = buildRoleQuestion().role;
    assert.equal(q.type, "choice");
    assert.deepEqual(Object.keys(q.criteria).sort(), [
      "administrative", "evidence", "knowledge", "mixed", "specification", "unknown",
    ]);
  });

  it("decisionFromJev rejects roles outside the allowlist", () => {
    assert.equal(decisionFromJev({ choice: "poem", probabilities: { poem: 1 }, confidence: 1 }), null);
    const d = decisionFromJev({ choice: "knowledge", probabilities: { knowledge: 0.9, unknown: 0.1 }, confidence: 0.9 });
    assert.equal(d?.role, "knowledge");
    assert.equal(d?.confidence, 0.9);
  });

  it("off: Gemini decides, JEV is never called", async () => {
    let jevCalls = 0;
    const out = await classifyRoleLlmResidue(doc, current, {
      mode: "off",
      hasProvider: () => true,
      generate: geminiKnowledge,
      jev: (async () => { jevCalls += 1; throw new Error("nope"); }) as never,
    });
    assert.equal(out?.role, "knowledge");
    assert.equal(out?.roleMethod, "llm");
    assert.equal(jevCalls, 0);
  });

  it("shadow: production result is Gemini's; JEV disagreement/failure only logs", async () => {
    const logged: Array<Record<string, unknown>> = [];
    const log = { info: (_m: string, f?: Record<string, unknown>) => { logged.push(f ?? {}); }, warn: (_m: string, f?: Record<string, unknown>) => { logged.push(f ?? {}); } };
    const out = await classifyRoleLlmResidue(doc, current, {
      mode: "shadow",
      hasProvider: () => true,
      generate: geminiKnowledge,
      jev: (async () => jevAnswer("specification", 0.9)) as never,
      log,
    });
    assert.equal(out?.role, "knowledge");
    assert.equal(out?.roleMethod, "llm");
    const shadow = logged.find((f) => f.event === "jev_shadow");
    assert.ok(shadow);
    assert.equal(shadow!.agree, false);
    assert.equal(shadow!.jevRole, "specification");

    const failing = await classifyRoleLlmResidue(doc, current, {
      mode: "shadow",
      hasProvider: () => true,
      generate: geminiKnowledge,
      jev: (async () => { throw Object.assign(new Error("JEV 529: overloaded"), { code: "llm_provider_failed", status: 529 }); }) as never,
      log,
    });
    assert.equal(failing?.role, "knowledge");
    assert.ok(logged.some((f) => f.event === "jev_shadow_error" && f.status === 529));
  });

  it("active: JEV decides, Gemini is never called; low confidence stays undecided", async () => {
    let geminiCalls = 0;
    const generate = (async () => { geminiCalls += 1; return { role: "knowledge", confidence: 0.9 }; }) as never;
    const out = await classifyRoleLlmResidue(doc, current, {
      mode: "active",
      generate,
      jev: (async () => jevAnswer("specification", 0.8)) as never,
    });
    assert.equal(out?.role, "specification");
    assert.equal(out?.roleMethod, "jev_t3");
    assert.equal(out?.roleConfidence, 0.8);
    assert.equal(geminiCalls, 0);

    const undecided = await classifyRoleLlmResidue(doc, current, {
      mode: "active",
      generate,
      jev: (async () => jevAnswer("specification", 0.4)) as never,
    });
    assert.equal(undecided, null);
    assert.equal(geminiCalls, 0);
  });

  it("active: a JEV failure propagates instead of falling back to Gemini", async () => {
    let geminiCalls = 0;
    await assert.rejects(
      classifyRoleLlmResidue(doc, current, {
        mode: "active",
        generate: (async () => { geminiCalls += 1; return {}; }) as never,
        jev: (async () => { throw Object.assign(new Error("JEV 529: overloaded"), { code: "llm_provider_failed" }); }) as never,
      }),
      /JEV 529/,
    );
    assert.equal(geminiCalls, 0);
  });

  it("skips decisive inputs regardless of mode", async () => {
    const decisive = { ...current, role: "knowledge" as const, roleConfidence: 0.9 };
    let calls = 0;
    const out = await classifyRoleLlmResidue(doc, decisive, {
      mode: "active",
      jev: (async () => { calls += 1; return jevAnswer("specification", 0.9); }) as never,
    });
    assert.equal(out, null);
    assert.equal(calls, 0);
  });
});
