import { describe, expect, it } from "vitest";
import { currentRunId, newRunId, withRunId, withRunIdAsync } from "./run-id";

describe("run-id (§31.3)", () => {
  it("isolates run id in async local storage", () => {
    expect(currentRunId()).toBeUndefined();
    const id = newRunId();
    withRunId(id, () => {
      expect(currentRunId()).toBe(id);
    });
    expect(currentRunId()).toBeUndefined();
  });

  it("propagates through async work", async () => {
    const id = newRunId();
    await withRunIdAsync(id, async () => {
      await Promise.resolve();
      expect(currentRunId()).toBe(id);
    });
    expect(currentRunId()).toBeUndefined();
  });
});
