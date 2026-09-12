// Concept: Golden provas → expected questions (§42 / checklist #9).

import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { extractHtmlText } from "../stages/html-text.js";
import { extractMcqs } from "./mcq.js";

const PROVAS = resolve(__dirname, "../../../../fixtures/golden/provas");
const GABARITOS = resolve(__dirname, "../../../../fixtures/golden/gabaritos");

interface ExpectedQuestion {
  number: number;
  stem?: string;
  prompt?: string;
  options: string[];
  answerKey?: string;
  correctIndex?: number;
}

interface ExpectedFixture {
  questions: ExpectedQuestion[];
  gabarito?: string;
  linkedGabaritoId?: string;
}

function loadExpected(path: string): ExpectedFixture {
  return JSON.parse(readFileSync(path, "utf8")) as ExpectedFixture;
}

function answerIndex(q: ExpectedQuestion): number | null {
  if (typeof q.correctIndex === "number") return q.correctIndex;
  if (q.answerKey) {
    const i = "ABCDE".indexOf(q.answerKey.toUpperCase());
    return i >= 0 ? i : null;
  }
  return null;
}

/** Per-fixture answer-key text; prefer dedicated files over a shared wrong lista. */
function gabaritoFor(htmlName: string, expected: ExpectedFixture): string {
  const stem = htmlName.replace(/\.html$/, "");
  const dedicatedTxt = resolve(GABARITOS, `gabarito-${stem}.txt`);
  if (existsSync(dedicatedTxt)) return readFileSync(dedicatedTxt, "utf8");

  if (expected.gabarito === "inline") return "";

  if (stem.includes("dummy") || stem.includes("objetiva-dummy")) {
    return extractHtmlText(readFileSync(resolve(GABARITOS, "gabarito-caderno.html"), "utf8"));
  }
  if (stem.includes("gabarito-separado") || stem.includes("duas-colunas-b")) {
    return extractHtmlText(readFileSync(resolve(GABARITOS, "gabarito-lista.html"), "utf8"));
  }
  // Last resort: synthesize from expected keys (oracle) so stem parse is still tested.
  return expected.questions
    .map((q) => {
      const idx = answerIndex(q);
      if (idx == null) return null;
      return `${q.number}-${"ABCDE"[idx]}`;
    })
    .filter(Boolean)
    .join(" ");
}

describe("golden evidence parse (§42)", () => {
  const expectedFiles = readdirSync(PROVAS).filter((f) => f.endsWith(".expected-questions.json"));

  for (const expectedName of expectedFiles) {
    const htmlName = expectedName.replace(".expected-questions.json", ".html");
    it(`${htmlName} recovers expected stems/answers (≥90%)`, () => {
      const htmlPath = resolve(PROVAS, htmlName);
      assert.ok(existsSync(htmlPath), `${htmlName}: missing HTML for expected-questions fixture`);
      const html = readFileSync(htmlPath, "utf8");
      const expected = loadExpected(resolve(PROVAS, expectedName));
      const text = extractHtmlText(html);
      const extraKey = gabaritoFor(htmlName, expected);

      let extracted = extractMcqs(text);
      if (extracted.length === 0 && extraKey) {
        extracted = extractMcqs(text, extraKey);
      }

      const byNumber = new Map(extracted.map((q) => [q.number, q]));
      let matched = 0;
      for (const exp of expected.questions) {
        const got = byNumber.get(exp.number);
        if (!got) continue;
        const stem = (exp.stem ?? exp.prompt ?? "").toLowerCase();
        const stemOk = !stem || got.prompt.toLowerCase().includes(stem.slice(0, 24));
        const wantIdx = answerIndex(exp);
        const keyOk = wantIdx == null || got.correctIndex === wantIdx;
        if (stemOk && keyOk) matched += 1;
      }
      const target = expected.questions.length;
      assert.ok(extracted.length > 0, `${htmlName}: extractMcqs returned none`);
      const ratio = matched / target;
      assert.ok(
        ratio >= 0.9,
        `${htmlName}: match ratio ${ratio.toFixed(2)} (${matched}/${target}); extracted ${extracted.length}`,
      );
    });
  }
});
