import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import { extractHtmlText, extractPdfText, readTextOperators } from "./pdf-text";

test("reads Tj literals", () => {
  assert.equal(readTextOperators("BT (Edital n. 1) Tj ET"), "Edital n. 1");
});

test("reads TJ arrays and joins the pieces", () => {
  assert.equal(readTextOperators("[(Con) -20 (curso)] TJ"), "Concurso");
});

test("decodes escapes and octal codes", () => {
  assert.equal(readTextOperators("(A\\(B\\)) Tj"), "A(B)");
  assert.equal(readTextOperators("(\\101) Tj"), "A");
});

test("ignores positioning and graphics operators", () => {
  assert.equal(readTextOperators("1 0 0 1 72 720 Tm 0 g (Texto) Tj"), "Texto");
});

test("extracts text from a flate-compressed content stream", () => {
  const content = "BT (Conteudo programatico) Tj ET";
  const compressed = deflateSync(Buffer.from(content, "latin1"));
  const pdf = Buffer.concat([
    Buffer.from("%PDF-1.4\n4 0 obj\n<< /Length 1 >>\nstream\n", "latin1"),
    compressed,
    Buffer.from("\nendstream\nendobj\n", "latin1"),
  ]);

  const result = extractPdfText(pdf);
  assert.equal(result.streamCount, 1);
  assert.equal(result.decodedStreams, 1);
  assert.match(result.text, /Conteudo programatico/);
});

test("an image-only PDF yields empty text rather than throwing", () => {
  const pdf = Buffer.from("%PDF-1.4\n% no streams here\n", "latin1");
  const result = extractPdfText(pdf);
  assert.equal(result.text, "");
  assert.equal(result.streamCount, 0);
});

test("html artifacts are reduced to readable text", () => {
  const html =
    "<html><head><style>b{}</style></head><body><h1>Edital</h1><p>Vagas&nbsp;10</p>" +
    "<script>x()</script></body></html>";
  const text = extractHtmlText(html);
  assert.match(text, /Edital/);
  assert.match(text, /Vagas 10/);
  assert.doesNotMatch(text, /x\(\)/);
  assert.doesNotMatch(text, /</);
});
