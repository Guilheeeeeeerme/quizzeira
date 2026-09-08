import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import type { CrawlerSource } from "@quizzeira/shared";
import {
  filterOpenListings,
  listingsToOpenRecords,
  parseListingHtml,
} from "./listing-parse.js";

const source = {
  id: "fixture-src",
  domain: "fixture.local",
  linkPatterns: ["concurso", "edital", "transpetro", "banco", "exam"],
  openPatterns: ["inscri", "aberto", "edital publicado", "open"],
} as Pick<CrawlerSource, "id" | "domain" | "linkPatterns" | "openPatterns">;

describe("parseListingHtml", () => {
  it("extracts open exam links from fixture HTML", () => {
    const html = readFileSync(
      resolve(__dirname, "../fixtures/open-listing.html"),
      "utf8",
    );
    const listings = parseListingHtml(html, "https://fixture.local/", source);
    assert.ok(listings.length >= 2);
    const open = filterOpenListings(listings, source.openPatterns);
    assert.ok(open.some((l) => /transpetro/i.test(l.title)));

    const records = listingsToOpenRecords(open, {
      ...(source as CrawlerSource),
      name: "Fixture",
      startUrls: ["https://fixture.local/"],
      strategy: "fixture",
      trust: "high",
      status: "active",
      politenessMs: 0,
      failCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.ok(records.some((r) => r.examSlug.includes("transpetro")));
    assert.ok(records.some((r) => r.status === "open"));
  });
});
