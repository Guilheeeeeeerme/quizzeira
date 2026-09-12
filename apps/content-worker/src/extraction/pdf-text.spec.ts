import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { extractHtmlText } from "../stages/html-text.js";

/** Keep html extraction covered after pdf-text deletion. */
describe("html-text", () => {
  it("strips scripts and tags", () => {
    const html = "<html><script>x()</script><p>Hello&nbsp;world</p></html>";
    const text = extractHtmlText(html);
    assert.match(text, /Hello/);
    assert.doesNotMatch(text, /script|x\(\)/);
  });
});
