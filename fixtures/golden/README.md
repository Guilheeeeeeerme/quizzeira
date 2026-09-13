# Golden dataset (§42)

Shared TS/Python fixtures for crawler redesign classifiers, syllabus extraction, evidence parse, and dedup. Spec: `docs/crawler-redesign-spec.md` §42.

`manifest.json` lists each file with `expectedRole`, `expectedSubtype`, and sidecar paths (`expectedSyllabus` / `expectedQuestions`) where applicable.

## Counts (v1 synthetic)

| Category | Target | Present |
| --- | ---: | ---: |
| Editais + `*.expected-syllabus.json` | 6 | 6 |
| Anexos (conteúdo programático) | 3 | 3 |
| Provas + `*.expected-questions.json` | 5 | 5 |
| Gabaritos | 3 | 3 |
| Knowledge HTML | 8 | 8 |
| Knowledge PDF / OCR stubs | 4 | 4 |
| Administrative (incl. listing-trivia page) | 6 | 6 |
| Garbage | 4 | 4 |
| Paraphrase pairs | ~30 | 30 |
| Labelled sections | ~600 (full) | 48 sample (+ schema for expansion) |

Knowledge PDF/OCR stubs cover binary ingest paths; DOCX is runtime-built in doc-processor tests.

## Layout

| Directory / file | Purpose |
| --- | --- |
| `editais/` | Specification editais + retificação + expected syllabi |
| `anexos/` | Standalone conteúdo programático (incl. running-prose `.txt`) |
| `provas/` | Evidence provas + expected questions |
| `gabaritos/` | Lista, tabela, caderno/cartão |
| `knowledge/` | Study / reject HTML (grammar, lei, nav, wiki, forum, paywall, SEO, ES) |
| `administrative/` | Inscrição, cronograma, resultado, FAQ, notícia |
| `garbage/` | Empty, cookie-wall, binary-in-HTML, glyph-noise |
| `regression/listing-trivia/` | Image #1–#6 regression (§43) |
| `paraphrase-pairs.json` | Near-dup / non-dup question pairs |
| `labelled-sections.json` | Section-role + metadata labels |

## Licence / origin

Synthetic Portuguese stubs — no external capture. When real public editais replace stubs, note origin URL, public-act status, and capture date on the manifest row.
