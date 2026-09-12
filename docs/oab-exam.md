# OAB — Exame de Ordem Unificado

Research notes behind the specialized OAB module. Everything here was verified
against the live FGV portal and against real exam PDFs in September 2026; the
"observed, not published" caveats are called out explicitly because the code
treats those two categories differently.

## 1. What the exam is

The **Exame de Ordem Unificado (EOU)** is the bar exam every Brazilian law
graduate must pass to register as an advogado (Art. 8º, IV, Lei nº 8.906/1994 —
Estatuto da Advocacia e da OAB). It is run by the Conselho Federal da OAB and
has been executed by the **Fundação Getulio Vargas (FGV)** since edition
`2010.2`. One national paper, identical in every seccional.

Governing norm: **Provimento nº 144/2011**, as amended by Provimentos 156/2013,
167/2015, 174/2016 and 212/2022.

Why it matters for Quizzeira: unlike a typical concurso, the OAB is
**recurrent** (~3 editions/year), **uniform** (same blueprint every edition) and
**fully published** (booklets, answer keys and 2ª-fase model answers are all
official PDFs). That combination is what makes a dedicated module worth it — the
generic Discovery → Extraction path guesses at all three.

### 1ª fase — prova objetiva

| Property | Value |
| --- | --- |
| Questions | 80 multiple-choice |
| Options | 4 (A–D), exactly one correct |
| Duration | 5 hours |
| Pass mark | ≥ 40 correct (50%), per Provimento 144/2011 |
| Character | Eliminatory, no ranking |
| Consultation | None permitted |
| Booklet types | 4 (`Tipo 1 – Branca`, `Tipo 2`, `Tipo 3`, `Tipo 4`) |

The four booklet types contain **the same 80 questions in a shuffled order**.
The official gabarito PDF ships a *tabela de correspondência* mapping every
Tipo 1 number to its number in Tipos 2/3/4 — which is what lets us canonicalize
on Tipo 1 and never ingest the same question four times.

Each booklet also ends with a 10-item **"Questionário de percepção sobre a
prova"**. It is renumbered 1–10, looks exactly like a real question, and does
not count for the score. It must be discarded.

### 1ª fase — subject blueprint

Provimento 144/2011, art. 11 §4º, is the only *published* constraint: at least
**15%** of the objective questions must cover Estatuto da Advocacia e da OAB +
Regulamento Geral, Código de Ética e Disciplina, Direitos Humanos and Filosofia
do Direito.

Beyond that, the per-subject counts below are an **observed** blueprint, stable
across editions 43º–46º. FGV does not publish it and is not bound by it, so the
module uses it as a *hint* (it labels a question's likely subject and records
that the label is inferred) and never as a hard assertion.

| # | Disciplina | Questions | Tipo 1 numbering |
| --- | --- | --- | --- |
| 1 | Ética Profissional / Estatuto da OAB | 8 | 01–08 |
| 2 | Filosofia do Direito | 2 | 09–10 |
| 3 | Direito Constitucional | 6 | 11–16 |
| 4 | Direitos Humanos | 2 | 17–18 |
| 5 | Direito Eleitoral | 2 | 19–20 |
| 6 | Direito Internacional | 2 | 21–22 |
| 7 | Direito Financeiro | 2 | 23–24 |
| 8 | Direito Tributário | 5 | 25–29 |
| 9 | Direito Administrativo | 5 | 30–34 |
| 10 | Direito Ambiental | 2 | 35–36 |
| 11 | Direito Civil | 6 | 37–42 |
| 12 | Estatuto da Criança e do Adolescente | 2 | 43–44 |
| 13 | Direito do Consumidor | 2 | 45–46 |
| 14 | Direito Empresarial | 4 | 47–50 |
| 15 | Direito Processual Civil | 6 | 51–56 |
| 16 | Direito Penal | 6 | 57–62 |
| 17 | Direito Processual Penal | 6 | 63–68 |
| 18 | Direito do Trabalho | 5 | 69–73 |
| 19 | Direito Processual do Trabalho | 5 | 74–78 |
| 20 | Direito Previdenciário | 2 | 79–80 |

Six disciplines — Ética (8), Constitucional, Civil, Processual Civil, Penal and
Processual Penal (6 each) — account for 38 of 80 questions, i.e. almost the
entire pass mark. There is no per-subject minimum; only the total counts.

### 2ª fase — prova prático-profissional

| Property | Value |
| --- | --- |
| Structure | 1 peça prático-profissional (5,00) + 4 questões discursivas (1,25 each) |
| Total | 10,00 |
| Pass mark | ≥ 6,00, no rounding |
| Duration | 5 hours |
| Consultation | Legislação seca permitted (unannotated Vade Mecum) |

