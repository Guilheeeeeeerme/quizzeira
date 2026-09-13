// Concept: Golden HTML fixtures — all manifest rows with expectedRole (§42).

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import type { ArtifactKindHint, DocumentRole, RoleHint } from "@quizzeira/shared";
import { classifyHtml } from "./classify.js";

const ROOT = resolve(__dirname, "../../../../fixtures/golden");
const MANIFEST = resolve(ROOT, "manifest.json");

interface ManifestRow {
  id: string;
  path: string;
  expectedRole?: DocumentRole;
  category?: string;
}

function hintsFor(row: ManifestRow): { kindHint?: ArtifactKindHint; roleHint?: RoleHint } | undefined {
  if (row.expectedRole === "administrative" || row.category === "administrative") {
    return { kindHint: "listing", roleHint: "administrative" };
  }
  if (row.expectedRole === "knowledge") {
    if (/lei|planalto/i.test(row.path)) return { kindHint: "lei", roleHint: "knowledge" };
    return { roleHint: "knowledge" };
  }
  if (row.expectedRole === "evidence") {
    if (/gabarito/i.test(row.path)) return { kindHint: "gabarito", roleHint: "evidence" };
    return { kindHint: "prova", roleHint: "evidence" };
  }
  if (row.expectedRole === "specification") {
    return { kindHint: "edital", roleHint: "specification" };
  }
  return undefined;
}

describe("golden role classification over manifest (§42)", () => {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as { fixtures: ManifestRow[] };
  const rows = manifest.fixtures.filter(
    (f) =>
      f.expectedRole &&
      f.expectedRole !== "unknown" &&
      /\.(html|htm|txt)$/i.test(f.path) &&
      existsSync(resolve(ROOT, f.path)),
  );

  it("covers a substantial HTML/TXT role subset of the manifest", () => {
    assert.ok(rows.length >= 20, `expected ≥20 role fixtures, got ${rows.length}`);
  });

  for (const row of rows) {
    it(`${row.id} → ${row.expectedRole}`, () => {
      const html = readFileSync(resolve(ROOT, row.path), "utf8");
      const result = classifyHtml(html, row.id, hintsFor(row));
      assert.equal(
        result.role,
        row.expectedRole,
        `${row.id} (${row.path}): got ${result.role} via ${result.roleMethod}`,
      );
    });
  }
});
