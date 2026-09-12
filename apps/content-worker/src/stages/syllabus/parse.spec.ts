import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { classifyDocument } from "../classify.js";
import { normalizeHtmlFallback } from "../normalize.js";
import { parseSyllabusFromDocument } from "./parse.js";
import { discoverPositions } from "./positions.js";

const EDITAIS = resolve(__dirname, "../../../../../fixtures/golden/editais");

function loadExpected(path: string): { leaves?: string[]; positions?: unknown[] } {
  return JSON.parse(readFileSync(path, "utf8")) as { leaves?: string[]; positions?: unknown[] };
}

function normalizeTitle(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("golden edital → syllabus (§42)", () => {
  const expectedFiles = readdirSync(EDITAIS).filter((f) => f.endsWith(".expected-syllabus.json"));

  for (const expectedName of expectedFiles) {
    const htmlName = expectedName.replace(".expected-syllabus.json", ".html");
    it(`${htmlName} covers expected leaf titles (≥90% token hit)`, () => {
      const htmlPath = resolve(EDITAIS, htmlName);
      const expectedPath = resolve(EDITAIS, expectedName);
      const html = readFileSync(htmlPath, "utf8");
      const expected = loadExpected(expectedPath);

      const doc = normalizeHtmlFallback({
        documentId: htmlName,
        contentType: "text/html",
        bytes: Buffer.from(html, "utf8"),
      });
      const classification = classifyDocument(doc, {
        kindHint: htmlName.includes("retific") ? "retificacao" : "edital",
        roleHint: "specification",
      });
      assert.equal(classification.role, "specification");

      const positions = discoverPositions(doc, classification.sections);
      const parsed = parseSyllabusFromDocument(doc, classification.sections, positions);
      assert.ok(parsed.nodes.length > 0, "expected syllabus nodes");

      const titles = parsed.nodes.map((n) => normalizeTitle(n.title));
      const leafStrings =
        expected.leaves?.map(String) ??
        (
          expected.positions as Array<{
            leaves?: string[];
            subjects?: Array<{ name: string; topics?: Array<{ name: string; subtopics?: string[] }> }>;
          }>
        )?.flatMap((p) => {
          if (p.leaves) return p.leaves;
          return (p.subjects ?? []).flatMap((s) => [
            s.name,
            ...(s.topics ?? []).flatMap((t) => [t.name, ...(t.subtopics ?? [])]),
          ]);
        }) ??
        [];

      // Prefer full leaf path tip (last segment) for Phase-2 ≥90% leaf match (§46).
      const targets = leafStrings
        .map((s) => {
          const parts = String(s)
            .split(/[▸>]/)
            .map((p) => normalizeTitle(p))
            .filter((t) => t.length >= 4);
          return parts[parts.length - 1] ?? "";
        })
        .filter(Boolean);

      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 0) {
        assert.ok(parsed.nodes.some((n) => n.depth >= 0));
        return;
      }

      let hits = 0;
      for (const target of uniqueTargets) {
        if (
          titles.some(
            (t) => t.includes(target) || target.includes(t) || tokenOverlap(t, target) >= 0.6,
          )
        ) {
          hits += 1;
        }
      }
      const ratio = hits / uniqueTargets.length;
      assert.ok(
        ratio >= 0.9,
        `${htmlName}: leaf title hit ratio ${ratio.toFixed(2)} (hits ${hits}/${uniqueTargets.length}); got ${JSON.stringify(titles)}`,
      );
    });
  }
});

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter((t) => t.length >= 3));
  const tb = new Set(b.split(" ").filter((t) => t.length >= 3));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}