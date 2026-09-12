import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractMetadataFeatures,
  isQuestionMetadataRejected,
  metadataProbability,
  questionTestsExamMetadata,
  questionTestsSyllabusMeta,
} from "./metadata.js";

describe("metadata classifier", () => {
  it("scores administrative edital sections high", () => {
    const adminText =
      "Das Inscrições. O candidato deverá efetuar o pagamento da taxa de inscrição de R$ 120,00 " +
      "no período de 01/03/2026 a 30/03/2026. Vagas: 50. Local de prova: Goiânia. " +
      "Edital nº 01/2026. Contato: (62) 3201-0000 ou inscricao@tce.go.gov.br. " +
      "TCE-GO Cesgranrio convocação homologação posse.";

    const score = metadataProbability(adminText);
    assert.ok(score > 0.5, `expected > 0.5, got ${score}`);
    assert.equal(isQuestionMetadataRejected(adminText), true);
  });

  it("scores educational content low despite dates and currency", () => {
    const contentText =
      "A concordância verbal exige que o verbo concorde com o sujeito em número e pessoa. " +
      "Por exemplo, em 'Os alunos estudaram', o verbo está no plural. " +
      "Define-se regência como a relação de dependência entre verbos e complementos. " +
      "Art. 5º da CF/88 garante liberdade de expressão. Lei nº 8.112/1990 disciplina o " +
      "regime jurídico dos servidores públicos federais.";

    const score = metadataProbability(contentText);
    assert.ok(score < 0.35, `expected < 0.35, got ${score}`);
    assert.equal(isQuestionMetadataRejected(contentText), false);

    const features = extractMetadataFeatures(contentText);
    assert.ok(features.legalCitationDensity > 0);
    assert.ok(features.explanatoryMarkers > 0);
  });

  it("flags screenshot-style metadata questions", () => {
    const q =
      "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo? " +
      "Vagas para Técnico de Controle Externo. Taxa de inscrição R$ 100,00.";
    assert.ok(metadataProbability(q) > 0.5);
  });

  it("flags §41.4 venue and edital stems via questionTestsExamMetadata", () => {
    assert.equal(questionTestsExamMetadata("Em que cidade será aplicada a prova objetiva?"), true);
    assert.equal(questionTestsExamMetadata("Qual o número do edital de abertura?"), true);
    assert.equal(
      questionTestsSyllabusMeta(
        "Quais assuntos de Língua Portuguesa constam no conteúdo programático?",
      ),
      true,
    );
  });
});
