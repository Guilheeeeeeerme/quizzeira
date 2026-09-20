import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dateWindowChecker, runCheckers, crawlerOutputChecker } from "./checkers.js";

describe("registration checkers", () => {
  it("date window reports OPEN inside window", () => {
    const signal = dateWindowChecker.check({
      now: new Date("2020-01-15"),
      registrationStart: new Date("2020-01-01"),
      registrationEnd: new Date("2020-01-31"),
    });
    assert.ok(signal);
    assert.equal(signal.status, "open");
    assert.equal(signal.source, "date");
  });

  it("date window reports CLOSED after end", () => {
    const signal = dateWindowChecker.check({
      now: new Date("2020-02-01"),
      registrationEnd: new Date("2020-01-31"),
    });
    assert.ok(signal);
    assert.equal(signal.status, "closed");
  });

  it("prefers date checker over crawler", () => {
    const signal = runCheckers([dateWindowChecker, crawlerOutputChecker], {
      now: new Date("2020-02-01"),
      registrationEnd: new Date("2020-01-31"),
      crawlerStatus: "open",
      statusSource: "regex",
    });
    assert.equal(signal.status, "closed");
    assert.equal(signal.source, "date");
  });
});
