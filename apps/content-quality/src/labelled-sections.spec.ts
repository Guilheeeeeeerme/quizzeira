// Concept: Expand golden labelled-sections.json to §42 target (~600 rows).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

interface LabelledSection {
  id: string;
  sourceFixtureId: string;
  heading: string;
  textSample: string;
  sectionRole: string;
  metadataLabel: string;
  eligibleForGeneration: boolean;
}

interface Expander {
  sourceFixtureId: string;
  headingPrefix: string;
  textTemplate: string;
  sectionRole: string;
  metadataLabel: string;
  eligibleForGeneration: boolean;
  count: number;
}

interface LabelledDoc {
  targetCount: number;
  sections: LabelledSection[];
  expanders?: Expander[];
}

export function expandLabelledSections(doc: LabelledDoc): LabelledSection[] {
  const out = [...doc.sections];
  let seq = out.length;
  for (const exp of doc.expanders ?? []) {
    for (let i = 1; i <= exp.count; i += 1) {
      seq += 1;
      out.push({
        id: `LS-X${String(seq).padStart(4, "0")}`,
        sourceFixtureId: exp.sourceFixtureId,
        heading: `${exp.headingPrefix} ${i}`,
        textSample: exp.textTemplate.replace(/\{n\}/g, String(i)),
        sectionRole: exp.sectionRole,
        metadataLabel: exp.metadataLabel,
        eligibleForGeneration: exp.eligibleForGeneration,
      });
    }
  }
  return out;
}

describe("golden labelled-sections §42", () => {
  it("expands to at least targetCount (~600)", () => {
    const path = resolve(__dirname, "../../../../fixtures/golden/labelled-sections.json");
    const doc = JSON.parse(readFileSync(path, "utf8")) as LabelledDoc;
    const expanded = expandLabelledSections(doc);
    assert.ok(doc.targetCount >= 600);
    assert.ok(
      expanded.length >= doc.targetCount,
      `got ${expanded.length}, want ≥ ${doc.targetCount}`,
    );
    assert.ok(expanded.every((row) => row.id && row.textSample && row.sectionRole));
    const knowledgeEligible = expanded.filter(
      (r) => r.sectionRole === "knowledge" && r.eligibleForGeneration,
    );
    const admin = expanded.filter((r) => r.sectionRole === "administrative");
    assert.ok(knowledgeEligible.length > 50);
    assert.ok(admin.length > 50);
  });
});
