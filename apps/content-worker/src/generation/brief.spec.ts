import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGenerationBrief,
  diversifyKnowledgeUnits,
  looksLikeListingTriviaStem,
  LISTING_TRIVIA_STEM_RE,
  type KnowledgeUnitRef,
} from "./brief.js";

function ku(id: string, domain: string): KnowledgeUnitRef {
  return {
    id,
    kind: "fact",
    statement: `Statement ${id} about the topic with enough length.`,
    example: null,
    qualifiers: [],
    sourceDomain: domain,
  };
}

describe("diversifyKnowledgeUnits §19.3", () => {
  it("caps any domain at 60% when multiple domains exist", () => {
    const units = [
      ...Array.from({ length: 10 }, (_, i) => ku(`a${i}`, "planalto.gov.br")),
      ...Array.from({ length: 5 }, (_, i) => ku(`b${i}`, "mec.gov.br")),
      ...Array.from({ length: 3 }, (_, i) => ku(`c${i}`, "stf.jus.br")),
    ];
    const picked = diversifyKnowledgeUnits(units, 10);
    assert.equal(picked.length, 10);
    const counts = new Map<string, number>();
    for (const u of picked) {
      const d = u.sourceDomain!;
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    assert.ok(counts.size >= 2);
    for (const n of counts.values()) {
      assert.ok(n <= 6, `domain share ${n} exceeds 60% of 10`);
    }
  });

  it("keeps single-domain lists intact", () => {
    const units = Array.from({ length: 5 }, (_, i) => ku(`x${i}`, "only.example"));
    assert.equal(diversifyKnowledgeUnits(units, 12).length, 5);
  });
});

describe("listing-trivia stem denylist (§43.2.3)", () => {
  it("flags REG-style listing stems and accepts knowledge stems", () => {
    assert.equal(
      looksLikeListingTriviaStem(
        "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo?",
      ),
      true,
    );
    assert.equal(
      looksLikeListingTriviaStem(
        "Qual associação oferece o 54º Exame para Certificação — CFP®?",
      ),
      true,
    );
    assert.equal(
      looksLikeListingTriviaStem(
        "Sobre concordância verbal, assinale a alternativa correta.",
      ),
      false,
    );
  });

  it("embeds stemDenylist in brief constraints", () => {
    const brief = buildGenerationBrief({
      examTitle: "Exame",
      examSlug: "exame",
      syllabusNodeId: "leaf-1",
      path: ["Língua Portuguesa", "Sintaxe", "Concordância verbal"],
      rawText: "Concordância verbal",
      knowledgeUnits: [ku("ku-1", "planalto.gov.br")],
      existingStems: [],
      count: 2,
    });
    assert.equal(brief.constraints.stemDenylist, LISTING_TRIVIA_STEM_RE.source);
    assert.ok(brief.constraints.forbidden.length >= 4);
  });
});
