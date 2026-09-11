import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugifyKey } from "./slug";
import { subjectSlug } from "./content";

describe("slugifyKey", () => {
  it("lowercases and hyphenates", () => {
    assert.equal(slugifyKey("Transpetro / Cesgranrio"), "transpetro-cesgranrio");
  });

  it("strips Portuguese diacritics", () => {
    assert.equal(slugifyKey("Administração Financeira"), "administracao-financeira");
    assert.equal(slugifyKey("Língua Portuguesa"), "lingua-portuguesa");
  });

  it("trims leading and trailing separators", () => {
    assert.equal(slugifyKey("  --Edital 2026!!  "), "edital-2026");
  });

  it("falls back to 'unknown' for empty input", () => {
    assert.equal(slugifyKey(""), "unknown");
    assert.equal(slugifyKey(null), "unknown");
    assert.equal(slugifyKey("!!!"), "unknown");
  });

  it("respects the length cap", () => {
    assert.equal(slugifyKey("a".repeat(100), 10).length, 10);
  });

  it("is stable across calls", () => {
    assert.equal(slugifyKey("Polícia Federal"), slugifyKey("Polícia Federal"));
  });
});

describe("subjectSlug", () => {
  it("shares slug rules with slugifyKey", () => {
    assert.equal(subjectSlug("Direito Administrativo"), "direito-administrativo");
  });

  it("defaults to 'geral' so an unlabelled subject still indexes", () => {
    assert.equal(subjectSlug(""), "geral");
    assert.equal(subjectSlug("---"), "geral");
  });
});
