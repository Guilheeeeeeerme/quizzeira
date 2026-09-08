import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedMediaUrl, mediaUrlAllowlist } from "./media-url.js";
import { OutputPolicyError, screenModelOutput } from "./output-policy.js";

describe("media-url", () => {
  it("allows relative paths and allowlisted https hosts", () => {
    assert.equal(isAllowedMediaUrl("/figures/a.png"), true);
    assert.equal(isAllowedMediaUrl("https://upload.wikimedia.org/x.png"), true);
    assert.equal(isAllowedMediaUrl("https://commons.wikimedia.org/x.png"), true);
  });

  it("rejects data:, http, javascript, and unknown hosts", () => {
    assert.equal(isAllowedMediaUrl("data:image/png;base64,AAAA"), false);
    assert.equal(isAllowedMediaUrl("http://upload.wikimedia.org/x.png"), false);
    assert.equal(isAllowedMediaUrl("javascript:alert(1)"), false);
    assert.equal(isAllowedMediaUrl("https://evil.example/x.png"), false);
  });

  it("honors MEDIA_URL_ALLOWLIST overrides", () => {
    const list = mediaUrlAllowlist("cdn.example.com");
    assert.equal(isAllowedMediaUrl("https://cdn.example.com/a.png", list), true);
    assert.equal(isAllowedMediaUrl("https://upload.wikimedia.org/a.png", list), false);
  });
});

describe("output-policy", () => {
  it("blocks script and exfil payloads", () => {
    assert.throws(() => screenModelOutput('<script>alert(1)</script>'), OutputPolicyError);
    assert.throws(() => screenModelOutput("see https://webhook.site/abc"), OutputPolicyError);
  });

  it("allows ordinary feedback text", () => {
    assert.doesNotThrow(() => screenModelOutput("Review agent tool boundaries."));
  });
});
