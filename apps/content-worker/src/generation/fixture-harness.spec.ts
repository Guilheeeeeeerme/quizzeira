import assert from "node:assert/strict";
import { test } from "node:test";
import { decide } from "../../../content-quality/src/gate.js";
import { validateGrounding } from "../../../content-quality/src/grounding.js";
import { validateRelevance } from "../../../content-quality/src/relevance.js";
import { validateStructure } from "../../../content-quality/src/structural.js";
import { buildGenerationBrief, briefToPromptPayload, selectKnowledgeForBrief } from "./brief.js";
import { generateFromKnowledgeUnit, runFixtureGenerationHarness } from "./fixture-harness.js";

test("selectKnowledgeForBrief diversifies kinds", () => {
  const units = [
    { id: "1", kind: "rule" as const, statement: "r1", example: null, qualifiers: [] },
    { id: "2", kind: "rule" as const, statement: "r2", example: null, qualifiers: [] },
    { id: "3", kind: "definition" as const, statement: "d1", example: null, qualifiers: [] },
    { id: "4", kind: "exception" as const, statement: "e1", example: null, qualifiers: [] },
  ];
  const selected = selectKnowledgeForBrief(units, 3);
  assert.equal(selected.length, 3);
  assert.equal(new Set(selected.map((u) => u.kind)).size >= 2, true);
});

test("buildGenerationBrief includes forbidden axes and KUs", () => {
  const brief = buildGenerationBrief({
    examTitle: "Exame X",
    syllabusPath: ["LP", "Sintaxe", "Concordância"],
    syllabusRawText: "Concordância verbal",
    syllabusNodeId: "n1",
    canonicalKey: "lp:concordancia",
    knowledge: [
      {
        id: "ku1",
        kind: "rule",
        statement: "Com sujeito composto anteposto, o verbo vai para o plural",
        example: null,
        qualifiers: [],
      },
    ],
    count: 2,
  });
  assert.equal(brief.syllabus.subtopic, "Concordância");
  assert.ok(brief.constraints.forbidden.some((f) => /vagas/i.test(f)));
  assert.equal(brief.knowledge.length, 1);
  assert.match(briefToPromptPayload(brief), /ku1/);
});

test("fixture harness produces GOOD published and BAD failed questions with real text", () => {
  const result = runFixtureGenerationHarness();
  assert.ok(result.knowledgeUnits.length >= 3, "expected distilled KUs");
  assert.ok(result.questions.some((q) => q.label === "good"));
  assert.ok(result.questions.some((q) => q.label === "bad_metadata"));

  const evaluations = result.questions.map((q) => {
    const structural = validateStructure(q);
    const relevance = structural.ok
      ? validateRelevance({ ...q, origin: "generation" })
      : null;
    const evidenceTexts = result.brief.knowledge
      .filter((k) => q.knowledgeUnitIds.includes(k.id))
      .map((k) => `${k.statement} ${k.example ?? ""}`);
    const grounding = validateGrounding({
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      evidenceTexts: q.label === "good" ? evidenceTexts : [],
    });
    const verdict = decide({
      structural,
      relevance,
      grounding,
      judge:
        structural.ok && relevance?.ok && grounding.ok
          ? {
              score: 0.9,
              answerIndex: q.correctIndex,
              reasons: [],
              notes: "fixture judge agreement",
              model: "fixture",
            }
          : null,
      correctIndex: q.correctIndex,
      thresholds: { publish: 0.8, fail: 0.5 },
      origin: "generation",
    });
    return {
      label: q.label,
      prompt: q.prompt,
      options: q.options ?? [],
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation,
      decision: verdict.decision,
      reasons: verdict.reasons,
      structuralOk: structural.ok,
      relevanceOk: relevance?.ok ?? false,
      groundingOk: grounding.ok,
    };
  });

  const goodEvals = evaluations.filter((e) => e.label === "good");
  const badEvals = evaluations.filter((e) => e.label === "bad_metadata");

  assert.ok(goodEvals.length >= 1);
  for (const e of goodEvals) {
    assert.ok(e.prompt.length >= 30, e.prompt);
    assert.ok(e.options.length >= 4);
    assert.equal(e.structuralOk, true, `${e.prompt} structural ${e.reasons}`);
    assert.equal(e.relevanceOk, true, `${e.prompt} relevance ${e.reasons}`);
    assert.equal(e.groundingOk, true, `${e.prompt} grounding ${e.reasons}`);
    assert.equal(e.decision, "published", `${e.prompt} → ${e.decision} ${e.reasons}`);
  }

  for (const e of badEvals) {
    assert.equal(e.decision, "failed", `${e.prompt} should fail`);
    assert.ok(
      e.reasons.some((r) => /metadata|missing_knowledge|ungrounded/i.test(r)),
      String(e.reasons),
    );
  }

  console.log("\n=== FIXTURE GOOD SAMPLE ===");
  console.log(JSON.stringify(goodEvals[0], null, 2));
  console.log("=== FIXTURE BAD SAMPLE ===");
  console.log(JSON.stringify(badEvals[0], null, 2));
});

test("generateFromKnowledgeUnit embeds KU statement as correct option", () => {
  const q = generateFromKnowledgeUnit({
    id: "ku_abc",
    kind: "rule",
    statement: "Com sujeito composto anteposto ao verbo, o verbo vai para o plural",
    example: null,
    qualifiers: [],
  });
  assert.ok(q.options?.some((o) => /sujeito composto anteposto/i.test(o)));
  assert.equal(q.label, "good");
});
