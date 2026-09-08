import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeQuestionPresentation,
  stripEmbeddedChoicesFromPrompt,
  stripLeadingChoiceLabel,
} from "./question-format.js";

describe("question-format", () => {
  it("strips duplicated A-E block from stem when options exist", () => {
    const prompt =
      "Em relação à classificação dos documentos, assinale a alternativa correta:\n" +
      "A) Documentos de arquivo são aqueles...\n" +
      "B) Documentos de arquivo são aqueles...\n" +
      "C) Documentos correntes...\n" +
      "D) Protocolo...\n" +
      "E) Gestão...";
    const options = [
      "A) Documentos de arquivo são aqueles...",
      "B) Documentos de arquivo são aqueles...",
      "C) Documentos correntes...",
      "D) Protocolo...",
      "E) Gestão...",
    ];
    const cleaned = stripEmbeddedChoicesFromPrompt(prompt, options);
    assert.match(cleaned, /assinale a alternativa correta/i);
    assert.doesNotMatch(cleaned, /^A\)/m);
    assert.equal(stripLeadingChoiceLabel(options[0]!), "Documentos de arquivo são aqueles...");
  });

  it("extracts markdown images into media arrays", () => {
    const normalized = normalizeQuestionPresentation({
      prompt: "Observe a figura:\n\n![Organograma](https://cdn.example.com/org.png)\n\nAssinale:",
      options: ["Opção 1 ![alt](https://cdn.example.com/a.png)", "Opção 2"],
    });
    assert.equal(normalized.promptMedia.length, 1);
    assert.equal(normalized.promptMedia[0]?.url, "https://cdn.example.com/org.png");
    assert.doesNotMatch(normalized.prompt, /!\[/);
    assert.equal(normalized.optionMedia?.[0]?.[0]?.url, "https://cdn.example.com/a.png");
    assert.equal(normalized.options?.[0], "Opção 1");
  });
});
