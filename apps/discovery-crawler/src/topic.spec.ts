import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { AllowlistSearchProvider } from "./search/allowlist-provider.js";
import { WebApiSearchProvider } from "./search/web-api.js";
import { resolveSearchProvider } from "./topic.js";
import { crawlerEnv } from "./env.js";

describe("resolveSearchProvider (§17.4)", () => {
  const prevFixture = crawlerEnv.fixtureMode;

  afterEach(() => {
    crawlerEnv.fixtureMode = prevFixture;
  });

  it("uses SEARCH_API_URL when set (no Firecrawl path)", () => {
    crawlerEnv.fixtureMode = false;
    const provider = resolveSearchProvider({
      SEARCH_API_URL: "https://search.example/v1",
      FIRECRAWL_API_KEY: "should-be-ignored",
    } as NodeJS.ProcessEnv);
    assert.ok(provider instanceof WebApiSearchProvider);
  });

  it("falls back to allowlist-only without SEARCH_API_URL", () => {
    crawlerEnv.fixtureMode = false;
    const provider = resolveSearchProvider({
      FIRECRAWL_API_KEY: "should-be-ignored",
    } as NodeJS.ProcessEnv);
    assert.ok(provider instanceof AllowlistSearchProvider);
  });
});
