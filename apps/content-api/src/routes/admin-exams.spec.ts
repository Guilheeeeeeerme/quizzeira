// Concept: File triage contract — labels are closed enums the pipeline consumes,
// a human label is final, and pruning/retention never destroy anything still
// referenced.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ADMIN_EXAMS = readFileSync(resolve(__dirname, "./admin-exams.ts"), "utf8");
const TRIAGE = readFileSync(resolve(__dirname, "./internal/triage.ts"), "utf8");
const RETENTION = readFileSync(resolve(__dirname, "./internal/retention.ts"), "utf8");
const PROCESS = readFileSync(
  resolve(__dirname, "../../../content-worker/src/stages/process.ts"),
  "utf8",
);
const WORKER_TRIAGE = readFileSync(
  resolve(__dirname, "../../../content-worker/src/stages/triage.ts"),
  "utf8",
);
const WEB_PANEL = readFileSync(
  resolve(__dirname, "../../../web/src/features/admin/ExamFilesPanel.tsx"),
  "utf8",
);

describe("admin file labels are closed enums", () => {
  it("PATCH /admin/documents/:id validates role and kind against fixed sets", () => {
    assert.match(ADMIN_EXAMS, /DOCUMENT_ROLES = new Set\(\[[\s\S]*?"specification",[\s\S]*?"evidence",[\s\S]*?"knowledge",[\s\S]*?"administrative"/);
    assert.match(ADMIN_EXAMS, /DOCUMENT_KINDS = new Set\(\["edital", "prova", "gabarito", "programa", "other"\]\)/);
    assert.match(ADMIN_EXAMS, /!DOCUMENT_ROLES\.has\(body\.role\)[\s\S]*?statusCode: 400/);
    assert.match(ADMIN_EXAMS, /!DOCUMENT_KINDS\.has\(body\.kind\)[\s\S]*?statusCode: 400/);
  });

  it("the web picker offers the same vocabulary, never free text", () => {
    assert.match(WEB_PANEL, /DOCUMENT_ROLE_OPTIONS = \["specification", "evidence", "knowledge", "administrative"\]/);
    assert.match(WEB_PANEL, /DOCUMENT_KIND_OPTIONS = \["edital", "prova", "gabarito", "programa", "other"\]/);
    assert.doesNotMatch(WEB_PANEL, /<Input|<Textarea/);
  });
});

describe("a human label is final", () => {
  it("content-api and worker agree on the override method string", () => {
    assert.match(ADMIN_EXAMS, /ADMIN_ROLE_METHOD = "admin_override"/);
    assert.match(PROCESS, /ADMIN_ROLE_METHOD = "admin_override"/);
    assert.match(TRIAGE, /ADMIN_ROLE_METHOD = "admin_override"/);
  });

  it("the classifier ladder keeps an admin role instead of recomputing it", () => {
    assert.match(
      PROCESS,
      /document\.roleMethod === ADMIN_ROLE_METHOD && document\.role[\s\S]*?roleMethod: ADMIN_ROLE_METHOD/,
    );
  });

  it("re-labelling requeues the document with a clean slate", () => {
    assert.match(ADMIN_EXAMS, /status: "pending",\s*attempts: 0,\s*failReason: null/);
  });
});

describe("prune and retention never destroy referenced data", () => {
  it("prune excludes admin labels, hand-valuable roles and any referenced document", () => {
    assert.match(TRIAGE, /COALESCE\(d\."roleMethod", ''\) <> \$\{ADMIN_ROLE_METHOD\}/);
    assert.match(TRIAGE, /NOT EXISTS \(SELECT 1 FROM "QuestionItem"/);
    assert.match(TRIAGE, /NOT EXISTS \(SELECT 1 FROM "PreviousQuestion"/);
    assert.match(TRIAGE, /NOT EXISTS \(SELECT 1 FROM "Syllabus"/);
    assert.match(TRIAGE, /jsonb_array_elements\(ku\.evidence\)/);
    // Only these three reasons exist; specification/evidence/unknown are never matched.
    assert.match(TRIAGE, /role = 'administrative'/);
    assert.match(TRIAGE, /role = 'knowledge'/);
    assert.doesNotMatch(TRIAGE, /role = 'specification'|role = 'evidence'|role = 'unknown'/);
  });

  it("retention only deletes a content-addressed key when every holder is terminal", () => {
    assert.match(RETENTION, /storageKey: \{ in: keys \}/);
    assert.match(RETENTION, /!\(d\.status === "extracted" \|\| d\.status === "failed"\)/);
  });

  it("the worker reports every purged object back to Discovery", () => {
    assert.match(WORKER_TRIAGE, /\/internal\/artifacts\/mark-purged/);
  });

  it("uncertain files stop being retried after a bounded number of LLM attempts", () => {
    assert.match(WORKER_TRIAGE, /MAX_RECLASSIFY_ATTEMPTS = 3/);
    assert.match(WORKER_TRIAGE, /book\.attempts >= MAX_RECLASSIFY_ATTEMPTS\) continue/);
  });
});
