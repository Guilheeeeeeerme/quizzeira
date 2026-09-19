import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzePost, isSocialHost, looksExamTalk } from "./detect.js";
import type { SocialPost } from "./types.js";

describe("detect", () => {
  it("flags concurso language", () => {
    assert.equal(looksExamTalk("Saiu o edital do concurso público"), true);
    assert.equal(looksExamTalk("bom dia galera"), false);
  });

  it("treats social hosts as non-sources", () => {
    assert.equal(isSocialHost("t.me"), true);
    assert.equal(isSocialHost("reddit.com"), true);
    assert.equal(isSocialHost("cebraspe.org.br"), false);
  });

  it("extracts outbound PDF with kindHint edital", () => {
    const post: SocialPost = {
      platform: "fixture",
      externalId: "1",
      text: "Edital: https://www.cebraspe.org.br/concursos/x/edital.pdf",
      observedAt: new Date().toISOString(),
    };
    const signal = analyzePost(post);
    assert.equal(signal.examRelevant, true);
    assert.equal(signal.files.length, 1);
    assert.equal(signal.files[0]?.kindHint, "edital");
    assert.equal(signal.files[0]?.roleHint, "specification");
  });

  it("drops file links that stay on social hosts", () => {
    const post: SocialPost = {
      platform: "telegram",
      externalId: "2",
      text: "PDF no canal https://t.me/concursos/123",
      observedAt: new Date().toISOString(),
    };
    const signal = analyzePost(post);
    assert.equal(signal.files.length, 0);
  });

  it("ignores unrelated chatter", () => {
    const post: SocialPost = {
      platform: "fixture",
      externalId: "3",
      text: "Alguém jogando hoje?",
      observedAt: new Date().toISOString(),
    };
    const signal = analyzePost(post);
    assert.equal(signal.examRelevant, false);
    assert.equal(signal.files.length, 0);
  });
});
