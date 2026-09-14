import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  studyUserCreateData,
  validateStudyUserCredentials,
} from "./admin-users-helpers.js";

describe("validateStudyUserCredentials", () => {
  it("rejects missing email or short password", () => {
    assert.equal(
      validateStudyUserCredentials("", "secret1"),
      "Email and password (min 6 chars) required",
    );
    assert.equal(
      validateStudyUserCredentials("a@b.com", "12345"),
      "Email and password (min 6 chars) required",
    );
  });

  it("accepts valid credentials", () => {
    assert.equal(validateStudyUserCredentials("a@b.com", "secret1"), null);
  });
});

describe("studyUserCreateData", () => {
  it("always forces role USER (study-only; ignores any client ADMIN attempt)", () => {
    const data = studyUserCreateData({
      email: "student@example.com",
      passwordHash: "hash",
      displayName: "Student",
    });
    assert.equal(data.role, "USER");
    assert.deepEqual(data, {
      email: "student@example.com",
      passwordHash: "hash",
      displayName: "Student",
      role: "USER",
    });
  });
});
