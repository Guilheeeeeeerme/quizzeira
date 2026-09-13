import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { classifyHtml } from "./classify.js";

const listingHtml = readFileSync(
  resolve(__dirname, "../../../../fixtures/golden/regression/listing-trivia/listing-page.html"),
  "utf8",
);

test("listing HTML classifies as administrative", () => {
  const result = classifyHtml(listingHtml, "listing-doc", {
    kindHint: "listing",
    roleHint: "administrative",
  });
  assert.equal(result.role, "administrative");
  assert.ok(result.roleConfidence >= 0.75);
});
