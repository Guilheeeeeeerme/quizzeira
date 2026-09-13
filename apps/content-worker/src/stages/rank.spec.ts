import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickNearestRoleCentroid } from "./classify-centroid.js";
import { bonusesFromDomainStats, computePageRank, domainAuthority } from "./rank.js";

describe("classify centroid §14.3", () => {
  it("requires cosine margin ≥ 0.08", () => {
    const centroids = {
      knowledge: [1, 0, 0],
      administrative: [0, 1, 0],
      specification: [0, 0, 1],
      evidence: [0, 0.5, 0.5],
    } as const;
    assert.equal(pickNearestRoleCentroid([1, 0, 0], centroids)?.role, "knowledge");
    // Nearly equidistant between knowledge and administrative → reject.
    assert.equal(pickNearestRoleCentroid([0.7, 0.7, 0], centroids), null);
  });
});

describe("pageRank §19", () => {
  it("boosts .gov.br domains", () => {
    const gov = domainAuthority({ kind: "unknown", domain: "www.planalto.gov.br" });
    const plain = domainAuthority({ kind: "unknown", domain: "example.com" });
    assert.ok(gov > plain);
  });

  it("weights authority and density", () => {
    const rank = computePageRank({
      authority: 1,
      contentDensity: 1,
      syllabusRelevance: 1,
      structureScore: 1,
      freshnessOrStability: 1,
    });
    assert.equal(rank, 1);
  });

  it("applies DomainStats history and spam bonuses", () => {
    const good = bonusesFromDomainStats({
      fetched: 40,
      becameKnowledge: 25,
      rejectedLowValue: 2,
      avgDensity: 0.7,
    });
    assert.equal(good.historyBonus, 0.1);
    assert.equal(good.spamPenalty, 0);

    const spammy = bonusesFromDomainStats({
      fetched: 10,
      becameKnowledge: 1,
      rejectedLowValue: 5,
      avgDensity: 0.2,
    });
    assert.equal(spammy.spamPenalty, 0.3);
  });
});
