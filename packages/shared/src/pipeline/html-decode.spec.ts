import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeHtmlBytes, sniffHtmlCharset } from "./html-decode";

const latin1 = (s: string) => Buffer.from(s, "latin1");

describe("charset-aware HTML decoding", () => {
  it("prefers the HTTP header, then <meta>, then UTF-8", () => {
    const meta = latin1('<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"></head><body>Presidência</body></html>');
    assert.equal(sniffHtmlCharset(meta, null), "windows-1252");
    assert.equal(sniffHtmlCharset(meta, "text/html; charset=UTF-8"), "utf-8");
    assert.equal(sniffHtmlCharset(Buffer.from("<html><body>ok</body></html>"), "text/html"), "utf-8");
    assert.equal(decodeHtmlBytes(meta, null).html.includes("Presidência"), true);
  });
  it("recovers latin-1 bytes mislabelled as UTF-8", () => {
    const body = "Presidência da República ".repeat(30);
    const bytes = latin1(`<html><head><meta charset="utf-8"></head><body>${body}</body></html>`);
    const { html, charset } = decodeHtmlBytes(bytes, "text/html; charset=utf-8");
    assert.equal(charset, "windows-1252");
    assert.ok(html.includes("Presidência da República"));
  });
  it("decodes real UTF-8 untouched", () => {
    const bytes = Buffer.from("<html><body>Concordância verbal</body></html>", "utf8");
    assert.equal(decodeHtmlBytes(bytes, null).html.includes("Concordância verbal"), true);
  });
});
