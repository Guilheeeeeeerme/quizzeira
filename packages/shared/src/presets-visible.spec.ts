import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRIMARY_PRESET_SLUGS, visibleTopicPresets, isPrimaryPresetSlug } from "./presets.js";

describe("open-exam-only product presets", () => {
  it("exposes only open_exam in visible presets", () => {
    assert.deepEqual([...PRIMARY_PRESET_SLUGS], ["open_exam"]);
    assert.equal(visibleTopicPresets().length, 1);
    assert.equal(visibleTopicPresets()[0].slug, "open_exam");
    assert.equal(isPrimaryPresetSlug("open_exam"), true);
    assert.equal(isPrimaryPresetSlug("entrevista"), false);
  });
});
