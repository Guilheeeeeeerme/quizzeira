import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_LOCALE,
  coerceLocale,
  detectLocale,
  translate,
} from "./locale.js";

describe("i18n locale", () => {
  it("defaults to pt when nothing is stored or detected", () => {
    assert.equal(DEFAULT_LOCALE, "pt");
    assert.equal(detectLocale({}), "pt");
    assert.equal(detectLocale({ stored: null, navigatorLanguage: "de-DE" }), "pt");
  });

  it("honors en override from storage or navigator", () => {
    assert.equal(detectLocale({ stored: "en" }), "en");
    assert.equal(detectLocale({ navigatorLanguage: "en-US" }), "en");
    assert.equal(coerceLocale("pt-BR"), "pt");
    assert.equal(coerceLocale("en-GB"), "en");
  });

  it("translates pt and leaves en keys as English source", () => {
    const dictionaries = {
      pt: { "Open exams": "Concursos abertos" },
      en: {},
    };
    assert.equal(translate(dictionaries, "pt", "Open exams"), "Concursos abertos");
    assert.equal(translate(dictionaries, "en", "Open exams"), "Open exams");
    assert.equal(
      translate(dictionaries, "pt", "Bank ready ({n})", { n: 3 }),
      "Bank ready (3)",
    );
  });
});
