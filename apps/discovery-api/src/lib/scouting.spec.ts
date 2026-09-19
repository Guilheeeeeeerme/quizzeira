import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hardDeny, scoreCandidate } from "./scouting.js";

describe("hard deny (§6.1)", () => {
  it("rejects social and storefront/login domains before proposal creation", () => {
    const instagram = hardDeny("", ["https://www.instagram.com/portal"]);
    assert.ok(instagram && /social/.test(instagram));
    const login = hardDeny("Portal", ["https://login.ibge.gov/x"]);
    assert.ok(login && /login/.test(login));
    const store = hardDeny("Minha Loja", ["https://minhaloja.com.br/edital"]);
    assert.ok(store && /storefront/.test(store));
    assert.equal(hardDeny("Diário Oficial", ["https://www.in.gov.br/arquivo"]), null);
  });
});

describe("deterministic scoring (§6.1)", () => {
  it("official government domains reach auto-activate", () => {
    const result = scoreCandidate({
      urls: ["https://www.in.gov.br/arquivos"],
      name: "Diário Oficial da União",
      robotsAllowed: true,
      domainStats: { fetched: 10, becameKnowledge: 10, rejectedLowValue: 0, avgDensity: 0.9 },
      priorSources: 1,
    });
    assert.equal(result.classification, "official");
    assert.ok(result.score >= 0.75, `score ${result.score}`);
    assert.equal(result.decision, "auto_activate");
  });

  it("recognized banca reaches auto-activate with proven signals", () => {
    const result = scoreCandidate({
      urls: ["https://www.cebraspe.com.br/candidatos"],
      name: "Cebraspe Concursos e Editais",
      robotsAllowed: true,
      domainStats: { fetched: 10, becameKnowledge: 9, rejectedLowValue: 0 },
      priorSources: 1,
    });
    assert.equal(result.classification, "banca");
    assert.ok(result.score >= 0.6, `score ${result.score}`);
    assert.equal(result.decision, "auto_activate");
  });

  it("unknown small portals stay in observe/quarantine bands", () => {
    const result = scoreCandidate({
      urls: ["https://portal-exemplos.com.br/concursos"],
      name: "Portal exemplos",
      robotsAllowed: true,
    });
    assert.equal(result.classification, "unknown");
    assert.ok(result.score < 0.85);
    assert.match(result.decision, /quarantine|observe/);
  });

  it("robots-blocked and zero-yield candidates cannot auto-activate", () => {
    const result = scoreCandidate({
      urls: ["https://www.tce.sp.gov.br/licitacoes"],
      name: "TCE SP licitações",
      robotsAllowed: false,
      domainStats: { fetched: 20, becameKnowledge: 1, rejectedLowValue: 18 },
    });
    assert.equal(result.decision, "quarantine");
    assert.ok(result.score < 0.85);
  });
});

