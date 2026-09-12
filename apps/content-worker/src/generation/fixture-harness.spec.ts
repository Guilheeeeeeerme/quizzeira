/**
 * Fixture harness: produce real question text from KUs and validate the ladder.
 * This is the verification path when live LLM keys are unavailable.
 */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { buildGenerationBrief } from "./brief.js";
import { fixtureGenerateFromBrief, fixtureMetadataTriviaQuestion } from "./fixture.js";
import { distillChunkToUnits } from "../stages/knowledge/distill.js";
import { planGenerationTargets } from "../stages/planner.js";
import { pairEvidence } from "../stages/evidence/pairing.js";
import { buildStyleProfile } from "../stages/evidence/style-profile.js";

// Import quality validators without pulling the quality app runtime.
import { validateRelevance } from "../../../content-quality/src/relevance.js";
import { validateStructure } from "../../../content-quality/src/structural.js";
import { validateGrounding } from "../../../content-quality/src/grounding.js";
import { decide } from "../../../content-quality/src/gate.js";

const KNOWLEDGE_TEXT = `
Define-se concordância verbal como a relação de harmonia entre o verbo e o seu sujeito.
Com sujeito composto anteposto ao verbo, o verbo vai para o plural.
Por exemplo: chegaram o pai e o filho.
A regra exige atenção à norma-padrão da língua portuguesa.
`;

describe("fixture generation harness", () => {
  it("distills KUs, builds a brief, and emits grounded questions", () => {
    const units = distillChunkToUnits(KNOWLEDGE_TEXT, { maxUnits: 6 });
    assert.ok(units.length >= 2, `expected KU distill, got ${units.length}`);

    const kus = units.map((u, i) => ({
      id: `ku_fixture_${i + 1}`,
      kind: u.kind,
      statement: u.statement,
      example: u.example,
      qualifiers: u.qualifiers,
    }));

    const brief = buildGenerationBrief({
      examTitle: "TCE-GO 2026",
      org: "TCE-GO",
      banca: "FCC",
      path: ["Língua Portuguesa", "Sintaxe", "Concordância verbal"],
      rawText: "Concordância verbal e nominal",
      knowledgeUnits: kus,
      count: 3,
    });

    const { questions, system, user } = fixtureGenerateFromBrief(brief);
    assert.ok(questions.length >= 2);
    assert.match(system, /PROIBIDO/);
    assert.match(user, /Concordância verbal/);

    const good: string[] = [];
    const bad: string[] = [];

    for (const q of questions) {
      const structural = validateStructure(q);
      const relevance = validateRelevance({
        prompt: q.prompt,
        options: q.options,
        explanation: q.explanation,
        origin: "generation",
        syllabusNodeId: "leaf-concordancia-verbal",
        knowledgeUnitIds: q.knowledgeUnitIds,
      });
      const grounding = validateGrounding({
        knowledgeUnitIds: q.knowledgeUnitIds,
        allowedKnowledgeUnitIds: kus.map((k) => k.id),
        correctOption: q.options?.[q.correctIndex ?? 0] ?? null,
        explanation: q.explanation,
        citedStatements: kus
          .filter((k) => q.knowledgeUnitIds.includes(k.id))
          .map((k) => k.statement),
      });
      const verdict = decide({
        structural,
        relevance,
        grounding,
        judge: {
          score: 0.9,
          answerIndex: q.correctIndex ?? 0,
          reasons: ["fixture_judge"],
          notes: "fixture",
          model: "fixture",
        },
        correctIndex: q.correctIndex ?? null,
        thresholds: { publish: 0.8, fail: 0.4 },
        origin: "generation",
      });

      const line = `${q.prompt}\n  options: ${q.options?.join(" | ")}\n  correct=${q.correctIndex} decision=${verdict.decision}`;
      if (verdict.decision === "published" || (structural.ok && relevance.ok && grounding.ok)) {
        good.push(line);
      } else {
        bad.push(`${line}\n  reasons=${verdict.reasons.join(",")}`);
      }
    }

    // Metadata trivia must fail.
    const trivia = fixtureMetadataTriviaQuestion();
    const triviaRel = validateRelevance({
      prompt: trivia.prompt,
      options: trivia.options,
      explanation: trivia.explanation,
      origin: "generation",
      syllabusNodeId: "leaf-concordancia-verbal",
      knowledgeUnitIds: trivia.knowledgeUnitIds,
    });
    assert.equal(triviaRel.ok, false);
    bad.push(
      `${trivia.prompt}\n  options: ${trivia.options?.join(" | ")}\n  reasons=${triviaRel.reasons.join(",")}`,
    );

    assert.ok(good.length >= 1, "expected at least one good grounded question");

    const reportPath = resolve(
      __dirname,
      "../../../../fixtures/golden/generation/fixture-harness-output.md",
    );
    writeFileSync(
      reportPath,
      [
        "# Fixture generation output",
        "",
        "## Good",
        ...good.map((g) => `### Item\n\`\`\`\n${g}\n\`\`\``),
        "",
        "## Bad / Questionable",
        ...bad.map((g) => `### Item\n\`\`\`\n${g}\n\`\`\``),
        "",
      ].join("\n"),
      "utf8",
    );

    // Surface questions in test output for the implementation report.
    console.log("\n=== GOOD QUESTIONS ===\n" + good.join("\n\n"));
    console.log("\n=== BAD / QUESTIONABLE ===\n" + bad.join("\n\n"));
  });

  it("planner selects leaves with enough KUs", () => {
    const targets = planGenerationTargets([
      {
        syllabusNodeId: "a",
        examSlug: "tce-go-2026",
        canonicalKey: "lingua-portuguesa:concordancia-verbal",
        path: ["Língua Portuguesa", "Concordância verbal"],
        title: "Concordância verbal",
        rawText: "Concordância verbal",
        kuCount: 6,
        publishedCount: 0,
        pendingCount: 0,
      },
      {
        syllabusNodeId: "b",
        examSlug: "tce-go-2026",
        canonicalKey: "matematica:porcentagem",
        path: ["Matemática", "Porcentagem"],
        title: "Porcentagem",
        rawText: "Porcentagem",
        kuCount: 1,
        publishedCount: 0,
        pendingCount: 0,
      },
    ]);
    assert.equal(targets.length, 1);
    assert.equal(targets[0].syllabusNodeId, "a");
  });

  it("pairs prova and gabarito evidence", () => {
    const pairs = pairEvidence([
      {
        id: "p1",
        kind: "prova",
        examSlug: "tce-go-2026",
        title: "Prova Objetiva 2024 Técnico",
        sourceUrl: "https://banca.example/prova-2024.pdf",
      },
      {
        id: "g1",
        kind: "gabarito",
        examSlug: "tce-go-2026",
        title: "Gabarito Definitivo 2024",
        sourceUrl: "https://banca.example/gabarito-2024.pdf",
      },
    ]);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].provaId, "p1");
    assert.equal(pairs[0].gabaritoId, "g1");
    assert.equal(pairs[0].year, 2024);
  });

  it("builds a style profile from samples", () => {
    const profile = buildStyleProfile([
      {
        prompt: "Assinale a alternativa correta sobre concordância.",
        options: ["a".repeat(70), "b".repeat(70), "c".repeat(70), "d".repeat(70), "e".repeat(70)],
      },
      {
        prompt: "Considere as proposições e assinale a INCORRETA.",
        options: ["1", "2", "3", "4", "5"],
      },
    ]);
    assert.equal(profile.optionCount, 5);
    assert.ok(profile.commandVerbs.length >= 1);
  });
});