The candidate picks one area at registration and the whole paper is in that
area. FGV's own internal codes appear in the file names:

| Code | Área |
| --- | --- |
| `B001` | Direito Administrativo |
| `B002` | Direito Civil |
| `B003` | Direito Constitucional |
| `B004` | Direito Empresarial |
| `B005` | Direito Penal |
| `B006` | Direito Tributário |
| `B007` | Direito do Trabalho |

Approval in the 1ª fase carries over to the **immediately subsequent** edition
only; failing or missing the 2ª fase after that means redoing the 1ª fase.

## 2. Sources

### oab.fgv.br — the authoritative source

An ASP.NET WebForms site. Three levels:

1. **Index** — `https://oab.fgv.br/` lists every edition as
   `home.aspx?key=<NNN>`, labelled `… EXAME DE ORDEM UNIFICADO`. 46 editions,
   from `2010.2` (key 112) to `47º` (key 650).
2. **Edition page** — `home.aspx?key=<NNN>` renders *nothing* but a seccional
   `<select>`. The document list is behind an `__doPostBack` on that select, so
   **a plain HTTP fetch returns an empty page**. This is the single reason the
   OAB source cannot use the generic `listing-links` strategy: it needs a real
   browser. Selecting any seccional redirects to
   `NovoSec.aspx?key=<encrypted>&codSec=<NNNN>`; the exam documents are national,
   so one seccional is enough.
3. **Artifacts** — `http://oab.fgv.br/arq/<key>/<byteSize>_<filename>.pdf`.
   The numeric prefix is the file's byte size, which gives a free integrity
   check before download.

Edition → key is *not* a clean arithmetic series (618, 619, 622, 623 are
missing), so the map is captured verbatim in `packages/shared/src/oab.ts`
rather than computed.

### Document label taxonomy

The anchor labels on an edition page are remarkably stable — identical wording
between the XXXIV (2022) and 47º (2026) pages. The module classifies on these:

| Label pattern | Meaning | Artifact kind |
| --- | --- | --- |
| `Edital de abertura` | Edital, includes conteúdo programático annex | `edital` |
| `Edital Complementar (Reaproveitamento)` | Complementary edital | `edital` |
| `Caderno de Prova - Tipo N` | 1ª fase booklet, type N | `prova` |
| `Gabaritos Preliminares da Prova Objetiva (1ª Fase)` | Pre-appeal key | `gabarito` |
| `Gabaritos definitivos da prova objetiva (1ª fase)` | Post-appeal key — **prefer this** | `gabarito` |
| `Caderno de Provas (<Área>)` | 2ª fase booklet | `prova` |
| `Padrão de respostas (<Área>)` | Preliminary model answer | `gabarito` |
| `Padrão de respostas definitivo (<Área>)` | Definitive model answer — **prefer this** | `gabarito` |
| `Resultado …`, `Comunicado`, `Edital - Locais …`, `… PNE` | Administrative | ignored |

Preliminary keys are superseded after the Banca Recursal annuls questions, so
the definitive variant always wins when both exist.

### Secondary sources

- `oab.org.br/leisnormas/legislacao/provimentos/144-2011` — Provimento text.
- `examedeordem.oab.org.br` and `s.oab.org.br/arquivos/<year>/<month>/<uuid>.pdf`
  — Conselho Federal mirrors of the editais.

Third-party aggregators (question banks, cram schools) are deliberately **not**
used: they republish preliminary keys, strip the tipo correspondence, and their
terms generally forbid scraping. Everything the module ingests comes from the
banca.

## 3. PDF formats (what the parsers must handle)

### 1ª fase caderno

- A4, `595.32 × 841.92 pt`, produced by Microsoft Word, text-layer present
  (no OCR needed), ~24 pages.
- **Two columns**, split near `x ≈ 300pt`. Naive text extraction interleaves
  them and produces unusable question text — question 1 ends up spliced into
  question 3. Extraction has to be geometry-aware.
- A question header is a **bare number alone on its line** (`52`), not `52)` or
  `Questão 52`. The platform's generic parser expects the latter and finds
  nothing here.
- Option markers changed between editions: `(A)` in recent ones (43º onward),
  `A)` in older ones (up to XXXIV). Both must be accepted.
- Page furniture to drop: running header `46º EXAME DE ORDEM UNIFICADO`, footer
  `Tipo Branca – Página 15`, and bare page numbers that look like question
  headers.

Validation: geometry-aware extraction of the 46º Tipo 1 booklet yields exactly
80 question headers and 320 option lines, with accents intact.

