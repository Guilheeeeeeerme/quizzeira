import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isDeniedCatalogDomain,
  selectCatalogBatch,
  sourceCatalog,
} from "./catalog.js";

describe("discovery-source-catalog", () => {
  it("ships P0 official portals and never commercial Q-banks", () => {
    assert.ok(sourceCatalog.sources.some((s) => s.id === "cebraspe-concursos"));
    assert.ok(sourceCatalog.sources.some((s) => s.id === "enare-hubrasil"));
    assert.ok(sourceCatalog.sources.some((s) => s.id === "oab-fgv"));
    assert.ok(sourceCatalog.doNotScrape.includes("qconcursos.com"));
    assert.ok(sourceCatalog.doNotScrape.includes("pciconcursos.com.br"));
  });

  it("rotates catalog batches without inventing domains", () => {
    const a = selectCatalogBatch(0, 3, "P0");
    assert.equal(a.items.length, 3);
    assert.ok(a.items.every((s) => s.priority === "P0"));
    const b = selectCatalogBatch(a.nextCursor, 3, "P0");
    assert.equal(b.items.length, 3);
  });

  it("denies commercial banks listed in doNotScrape", () => {
    assert.equal(isDeniedCatalogDomain("www.qconcursos.com"), true);
    assert.equal(isDeniedCatalogDomain("cebraspe.org.br"), false);
  });
});
