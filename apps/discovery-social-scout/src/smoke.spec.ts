import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createXPublicAdapter } from "./adapters/x-public.js";
import { createGoogleCseAdapter } from "./adapters/google-cse.js";

/**
 * Optional live smoke — skipped unless DISCOVERY_SOCIAL_SMOKE=true and keys present.
 * Never required for CI.
 */
describe("live smoke (optional)", () => {
  it("x recent search when bearer present", async () => {
    if (process.env.DISCOVERY_SOCIAL_SMOKE !== "true" || !process.env.X_BEARER_TOKEN) {
      return;
    }
    const result = await createXPublicAdapter({
      keywords: ["concurso"],
      maxResults: 10,
    }).fetchRecent();
    assert.notEqual(result.status, "disabled");
  });

  it("google CSE when key+cx present", async () => {
    if (
      process.env.DISCOVERY_SOCIAL_SMOKE !== "true" ||
      !process.env.GOOGLE_CSE_API_KEY ||
      !process.env.GOOGLE_CSE_CX
    ) {
      return;
    }
    const result = await createGoogleCseAdapter({
      keywords: ["concurso edital"],
      resultsPerKeyword: 2,
    }).fetchRecent();
    assert.notEqual(result.status, "disabled");
  });
});
