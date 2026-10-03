import { describe, expect, it } from "vitest";
import { SEED_TABLE, buildRank, filterTextGenGemini, rankFor, rankForTier } from "./model-rank";

const seeds = [
  { provider: "gemini" as const, model: "gemini-2.5-flash", inputUsdPerMillion: 0.3 },
  { provider: "gemini" as const, model: "gemini-2.5-flash-lite", inputUsdPerMillion: 0.1 },
];

describe("buildRank", () => {
  it("sorts by input price and filters by provider", () => {
    const gemini = buildRank("gemini", seeds, [], "gemini-2.5-flash-lite", 5);
    expect(gemini).toEqual(["gemini-2.5-flash-lite", "gemini-2.5-flash"]);
    expect(buildRank("fixture", seeds, [], "fixture-v1", 5)).toEqual(["fixture-v1"]);
  });

  it("keeps the configured default model first and never duplicates it", () => {
    const rank = buildRank("gemini", seeds, ["gemini-2.5-pro"], "gemini-2.5-flash-lite", 5);
    expect(rank[0]).toBe("gemini-2.5-flash-lite");
    expect(rank.filter((model) => model === "gemini-2.5-flash-lite")).toHaveLength(1);
  });

  it("respects topN including the default", () => {
    expect(buildRank("gemini", seeds, [], "gemini-2.5-flash", 2)).toEqual([
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ]);
    expect(buildRank("gemini", seeds, [], "gemini-2.5-flash", 1)).toEqual(["gemini-2.5-flash"]);
  });

  it("sorts discovered models without prices after priced seeds", () => {
    const rank = buildRank("gemini", seeds, ["gemini-new"], "gemini-2.5-flash-lite", 5);
    expect(rank).toEqual(["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-new"]);
  });
});

describe("text-gen filters", () => {
  it("filters gemini entries to generateContent text models and strips prefixes", () => {
    expect(
      filterTextGenGemini([
        { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
        { name: "models/gemini-2.5-flash-lite", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
      ]),
    ).toEqual(["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  });
});

describe("Gemini-only catalog (OpenAI removed)", () => {
  it("has no non-Gemini seeds", () => {
    expect(SEED_TABLE.every((seed) => seed.provider === "gemini")).toBe(true);
    expect(SEED_TABLE.map((seed) => seed.model).join(" ")).not.toMatch(/gpt|o\d-|openai/i);
  });

  it("rankFor starts from the seed table and honors env-configured defaults", () => {
    const gemini = rankFor("gemini");
    expect(gemini[0]).toBe("gemini-2.5-flash-lite");
    expect(gemini.length).toBeLessThanOrEqual(3);
    expect(gemini).toContain("gemini-2.5-flash");
    expect(rankFor("fixture")).toEqual(["fixture-v1"]);
  });

  it("every tier resolves to Gemini models only", () => {
    for (const tier of ["cheap", "mid", "strong"] as const) {
      const rank = rankForTier("gemini", tier);
      expect(rank.length).toBeGreaterThan(0);
      expect(rank.every((m) => m.startsWith("gemini-"))).toBe(true);
    }
  });
});
