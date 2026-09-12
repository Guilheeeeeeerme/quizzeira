// Concept: NormalizedDocument contract — TS Zod ↔ Python field catalogue (§41.2).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  NORMALIZED_DOCUMENT_SCHEMA_VERSION,
  normalizedDocumentSchema,
} from "./normalized-document.js";

const CATALOGUE_PATH = resolve(
  process.cwd(),
  "apps/doc-processor/normalized-document.schema.json",
);

describe("NormalizedDocument contract (§41.2)", () => {
  const catalogue = JSON.parse(readFileSync(CATALOGUE_PATH, "utf8")) as {
    schemaVersion: string;
    requiredTopLevelKeys: string[];
    extractorEngines: string[];
    blockTypes: string[];
    sectionFlags: string[];
  };

  it("schemaVersion matches catalogue and Zod literal", () => {
    assert.equal(NORMALIZED_DOCUMENT_SCHEMA_VERSION, catalogue.schemaVersion);
    assert.equal(NORMALIZED_DOCUMENT_SCHEMA_VERSION, "1");
  });

  it("Zod accepts a minimal valid document", () => {
    const doc = {
      schemaVersion: "1",
      documentId: "doc-1",
      contentHash: "abc",
      source: {
        url: null,
        contentType: "text/html",
        byteSize: 10,
        fetchedAt: "2026-01-01T00:00:00Z",
      },
      extractor: { engine: "trafilatura", version: "1", options: {} },
      stats: {
        pages: null,
        chars: 10,
        textLayerRatio: null,
        ocrConfidence: null,
        language: "pt",
        blocksByType: {},
        linkDensity: 0,
      },
      metadata: { title: null, author: null, date: null, sitename: null },
      blocks: [{ type: "paragraph", text: "hello" }],
      sections: [
        {
          id: "s0",
          ordinal: 0,
          path: [],
          heading: null,
          level: 0,
          text: "hello world enough chars",
          charCount: 24,
          blockRange: [0, 1],
          flags: [],
        },
      ],
      tables: [],
      cleaningLog: [],
    };
    assert.doesNotThrow(() => normalizedDocumentSchema.parse(doc));
  });

  it("required top-level keys match catalogue", () => {
    const shape = normalizedDocumentSchema.shape;
    for (const key of catalogue.requiredTopLevelKeys) {
      assert.ok(key in shape, `missing ${key}`);
    }
  });

  it("extractor engines match catalogue", () => {
    const engineSchema = normalizedDocumentSchema.shape.extractor.shape.engine;
    for (const eng of catalogue.extractorEngines) {
      assert.doesNotThrow(() => engineSchema.parse(eng), eng);
    }
  });

  it("block types and section flags match catalogue", () => {
    const sample = normalizedDocumentSchema.shape.blocks.element.shape.type;
    for (const t of catalogue.blockTypes) {
      assert.doesNotThrow(() => sample.parse(t), t);
    }
    const flag = normalizedDocumentSchema.shape.sections.element.shape.flags.element;
    for (const f of catalogue.sectionFlags) {
      assert.doesNotThrow(() => flag.parse(f), f);
    }
  });
});
