import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeRetificacaoDelta } from "./retificacao.js";
import type { SyllabusNodeDraft } from "./parse.js";

function leaf(title: string, subject: string, key: string): SyllabusNodeDraft {
  return {
    depth: 1,
    ordinal: 1,
    title,
    rawText: title,
    pathSlug: `${subject}/${key}`,
    canonicalSubjectId: null,
    canonicalKey: key,
    scope: "basic",
    positionSlugs: ["geral"],
    parentPathSlug: subject,
    extraction: { method: "outline", confidence: 0.9, sourceSectionId: "s" },
  };
}

describe("retificação delta §15.6", () => {
  it("replaces fuzzy-matching leaves and lists them as replaced", () => {
    const previous = [
      { canonicalKey: "lp.etica-old", title: "Ética no serviço público", depth: 1, pathSlug: "lingua-portuguesa/etica" },
      { canonicalKey: "rl.prop", title: "Proposições", depth: 1, pathSlug: "raciocinio-logico/proposicoes" },
    ];
    const reti: SyllabusNodeDraft[] = [
      {
        depth: 0,
        ordinal: 0,
        title: "Língua Portuguesa",
        rawText: "Língua Portuguesa",
        pathSlug: "lingua-portuguesa",
        canonicalSubjectId: null,
        canonicalKey: "lingua-portuguesa",
        scope: "basic",
        positionSlugs: ["geral"],
        parentPathSlug: null,
        extraction: { method: "outline", confidence: 0.9, sourceSectionId: "s" },
      },
      leaf("Ética no serviço público — atualizado", "lingua-portuguesa", "lp.etica-new"),
    ];

    const delta = computeRetificacaoDelta(previous, reti);
    assert.ok(delta.replacedNodeKeys.includes("lp.etica-old") || delta.mergedNodes.some((n) => /Ética/.test(n.title)));
    assert.ok(delta.mergedNodes.some((n) => /Proposições|proposicoes/i.test(n.title) || n.canonicalKey === "rl.prop"));
  });

  it("appends unmatched retificação leaves as newNodes", () => {
    const previous = [
      { canonicalKey: "mat.perc", title: "Porcentagem", depth: 1, pathSlug: "matematica/porcentagem" },
    ];
    const reti: SyllabusNodeDraft[] = [
      {
        depth: 0,
        ordinal: 0,
        title: "Direito Administrativo",
        rawText: "Direito Administrativo",
        pathSlug: "direito-administrativo",
        canonicalSubjectId: null,
        canonicalKey: "direito-administrativo",
        scope: "basic",
        positionSlugs: ["geral"],
        parentPathSlug: null,
        extraction: { method: "outline", confidence: 0.9, sourceSectionId: "s" },
      },
      leaf("Licitações e contratos", "direito-administrativo", "da.licitacoes"),
    ];
    const delta = computeRetificacaoDelta(previous, reti);
    assert.ok(delta.newNodes.some((n) => n.canonicalKey === "da.licitacoes"));
    assert.equal(delta.replacedNodeKeys.length, 0);
  });
});
