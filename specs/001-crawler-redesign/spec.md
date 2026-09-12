# 001 — Crawler / Content Pipeline Redesign (Ralph work-source pointer)

> **This file is a pointer only.** The canonical specification is
> [`docs/crawler-redesign-spec.md`](../../docs/crawler-redesign-spec.md) (50 sections).
> If this file and the canonical spec ever disagree, **the canonical spec wins** — see `AGENTS.md`.

## Mission

Stop Quizzeira from generating exam-metadata trivia questions and make it generate questions
about actual syllabus knowledge. Root causes RC-1…RC-5 and the full architecture
(role-typed pipeline "Branch D") are defined in the canonical spec (§1–§9).

## Prioritized checklist (mirrors canonical spec §50)

Implement in order; each item links to the canonical section(s) that define done-ness.

- [ ] 1. Stop storing listing pages as exam artifacts; detail-page document links with kind/role hints. (§11.2, removes RC-2)
- [ ] 2. `DocumentRole` + `SectionRole` in schema; enforce eligibility matrix in `chunks/search` + embed queue. (§6, §29, removes RC-1 at data layer)
- [ ] 3. Validation rung 2: metadata classifier + syllabus-meta detector in content-quality; regression fixtures REG-001..006. (§25.2, §43)
- [ ] 4. Demote legacy generation-origin published items to `needs_review`. (§40.4.3)
- [ ] 5. Non-concurso filter + registration-window parser in discovery. (§11.2.4–5)
- [ ] 6. Exam identity by (org, edition) instead of anchor text. (§11.2.2)
- [ ] 7. `doc-processor` Python service (PyMuPDF + Docling + trafilatura, cleaning log, column recovery, OCR routing, compose + health). (§12, §36–37, §39.1)
- [ ] 8. content-worker normalize + classify stages (tiers 0–2), Section rows, scores. (§13–14, §20)
- [ ] 9. Golden dataset v1 + CI wiring incl. `no-listing-trivia` job. (§42–43)
- [ ] 10. Syllabus parser (outline) + positions + validation + admin tree view. (§15)
- [ ] 11. Subject lexicon + canonical keys. (§15.5)
- [ ] 12. Evidence parsing extensions (`mcq.ts`), pairing, `PreviousQuestion`, style profiles. (§18)
- [ ] 13. Section-aware chunker + eligibility ladder + dedup layers. (§22, §26)
- [ ] 14. Syllabus mapping tiers 1–2; embeddings for eligible chunks and leaves only. (§21)
- [ ] 15. TopicQuery + coverage planner + crawler topic/direct modes, allowlist provider, robots, domain stats. (§11.3–4, §17)
- [ ] 16. KU extraction (LLM, batched, cached) + post-processing. (§23)
- [ ] 17. Brief builder + generation v2 prompt/schema + planner-driven runs; delete exam-level queue and `subject="geral"`. (§24)
- [ ] 18. Rung 3 grounding + judge v2 + gate v2; provenance endpoint + admin view. (§25.3–5, §30)
- [ ] 19. LLM residue paths (syllabus structuring, role tier 3, mapping tier 3) with budgets. (§27)
- [ ] 20. Web-search provider, per-stage budgets, model tiers, prompt caching, metrics + alerts. (§27–28, §31–32)
- [ ] 21. Study UI: syllabus focus picker, transcription mix cap, exam kind filter. (§39.4)
- [ ] 22. Delete legacy (`pdf-text.ts`, `chunk.ts`, `extraction/index.ts`, `listing-parse.ts`, junk regexes, empty app dirs); remove flags. (§40.3)
- [ ] 23. Docs: update `docs/ai-swe-concepts.md`; add `docs/pipeline-v2.md` runbook. (§46 Phase 5)

## Definition of Done

Canonical spec §48, items 1–9. Invariants §9.4 must hold and be property-tested.

## Guardrails (repo-wide)

- No question-bank seed fixtures (ingestion + Eval only) — `AGENTS.md`.
- Publish gate (`content-quality`) stays the sole `published` writer.
- Planes stay separate (discovery vs content DBs/APIs).
- `LLM_USE_HEADROOM=false` for workers; do not point workers at Headroom.
