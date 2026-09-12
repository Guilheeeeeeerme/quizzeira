import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldRejectBeforeFetch } from "./search/filter.js";
import { parseRobotsTxt, isPathAllowed } from "./robots.js";
import { assertSafeUrl } from "./fetch.js";

describe("search filter", () => {
  it("rejects denylisted domains and checkout paths", () => {
    assert.equal(shouldRejectBeforeFetch({ url: "https://youtube.com/watch?v=1" }), "domain_denylist");
    assert.equal(
      shouldRejectBeforeFetch({ url: "https://study.example/carrinho/item" }),
      "path_denylist",
    );
    assert.equal(
      shouldRejectBeforeFetch({ url: "https://good.example/artigo", title: "Baixe agora o curso completo" }),
      "title_denylist",
    );
    assert.equal(shouldRejectBeforeFetch({ url: "https://planalto.gov.br/lei" }), null);
  });
});

describe("robots", () => {
  it("parses disallow rules", () => {
    const disallow = parseRobotsTxt("User-agent: *\nDisallow: /admin\nDisallow: /private\n");
    assert.deepEqual(disallow, ["/admin", "/private"]);
    assert.equal(isPathAllowed("https://x.test/admin/x", disallow), false);
    assert.equal(isPathAllowed("https://x.test/public", disallow), true);
  });
});

describe("SSRF guard", () => {
  it("blocks localhost and non-http schemes", () => {
    assert.throws(() => assertSafeUrl("http://127.0.0.1/secret"), /ssrf/);
    assert.throws(() => assertSafeUrl("file:///etc/passwd"), /unsupported/);
    assert.ok(assertSafeUrl("https://planalto.gov.br/ccivil_03/constituicao/constituicao.htm"));
  });
});
