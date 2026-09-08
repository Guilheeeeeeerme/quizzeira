import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertOpenExamOnlyPreset, catalogSlugHint } from "../lib/exam-product.js";

describe("assertOpenExamOnlyPreset", () => {
  it("allows open_exam and nullish", () => {
    assert.doesNotThrow(() => assertOpenExamOnlyPreset("open_exam"));
    assert.doesNotThrow(() => assertOpenExamOnlyPreset(null));
    assert.doesNotThrow(() => assertOpenExamOnlyPreset(undefined));
  });

  it("rejects other presets", () => {
    assert.throws(
      () => assertOpenExamOnlyPreset("entrevista"),
      (err: Error & { statusCode?: number }) =>
        err.statusCode === 400 && /Only open exam/.test(err.message),
    );
  });
});

describe("catalogSlugHint", () => {
  it("slugifies titles", () => {
    assert.match(catalogSlugHint("Transpetro PSP"), /transpetro/);
  });
});
