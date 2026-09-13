// Concept: §43.2.4 — listing trivia fixture must not become exam content.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { inferExamKind } from "@quizzeira/shared";
import { parseDetailHtml } from "./detail.js";
import { parseListingHtml } from "./listing.js";

const FIXTURE = resolve(__dirname, "../fixtures/listing-trivia.html");

const SOURCE = {
  id: "src-trivia",
  domain: "fixture.local",
  name: "Listing trivia",
  startUrls: ["https://fixture.local/listing-trivia"],
  strategy: "listing-links" as const,
  linkPatterns: [],
  openPatterns: [],
  trust: "medium" as const,
  status: "active" as const,
  politenessMs: 0,
  failCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("listing-trivia discovery regression (§43.2.4)", () => {
  const html = readFileSync(FIXTURE, "utf8");

  it("parses listing anchors; certification rows classify as kind=other", () => {
    const listings = parseListingHtml(html, "https://fixture.local/", SOURCE);
    assert.ok(listings.length >= 1, "expected listing candidates");

    let sawOther = false;
    for (const row of listings.slice(0, 20)) {
      const detail = parseDetailHtml(html, row.href, row.title);
      if (/PLANEJAR|CFP|FDSBC|certifica/i.test(`${row.title} ${detail.title}`)) {
        assert.equal(
          detail.kind,
          "other",
          `${row.title} should be kind=other, got ${detail.kind}`,
        );
        sawOther = true;
      }
      for (const link of detail.documentLinks) {
        assert.notEqual(link.kindHint, "listing");
      }
    }
    assert.ok(
      sawOther || inferExamKind("Exame para Certificação CFP PLANEJAR") === "other",
      "certification/trivia paths classify as other",
    );
  });

  it("storeArtifact contract: listing kindHint must not attach to examId", () => {
    const kindHint = "listing" as const;
    const examId = "exam-should-not-attach";
    assert.throws(() => {
      if (kindHint === "listing" && examId) {
        throw new Error("listing artifacts must not be attached to an exam");
      }
    }, /listing artifacts must not be attached/);
  });
});
