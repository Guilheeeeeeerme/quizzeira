/**
 * End-to-end: listing trivia page must not attach listing HTML as exam artifacts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { classifyExamKind, isConcursoEligible } from "@quizzeira/shared";
import { parseDetailHtml } from "./detail.js";
import { filterOpenListings, listingsToOpenRecords, parseListingHtml } from "./listing.js";

const listingHtml = readFileSync(
  resolve(__dirname, "../../../fixtures/golden/regression/listing-trivia/listing-page.html"),
  "utf8",
);

describe("pipeline listing-trivia (§43.2 #4)", () => {
  it("filters certification / non-concurso listings", () => {
    const source = {
      id: "src",
      domain: "portal.example",
      name: "Portal",
      startUrls: ["https://portal.example/concursos"],
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
    const listings = filterOpenListings(
      parseListingHtml(listingHtml, "https://portal.example/concursos", source),
      [],
    );
    const records = listingsToOpenRecords(listings, source);
    assert.ok(records.every((r) => isConcursoEligible(r.kind ?? "other")));
    assert.ok(
      !records.some((r) => /planejar|cfp|fdsbc/i.test(r.title)),
      "certification / processo seletivo rows must not become concurso exams",
    );
  });

  it("detail parse on listing HTML yields no exam document artifacts from the listing itself", () => {
    const detail = parseDetailHtml(listingHtml, "https://portal.example/concursos");
    // Listing anchors are concurso links, not edital/prova PDFs — no document candidates.
    assert.equal(
      detail.documents.filter((d) => d.kindHint !== "listing").length,
      0,
    );
  });

  it("classifies PLANEJAR as non-concurso", () => {
    assert.equal(
      classifyExamKind("PLANEJAR — 54º Exame para Certificação — CFP®"),
      "certification",
    );
  });
});
