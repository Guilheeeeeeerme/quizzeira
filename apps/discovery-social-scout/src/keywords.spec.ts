import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SOCIAL_KEYWORDS, resolveKeywords } from "./keywords.js";
import {
  DEFAULT_SOCIAL_LOCALE,
  googleQuerySuffix,
  providerLocaleParams,
  resolveSocialLocale,
} from "./locale.js";

describe("pt-BR social keywords + locale", () => {
  const cleared = [
    "DISCOVERY_SOCIAL_KEYWORDS",
    "DISCOVERY_SOCIAL_KEYWORDS_EXTRA",
    "DISCOVERY_SOCIAL_LOCALE",
  ];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of cleared) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of cleared) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("defaults to Brazilian concurso vocabulary", () => {
    const kws = resolveKeywords();
    assert.deepEqual(kws, DEFAULT_SOCIAL_KEYWORDS);
    assert.ok(kws.some((k) => /edital/i.test(k)));
    assert.ok(kws.some((k) => /inscri/i.test(k)));
    assert.ok(kws.some((k) => /gabarito/i.test(k)));
    assert.ok(kws.some((k) => /Cebraspe|CESPE/i.test(k)));
    assert.ok(kws.some((k) => /FCC/i.test(k)));
    assert.ok(kws.some((k) => /FGV/i.test(k)));
    assert.equal(
      kws.some((k) => /\b(exam|notice|answer key)\b/i.test(k)),
      false,
      "English exam jargon must not be default",
    );
  });

  it("appends EXTRA without replacing defaults", () => {
    process.env.DISCOVERY_SOCIAL_KEYWORDS_EXTRA = "civil service exam,notice PDF";
    const kws = resolveKeywords();
    assert.ok(kws.includes("concurso edital"));
    assert.ok(kws.includes("civil service exam"));
  });

  it("locale defaults to pt-BR with provider params", () => {
    assert.equal(resolveSocialLocale(), DEFAULT_SOCIAL_LOCALE);
    const p = providerLocaleParams();
    assert.equal(p.xLangOperator, "lang:pt");
    assert.equal(p.googleLr, "lang_pt");
    assert.equal(p.googleGl, "br");
    assert.equal(p.googleHl, "pt-BR");
    assert.equal(p.youtubeRelevanceLanguage, "pt");
    assert.equal(p.youtubeRegionCode, "BR");
    assert.match(googleQuerySuffix(), /edital/);
  });

  it("optional en locale flips provider params", () => {
    process.env.DISCOVERY_SOCIAL_LOCALE = "en";
    assert.equal(resolveSocialLocale(), "en");
    const p = providerLocaleParams();
    assert.equal(p.xLangOperator, "lang:en");
    assert.equal(p.googleGl, "us");
    assert.equal(p.youtubeRegionCode, "US");
  });
});
