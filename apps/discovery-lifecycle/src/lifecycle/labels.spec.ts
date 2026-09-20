import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PHASE_LABEL_PT,
  phaseLabel,
  reasonLabel,
  registrationLabel,
} from "./labels.js";
import { EXAM_LIFECYCLE_PHASES } from "./phases.js";

describe("lifecycle labels (pt-BR)", () => {
  it("covers every phase in Portuguese", () => {
    for (const phase of EXAM_LIFECYCLE_PHASES) {
      assert.ok(PHASE_LABEL_PT[phase].length > 0);
      assert.equal(phaseLabel(phase, "pt"), PHASE_LABEL_PT[phase]);
    }
    assert.equal(phaseLabel("registration_open", "pt"), "Inscrições abertas");
    assert.equal(phaseLabel("registration_closed", "pt"), "Inscrições encerradas");
    assert.equal(registrationLabel("open", "pt"), "Inscrições abertas");
    assert.match(reasonLabel("registration_end_passed", "pt"), /inscri/i);
  });
});
