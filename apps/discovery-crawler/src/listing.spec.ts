import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import type { CrawlerSource } from "@quizzeira/shared";
import {
  filterOpenListings,
  listingsToOpenRecords,
  parseListingHtml,
} from "./listing.js";

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

  it("drops nav, privacy, and cookie-manager links", () => {
    const html = `
      <a href="/privacidade/#cmplz-manage-consent-container">Gerenciar opções</a>
      <a href="https://www.cookiedatabase.org/x">Cookie Database</a>
      <a href="/contato">Entre em contato</a>
      <a href="/noticias">NOTÍCIAS</a>
      <a href="/page_category/em-andamento/">EM ANDAMENTO</a>
      <a href="/concurso/transpetro-2026/">Transpetro 2026 inscrição aberta</a>
    `;
    const listings = parseListingHtml(html, "https://www.cesgranrio.org.br/", {
      linkPatterns: [],
      openPatterns: [],
    });
    assert.equal(listings.length, 1);
    assert.match(listings[0]!.href, /transpetro-2026/);
  });

  it("keeps certification/org detail URLs for detail-page classification (§40.3)", () => {
    const html = `
      <a href="/certificacao/cfp-planejar/">Exame CFP PLANEJAR inscrição</a>
      <a href="/concurso/tce-go-2026/">TCE-GO 2026 inscrição aberta</a>
    `;
    const listings = parseListingHtml(html, "https://fixture.local/", {
      linkPatterns: [],
      openPatterns: [],
    });
    assert.ok(listings.some((l) => /certificacao/i.test(l.href)));
    assert.ok(listings.some((l) => /tce-go/i.test(l.href)));
  });
});
