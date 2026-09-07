import { describe, expect, it } from "vitest";
import {
  buildRank,
  filterTextGenGemini,
  filterTextGenOpenai,
  rankFor,
} from "./model-rank";

const seeds = [
  { provider: "openai" as const, model: "gpt-4o-mini", inputUsdPerMillion: 0.15 },
  { provider: "gemini" as const, model: "gemini-2.5-flash", inputUsdPerMillion: 0.3 },
  { provider: "openai" as const, model: "gpt-5-nano", inputUsdPerMillion: 0.05 },
  { provider: "gemini" as const, model: "gemini-2.5-flash-lite", inputUsdPerMillion: 0.1 },
  { provider: "openai" as const, model: "gpt-4.1-nano", inputUsdPerMillion: 0.1 },
];

describe("buildRank", () => {
  it("sorts by input price and filters by provider", () => {
    const rank = buildRank("openai", seeds, [], "gpt-5-nano", 5);
    expect(rank).toEqual(["gpt-5-nano", "gpt-4.1-nano", "gpt-4o-mini"]);
    const gemini = buildRank("gemini", seeds, [], "gemini-2.5-flash-lite", 5);
    expect(gemini).toEqual(["gemini-2.5-flash-lite", "gemini-2.5-flash"]);
  });

  it("keeps the configured default model first and never duplicates it", () => {
    const rank = buildRank("gemini", seeds, ["gemini-2.5-pro"], "gemini-2.5-flash-lite", 5);
    expect(rank[0]).toBe("gemini-2.5-flash-lite");
    expect(rank.filter((model) => model === "gemini-2.5-flash-lite")).toHaveLength(1);
  });

  it("respects topN including the default", () => {
    expect(buildRank("openai", seeds, [], "gpt-4.1-nano", 2)).toEqual([
      "gpt-4.1-nano",
      "gpt-5-nano",
    ]);
    expect(buildRank("openai", seeds, [], "gpt-4.1-nano", 1)).toEqual(["gpt-4.1-nano"]);
  });

  it("sorts discovered models without prices after priced seeds", () => {
    const rank = buildRank("gemini", seeds, ["gemini-new"], "gemini-2.5-flash-lite", 5);
    expect(rank).toEqual([
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-new",
    ]);
  });
});

describe("text-gen filters", () => {
  it("filters openai non-text models", () => {
    expect(
      filterTextGenOpenai([
        "gpt-4.1-mini",
        "text-embedding-3-small",
        "whisper-1",
        "tts-1",
        "dall-e-3",
        "moderation",
        "o4-mini",
      ]),
    ).toEqual(["gpt-4.1-mini", "o4-mini"]);
  });

  it("filters gemini entries to generateContent text models and strips prefixes", () => {
    expect(
      filterTextGenGemini([
        {
          name: "models/gemini-2.5-flash",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/text-embedding-004",
          supportedGenerationMethods: ["embedContent"],
        },
        {
          name: "models/gemini-2.5-flash-lite",
          supportedGenerationMethods: ["generateContent"],
        },
      ]),
    ).toEqual(["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  });
});

describe("rankFor", () => {
  it("starts from the seed table and honors env-configured defaults", () => {
    const gemini = rankFor("gemini");
    expect(gemini[0]).toBe("gemini-2.5-flash-lite");
    expect(gemini.length).toBeLessThanOrEqual(3);
    expect(gemini).toContain("gemini-2.5-flash");
    const openai = rankFor("openai");
    expect(openai[0]).toBe("gpt-5-nano");
    expect(openai.length).toBeLessThanOrEqual(3);
  });
});
