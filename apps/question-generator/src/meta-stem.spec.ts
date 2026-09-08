import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countMetaMaterialStems, isMetaMaterialStem } from "./meta-stem.js";

describe("isMetaMaterialStem", () => {
  it("flags edital / vacancy logistics stems from the Transpetro UI failure", () => {
    assert.equal(
      isMetaMaterialStem(
        "According to the Edital, what is the primary entity responsible for executing the public selection process?",
      ),
      true,
    );
    assert.equal(
      isMetaMaterialStem(
        "Based on the provided 'Quadro Vagas_Edital.pdf', list three different 'Ênfases' that have RIO DE JANEIRO as Polo",
      ),
      true,
    );
    assert.equal(
      isMetaMaterialStem(
        "What is the employment regime for candidates admitted to the Transpetro Public Selection Process?",
      ),
      true,
    );
    assert.equal(
      isMetaMaterialStem("For ENGENHARIA MECÂNICA, what is the total number of vagas for SÃO PAULO?"),
      true,
    );
  });

  it("allows subject-matter Administração stems", () => {
    assert.equal(
      isMetaMaterialStem(
        "In capital budgeting, what does NPV measure when evaluating a Transpetro investment project?",
      ),
      false,
    );
    assert.equal(
      isMetaMaterialStem(
        "Which tool maps processes and handoffs in administrative workflow redesign?",
      ),
      false,
    );
  });

  it("counts meta stems in a batch", () => {
    assert.equal(
      countMetaMaterialStems([
        { prompt: "Who is the organizadora of the certame?" },
        { prompt: "Explain working capital management." },
      ]),
      1,
    );
  });
});
