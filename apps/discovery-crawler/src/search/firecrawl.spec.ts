import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFirecrawlSearch } from "./firecrawl.js";

describe("firecrawl search provider §17.4c", () => {
  it("parses v1 array payloads and keeps engine order", () => {
    const out = parseFirecrawlSearch(
      {
        success: true,
        data: [
          { url: "https://www.planalto.gov.br/ccivil_03/leis/l8112.htm", title: "Lei 8.112" },
          { url: "https://exemplo.edu.br/resumo", title: "Resumo", description: "d" },
          { url: "https://exemplo.edu.br/resumo", title: "dup" },
        ],
      },
      10,
    );
    assert.equal(out.length, 2);
    assert.equal(out[0]!.rank, 1);
    assert.equal(out[1]!.rank, 12);
    assert.equal(out[1]!.snippet, "d");
  });

  it("parses v2 nested web payloads and honours limit", () => {
    const out = parseFirecrawlSearch(
      {
        data: {
          web: [
            { url: "https://a.br/1", title: "1" },
            { url: "https://a.br/2", title: "2" },
          ],
        },
      },
      1,
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]!.url, "https://a.br/1");
  });

  it("returns nothing on error payloads", () => {
    assert.deepEqual(parseFirecrawlSearch({ success: false, error: "x" }, 5), []);
  });
});
