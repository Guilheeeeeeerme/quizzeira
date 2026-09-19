import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzePost } from "./detect.js";
import type { SocialPost } from "./types.js";

/**
 * Contract: social scout never proposes a social hostname as a handoff domain.
 * Outbound file hosts carry kindHint/roleHint aligned with shared classifyDocumentHints.
 */
describe("social → discovery contract", () => {
  it("fixture-shaped post yields cebraspe candidate not telegram", () => {
    const post: SocialPost = {
      platform: "telegram",
      externalId: "msg-9",
      feedLabel: "@concursos_br",
      permalink: "https://t.me/concursos_br/9",
      text: "Gabarito oficial: https://www.cesgranrio.org.br/eventos/concurso/x/gabarito.pdf veja no canal",
      observedAt: "2026-09-19T00:00:00.000Z",
    };
    const signal = analyzePost(post);
    assert.ok(signal.files.length >= 1);
    for (const f of signal.files) {
      const host = new URL(f.url).hostname.replace(/^www\./, "");
      assert.notEqual(host, "t.me");
      assert.notEqual(host, "telegram.me");
      assert.match(host, /cesgranrio/);
      assert.equal(f.kindHint, "gabarito");
      assert.equal(f.roleHint, "evidence");
    }
  });

  it("attachment URLs are considered", () => {
    const post: SocialPost = {
      platform: "reddit",
      externalId: "abc",
      text: "concurso aberto, material anexo",
      attachmentUrls: ["https://portal.vunesp.com.br/editais/foo-edital.pdf"],
      observedAt: "2026-09-19T00:00:00.000Z",
    };
    const signal = analyzePost(post);
    assert.equal(signal.files.length, 1);
    assert.equal(signal.files[0]?.kindHint, "edital");
  });
});
