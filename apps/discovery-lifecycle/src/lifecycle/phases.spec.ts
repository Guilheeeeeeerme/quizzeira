import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyTransition,
  canTransition,
  deriveNextPhase,
  phaseFromRegistrationStatus,
  registrationStatusForPhase,
} from "./phases.js";

describe("lifecycle phases", () => {
  it("maps OPEN/CLOSED domain language", () => {
    assert.equal(registrationStatusForPhase("registration_open"), "open");
    assert.equal(registrationStatusForPhase("registration_closed"), "closed");
    assert.equal(phaseFromRegistrationStatus("open"), "registration_open");
    assert.equal(phaseFromRegistrationStatus("closed"), "registration_closed");
  });

  it("allows idempotent self-transitions", () => {
    const t = applyTransition("registration_open", "registration_open", "admin");
    assert.ok(t);
    assert.equal(t.reason, "idempotent_noop");
  });

  it("rejects illegal edges", () => {
    assert.equal(canTransition("archived", "registration_open"), false);
    assert.equal(applyTransition("archived", "past_due", "admin"), null);
  });

  it("closes registration when end date passes", () => {
    const t = deriveNextPhase(
      {
        phase: "registration_open",
        registrationStatus: "open",
        registrationEnd: new Date("2020-01-01T00:00:00Z"),
      },
      new Date("2020-02-01T00:00:00Z"),
    );
    assert.ok(t);
    assert.equal(t.to, "registration_closed");
    assert.equal(t.registrationStatus, "closed");
    assert.equal(t.reason, "registration_end_passed");
  });

  it("opens from announced on OPEN signal", () => {
    const t = deriveNextPhase({
      phase: "announced",
      registrationStatus: "open",
    });
    assert.ok(t);
    assert.equal(t.to, "registration_open");
  });

  it("moves exam_done → past_due after examDate", () => {
    const t = deriveNextPhase(
      {
        phase: "exam_done",
        registrationStatus: "closed",
        examDate: new Date("2020-06-01T00:00:00Z"),
      },
      new Date("2020-06-02T00:00:00Z"),
    );
    assert.ok(t);
    assert.equal(t.to, "past_due");
  });

  it("soft-archives when purgeEligibleAt elapsed", () => {
    const t = deriveNextPhase(
      {
        phase: "past_due",
        registrationStatus: "closed",
        purgeEligibleAt: new Date("2020-01-01T00:00:00Z"),
      },
      new Date("2020-02-01T00:00:00Z"),
    );
    assert.ok(t);
    assert.equal(t.to, "archived");
  });
});