### Gabarito

Single-column and fully deterministic. Four blocks headed
`NNº EXAME DE ORDEM - PROVA TIPO N`, each a numbers row `1 2 … 20` over an
answers row `C D C A …`, repeated in bands of 20. Then
`TABELA DE CORRESPONDÊNCIA DE QUESTÕES`, four columns wide, mapping
`TIPO 1 → TIPO 2 → TIPO 3 → TIPO 4`.

### 2ª fase padrão de respostas

Single-column. Contains **both the enunciado and the model answer**, so one PDF
yields five complete open-ended items. Section markers:

- `PADRÃO DE RESPOSTA – PEÇA PROFISSIONAL`
- `PADRÃO DE RESPOSTA – QUESTÃO 01` … `04`
- inside each: `Enunciado`, then `Gabarito Comentado`
- point values inline as `(Valor: 5,00)` / `(Valor: 0,65)`

## 4. How this maps onto Quizzeira

| Stage | Generic path | OAB path |
| --- | --- | --- |
| Ingestion | `listing-links` over a portal | `oab-fgv` strategy: Playwright postback, edition catalog, label taxonomy |
| Extraction | flat PDF text → regex questions | column-aware layout reader → caderno/gabarito/padrão parsers |
| Generation | LLM drafts from chunks | **not used** — every item is recovered verbatim |
| Eval | structural + LLM judge | structural only for extracted items; the answer is the banca's |
| Sampling | by exam + subject | by disciplina, using the published blueprint |

The headline consequence: **OAB question items cost no LLM tokens**. They are
transcriptions of official documents with official answer keys, so Generation
and the LLM judge are both bypassed. The module's job is to make that
transcription exact.

## 5. The module

| File | Role |
| --- | --- |
| `packages/shared/src/oab.ts` | Domain model: editions → FGV keys, blueprint, 2ª fase áreas, exam slugs, document label taxonomy |
| `apps/discovery-crawler/src/oab-fgv.ts` | `oab-fgv` strategy: postback render, anchor classification, exam grouping |
| `apps/discovery-crawler/src/pipeline.ts` | `crawlOab` — one open-exam row per edition/phase, every document stored with its kind |
| `apps/content-worker/src/extraction/oab/pdf-layout.ts` | Column-aware PDF reader (text matrix + /ToUnicode CMaps) |
| `apps/content-worker/src/extraction/oab/cmap.ts` | /ToUnicode extraction, without which the gabaritos decode to nothing |
| `apps/content-worker/src/extraction/oab/caderno.ts` | 1ª fase booklet → 80 verbatim questions |
| `apps/content-worker/src/extraction/oab/gabarito.ts` | Answer key + Tipo correspondence → canonical Tipo 1 answers |
| `apps/content-worker/src/extraction/oab/padrao.ts` | 2ª fase padrão → peça + 4 discursivas, with the banca's model answer |
| `apps/content-worker/src/extraction/oab/drafts.ts` | Parsed documents → draft question items, grouped by disciplina |
| `apps/content-worker/src/extraction/oab/index.ts` | The caderno ↔ gabarito join, in whichever order the two arrive |

### Registering the source

The Source registry is seeded by an admin, not by code. One row is enough:

- **Domain** `oab.fgv.br`, **Strategy** `oab-fgv`, **Trust** `high`
- Start URLs are ignored — the strategy walks `OAB_EDITIONS` instead, newest
  first, `DISCOVERY_CRAWLER_MAX_OAB_EDITIONS` (default 3) per pass.

### The document pair

A caderno has no answers and a gabarito has no question text, and FGV publishes
them weeks apart. So extraction is pair-driven: whichever half arrives second
pulls the other from Content and completes the join. Until then the document is
logged as *awaiting its pair*, not failed. Re-drafting is safe because Content
fingerprints items — which is also why all four booklet types can be processed
and still yield 80 questions, not 320.

## 6. Caveats

- The per-subject blueprint is observed, not published. Treat subject labels on
  extracted items as inferred.
- Preliminary gabaritos are routinely revised; questions annulled by the Banca
  Recursal disappear from the definitive key. Items whose number is absent from
  the definitive key must not be published.
- Edition labelling switches from Roman (`IV`–`XXXIV`) to Arabic (`35º`–`47º`).
  Both forms appear in file names and page titles.
- FGV serves the artifacts over plain `http://`; the crawler upgrades to
  `https://` when storing the URL.
- The `oab-fgv` strategy needs a real browser. `DISCOVERY_CRAWLER_FIXTURE_MODE`
  skips it rather than crawling a fixture: there is no fixture that would
  exercise the postback.
