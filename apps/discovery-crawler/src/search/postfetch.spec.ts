import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { htmlToRoughText, rejectAfterFetch } from "./postfetch.js";

describe("post-fetch filter §17.3", () => {
  it("rejects short and CTA-heavy pages", () => {
    assert.equal(rejectAfterFetch({ text: "curto" }), "too_short");
    const cta = Array.from({ length: 40 }, () =>
      "Assine o plano premium e compre com cupom agora. ",
    ).join("");
    assert.equal(rejectAfterFetch({ text: cta }), "cta_ratio");
  });

  it("accepts long Portuguese educational prose", () => {
    const text = Array.from(
      { length: 30 },
      () =>
        "A concordância verbal estabelece que o verbo deve concordar com o sujeito em número e pessoa. ",
    ).join("");
    assert.equal(rejectAfterFetch({ text, html: `<p>${text}</p>` }), null);
  });

  it("strips tags for rough text", () => {
    assert.ok(htmlToRoughText("<p>Lei <b>8.112</b></p>").includes("Lei 8.112"));
  });
});
