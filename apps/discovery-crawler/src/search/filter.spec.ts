import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterSearchCandidates, rejectCandidateBeforeFetch } from "./filter.js";

describe("topic-query candidate filter §17.3", () => {
  it("rejects denylist domains and spam titles", () => {
    assert.equal(
      rejectCandidateBeforeFetch({
        url: "https://youtube.com/watch?v=1",
        title: "Aula",
      }),
      "denylist_domain",
    );
    assert.equal(
      rejectCandidateBeforeFetch({
        url: "https://planalto.gov.br/ccivil",
        title: "Baixe agora o curso completo",
      }),
      "title_spam",
    );
    assert.equal(
      rejectCandidateBeforeFetch({
        url: "https://planalto.gov.br/login",
        title: "Lei",
      }),
      "deny_path",
    );
    assert.equal(
      rejectCandidateBeforeFetch({
        url: "https://planalto.gov.br/doc?utm_source=x&a=1",
        title: "Lei",
      }),
      "tracking_param",
    );
  });

  it("keeps allowlisted clean candidates", () => {
    const kept = filterSearchCandidates([
      { url: "https://www.planalto.gov.br/ccivil_03/leis/l8112.htm", title: "Lei 8.112", rank: 1 },
      { url: "https://facebook.com/groups/1", title: "Grupo", rank: 1 },
      { url: "https://unknown.example/page", title: "Stuff", rank: 50 },
    ]);
    assert.equal(kept.length, 1);
    assert.ok(kept[0]!.url.includes("planalto"));
  });

  it("blocks document mirrors, news, foreign TLDs, binaries and listing paths before fetch", () => {
    const reasons = [
      "https://pt.scribd.com/document/7003/apostila",
      "https://g1.globo.com/concursos/noticia/2026/01/01/edital.ghtml",
      "https://bo.dsaj.gov.mo/bo/i/99/12/declei12.asp",
      "https://exemplo.gov.br/arquivos/prova.zip",
      "https://www.jusbrasil.com.br/jurisprudencia/123",
      "https://blog.exemplo.com.br/tag/portugues/page/3",
      "https://www.qconcursos.com/questoes-de-concursos/questoes/abc",
    ].map((url) => rejectCandidateBeforeFetch({ url, title: "x", snippet: "", rank: 1 }));
    assert.deepEqual(reasons, [
      "denylist_domain",
      "denylist_domain",
      "denylist_tld",
      "deny_file_type",
      "denylist_domain",
      "deny_path",
      "denylist_domain",
    ]);
    assert.equal(
      rejectCandidateBeforeFetch({
        url: "https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm",
        title: "Lei 8.666",
        snippet: "",
        rank: 1,
      }),
      null,
    );
  });
});
