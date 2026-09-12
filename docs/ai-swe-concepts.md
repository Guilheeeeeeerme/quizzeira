# AI SWE concepts in Quizzeira

Quizzeira is deliberately built so that each canonical AI software-engineering
concept appears **once**, in **one** place, under its **own name**. Folder names,
symbols, and log fields use the canonical term, so you can grep for a concept
and find its implementation.

Every entry below uses the same template:

- **Definition** — what the concept means in general, outside this repo.
- **In Quizzeira** — the specific job it does here.
- **Code** — where it lives.
- **Not to confuse with** — the neighbouring concept people usually collapse it into.

The pipeline reads left to right, and each arrow is a service boundary:

```
Ingestion ──▶ Extraction ──▶ Embeddings ──▶ Generation ──▶ Eval ──▶ Sampling ──▶ Grading
(discovery)   (content)      (content)      (content)      (quality) (study)     (study)
```

A question only becomes visible to a learner by passing the **publish gate** in
Eval. Nothing else in the system can publish.

---

## Ingestion

- **Definition** — Acquiring raw source material from the outside world and
  recording it, without interpreting it.
- **In Quizzeira** — A polite crawler visits registered exam portals, discovers
  open exams via listing → detail pages, and downloads typed documents (edital,
  prova, …) into object storage with role/kind hints. Listing pages are never
  attached as exam study artifacts.
- **Code** — `apps/discovery-api/`, `apps/discovery-crawler/` (`listing.ts`,
  `detail.ts`, `topic.ts`, `direct.ts`). Database `quizzeira_discovery`. Header
  comment: `// Concept: Ingestion`.
- **Not to confuse with** — **Extraction**. Ingestion gets the bytes; Extraction
  turns bytes into text. Discovery has no idea what a question is.

## Source registry

- **Definition** — The governed list of places a crawler is allowed to visit,
  with per-source policy.
- **In Quizzeira** — `Source` rows carry start URLs, link/open regex patterns,
  politeness delay, crawl interval, trust, and health. **It ships empty.** An
  admin adds the first source through `/admin/sources`; there is no seed.
- **Code** — `Source` and `SourceProposal` in
  `apps/discovery-api/prisma/schema.prisma`; CRUD in
  `apps/discovery-api/src/routes/admin.ts`.
- **Not to confuse with** — a crawl *queue*. The registry is durable policy; a
  `CrawlRun` is one pass over it.

## Adaptive reach (source proposals)

- **Definition** — Letting a crawler suggest expansions of its own scope,
  subject to review.
- **In Quizzeira** — When a crawl sees outbound links to unknown domains, it
  files at most two `SourceProposal` rows per source per pass. Proposals are
  **inert**: nothing is crawled until an admin approves them.
- **Code** — `POST /internal/sources/propose`, approve/reject in
  `apps/discovery-api/src/routes/admin.ts`.
- **Not to confuse with** — autonomous scope growth. The crawler can *ask*, never
  *decide*.

## Listing fingerprint

- **Definition** — A content digest used to skip work that would be a no-op.
- **In Quizzeira** — Each source's listing set is hashed per pass. An unchanged
  fingerprint costs one page fetch instead of a full re-ingest, which is what
  makes a 30-minute crawl interval affordable and polite.
- **Code** — `listingsFingerprint()` in `packages/shared/src/crawler.ts`;
  `ListingFingerprint` model in `apps/discovery-api/prisma/schema.prisma`.
- **Not to confuse with** — a cache. A fingerprint mismatch triggers real work;
  it stores no content.

## Document store

- **Definition** — Durable storage of original artifacts, separating bytes from
  metadata.
- **In Quizzeira** — Edital/prova PDFs go to MinIO under a content-addressed key;
  Postgres keeps only the key, checksum, size and content type. Content later
  reads the bytes back through `content-api`, so no worker needs S3 credentials.
- **Code** — `apps/discovery-api/src/lib/storage.ts` (write),
  `apps/content-api/src/lib/storage.ts` (read), `Artifact` / `Document` models.
- **Not to confuse with** — the **Question bank**. The document store holds source
  material; the question bank holds finished questions.

## NormalizedDocument

- **Definition** — A versioned, extractor-neutral JSON representation of a source
  file after format detection, cleaning, and sectioning.
- **In Quizzeira** — Produced by `doc-processor` (Python) and validated at the
  boundary by Zod in `@quizzeira/shared`. Node orchestration reads sections and
  blocks; it does not parse raw PDF bytes except on the OAB legacy path.
- **Code** — `packages/shared/src/pipeline/normalized-document.ts`;
  `apps/doc-processor/`; consumed in `apps/content-worker/src/stages/normalize.ts`.
- **Not to confuse with** — a **Chunk**. NormalizedDocument is whole-document
  structure; chunks are retrieval units cut from eligible sections later.

## DocumentRole

- **Definition** — A typed label for what a document is *for* in the pipeline
  (specification, evidence, knowledge, administrative, mixed, unknown).
- **In Quizzeira** — Drives the eligibility matrix: only `knowledge` (and parts of
  `mixed`) may embed or feed generation; `specification` feeds syllabus extraction;
  `evidence` feeds previous-question parse and style profiles; `administrative`
  never indexes.
- **Code** — `packages/shared/src/pipeline/roles.ts` (`ROLE_ELIGIBILITY`,
  `isEmbedEligible`, `isGenerationEligible`); persisted on `Document.role` in
  content-api; assigned in `apps/content-worker/src/stages/classify.ts`.
- **Not to confuse with** — **RoleHint** on Discovery artifacts. Hints are Tier 0
  provenance; `DocumentRole` is the content-plane decision after classification.

## Syllabus

- **Definition** — The structured, versioned curriculum extracted from an edital
  (subjects, topics, subtopics, scoped to positions).
- **In Quizzeira** — Parsed from `specification` documents into `Syllabus`,
  `Position`, and `SyllabusNode` rows. Generation and Eval link each question to
  a syllabus leaf — a syllabus link alone is not sufficient for publish.
- **Code** — `apps/content-api/prisma/schema.prisma` (`Syllabus`, `SyllabusNode`);
  `apps/content-worker/src/stages/syllabus/`; upsert via `POST /internal/syllabi`.
- **Not to confuse with** — the old per-level curriculum model. The bank is keyed by
  exam + syllabus leaf, not difficulty pools.

## KnowledgeUnit

- **Definition** — An atomic, citeable fact distilled from eligible knowledge
  material and mapped to one syllabus leaf.
- **In Quizzeira** — Generation must cite `knowledgeUnitIds`; Eval rung 2–3 reject
  generation-origin drafts with missing or ungrounded citations. Units are the
  grounding surface for brief-based prompts, not raw chunks.
- **Code** — `KnowledgeUnit` model in content-api; extraction in
  `apps/content-worker/src/stages/knowledge/distill.ts`; served at
  `GET /internal/knowledge-units`.
- **Not to confuse with** — a **Chunk**. Chunks are indexed text spans; knowledge
  units are curated statements the generator must reference.

## ExamStyleProfile

- **Definition** — Aggregated stylistic statistics of how a banca writes questions
  for a subject (stem length, option count, passage rate, etc.).
- **In Quizzeira** — Built from `PreviousQuestion` rows parsed out of `evidence`
  documents. Feeds generation constraints so new items match banca form without
  copying prior stems verbatim.
- **Code** — `ExamStyleProfile` in content-api; built in
  `apps/content-worker/src/stages/evidence/style-profile.ts`; upsert at
  `POST /internal/style-profiles`.
- **Not to confuse with** — **LLM-as-judge**. The profile is deterministic
  aggregation; the judge scores individual draft quality.

## Coverage Planner

- **Definition** — A scheduler that picks syllabus leaves where published +
  pending question counts fall below target and enough knowledge units exist.
- **In Quizzeira** — Replaces exam-level `"geral"` generation queues. Each run is
  keyed by `syllabusNodeId`; deficits respect `MIN_KU` and per-leaf targets. The
  planner may also enqueue topic queries for knowledge discovery.
- **Code** — `GET /internal/generation/planner-queue` in content-api;
  `apps/content-worker/src/stages/planner.ts` and `generation/index.ts` (v2 path).
- **Not to confuse with** — **Sampling**. The planner creates new drafts offline;
  Sampling draws finished published items for learners.

## Extraction

- **Definition** — Converting a source artifact into clean, model-usable text.
- **In Quizzeira** — Non-OAB documents go through Python `doc-processor`
  (PyMuPDF / optional Docling / trafilatura / DOCX) into a versioned
  `NormalizedDocument`, then role classification and section-aware chunking.
  OAB keeps its geometry-based PDF readers. Image-only PDFs without OCR
  eligibility are marked `failed`.
- **Code** — `apps/doc-processor/`; `apps/content-worker/src/stages/normalize.ts`,
  `classify.ts`, `knowledge/chunker.ts`. OAB: `extraction/oab/pdf-layout.ts`.
- **Not to confuse with** — **Generation**. Extraction never invents text; if the
  source does not say it, it does not appear.

## Chunking

- **Definition** — Splitting a document into retrieval-sized units.
- **In Quizzeira** — Section-aware packing: chunks never cross section boundaries.
  Within a section, paragraphs pack to ~3000 characters (no overlap carry — the
  section already provides context). Only `content` / `legal_article` sections
  from generation-eligible documents may become `eligible` for embedding.
- **Code** — `apps/content-worker/src/stages/knowledge/chunker.ts` +
  `eligibility.ts`.
- **Not to confuse with** — pagination. Chunk boundaries follow section structure,
  not page breaks.

## Embeddings

- **Definition** — Dense vector representations that make text searchable by
  meaning rather than keyword.
- **In Quizzeira** — Each **eligible** chunk gets a 768-dimension vector stored in
  a pgvector column, searched by cosine distance. Writes and searches join
  Document/Section roles so administrative and specification text cannot enter
  the knowledge index (invariant 1).
- **Code** — `apps/content-worker/src/embeddings/`,
  `apps/content-api/src/lib/vectors.ts`, `Chunk.embedding`.
- **Not to confuse with** — full-text search. Embeddings match meaning; they are
  not a substitute for exact lookup, and they are never used at quiz time.

## Retrieval (RAG)

- **Definition** — Fetching relevant context at inference time and putting it in
  the prompt, so the model answers from provided facts.
- **In Quizzeira** — Generation no longer embeds a subject string for k-NN over
  the whole exam. The unit of work is a syllabus leaf: the coverage planner
  selects leaves with KU deficit; the brief loads cited `KnowledgeUnit`s (and
  style/exemplars). Chunk search remains available for diagnostics with
  `eligibleOnly` default true.
- **Code** — `buildGenerationBrief` / `planner-queue` /
  `apps/content-worker/src/generation/`; `searchChunks()` in
  `apps/content-api/src/lib/vectors.ts`.
- **Not to confuse with** — **Sampling**. Serving a quiz is *not* RAG. See
  Sampling below.

## Generation

- **Definition** — Using a model to produce new artifacts from provided context.
- **In Quizzeira** — Produces multiple-choice draft questions from a **generation
  brief** (syllabus leaf + knowledge units + style + avoid stems). Output is
  shape-validated (`syllabusNodeId`, `knowledgeUnitIds`, `distractorRationale`)
  before persistence. Every generated item lands as `draft` — Generation
  **cannot publish**.
- **Code** — `apps/content-worker/src/generation/` (`brief.ts`, `prompt.ts`,
  `index.ts`), `GenerationRun` model; queue is
  `GET /internal/generation/planner-queue`.
- **Not to confuse with** — **Eval**. Generation writes; Eval judges. Keeping the
  writer unable to approve its own work is the point.

## SectionRole

- **Definition** — Fine-grained label for a document section (syllabus, content,
  registration, question_block, …).
- **In Quizzeira** — Assigned during classification; only `content` and
  `legal_article` may feed the knowledge index.
- **Code** — `packages/shared/src/pipeline/roles.ts`; `Section.role` in content-api.
- **Not to confuse with** — **DocumentRole**, which labels the whole document.

## Eligibility ladder

- **Definition** — Deterministic gate that parks or rejects chunks before embed.
- **In Quizzeira** — Document role → section role → language → noise/metadata →
  size → dedup → syllabus map score. Only `eligible` chunks are embedded.
- **Code** — `apps/content-worker/src/stages/knowledge/eligibility.ts`.
- **Not to confuse with** — the Eval publish gate (which judges finished questions).

## TopicQuery

- **Definition** — A scheduled web-search work item to discover knowledge pages
  for under-covered syllabus leaves.
- **In Quizzeira** — Coverage planner enqueues queries; discovery-crawler topic
  mode runs allowlisted/web search and stores knowledge artifacts.
- **Code** — `TopicQuery` in discovery-api; `apps/discovery-crawler/src/topic.ts`;
  templates in `packages/shared/src/curriculum/queries.ts`.
- **Not to confuse with** — listing crawl, which discovers exams, not study text.

## Validation ladder

- **Definition** — Ordered Eval rungs: structural → relevance → grounding →
  LLM judge → gate.
- **In Quizzeira** — Rung 2 kills exam-metadata trivia; rung 3 requires KU
  citations for generation; only `decide()` may write `published`.
- **Code** — `apps/content-quality/src/{structural,relevance,grounding,judge,gate}.ts`.
- **Not to confuse with** — chunk eligibility (upstream of generation).

## Provenance

- **Definition** — The explainable chain from a published question back to
  sources.
- **In Quizzeira** — `GET /internal/question-items/:id/provenance` returns
  question → KUs → document/sections → generation run → reviews. Workers also
  propagate `x-run-id` on internal calls so one tick can be followed across
  discovery → content → quality (§31.3).
- **Code** — content-api provenance route; admin HITL Provenance control;
  `packages/worker-kit/src/run-id.ts`.
- **Not to confuse with** — **RoleHint** (Tier-0 crawl metadata only).

## Question bank

- **Definition** — The curated, reusable store of finished assessment items.
- **In Quizzeira** — `QuestionItem` rows in `quizzeira_content`, with a lifecycle
  of `draft → needs_review | published | failed`. A content fingerprint makes
  re-extraction and re-generation idempotent instead of duplicative.
- **Code** — `QuestionItem` in `apps/content-api/prisma/schema.prisma`; read API
  in `apps/content-api/src/routes/published.ts`.
- **Not to confuse with** — a question *pool* tagged by difficulty level. The old
  curriculum model (levels, per-topic pools) was removed; the bank is keyed by
  exam and subject.

## Structural validation

- **Definition** — Deterministic, rule-based checks on an artifact's form.
- **In Quizzeira** — Pre-LLM gate: prompt length, option count, duplicate or
  blank options, `correctIndex` range, banned "none of the above" phrasing,
  giveaway-length correct answers, and stems that refer back to the source text.
  Running it first keeps judge spend off items that were never usable.
- **Code** — `apps/content-quality/src/structural.ts` (+ `structural.spec.ts`).
- **Not to confuse with** — **LLM-as-judge**. Structural checks are free,
  deterministic, and cannot assess correctness.

## LLM-as-judge

- **Definition** — Using a model to score another model's output against
  criteria, instead of relying on exact-match metrics.
- **In Quizzeira** — Scores an item 0–1 on factual correctness, single defensible
  answer, clarity, and exam-appropriateness, and independently answers the
  question. The judge **scores but never rewrites**, which is what makes its
  verdict auditable.
- **Code** — `apps/content-quality/src/judge.ts`.
- **Not to confuse with** — **Grading**. The judge evaluates *questions*; grading
  evaluates *learner answers*. Different subject, different prompt, different
  service.

## Eval

- **Definition** — The systematic quality assessment stage of a pipeline.
- **In Quizzeira** — The `content-quality` worker: structural validation, then
  LLM-as-judge, then the publish gate. It is the **only** service that can move
  an item to `published`. If it stops, nothing new reaches learners — the
  intended failure mode.
- **Code** — `apps/content-quality/`.
- **Not to confuse with** — monitoring. Eval decides whether an artifact ships;
  monitoring reports on a system already running.

## Publish gate

- **Definition** — A single explicit checkpoint that an artifact must pass to
  become visible.
- **In Quizzeira** — A pure function combining both quality signals: structural
  failure fails outright; judge/item answer disagreement fails; score ≥ 0.8
  publishes; < 0.5 fails; the band between goes to HITL. A missing judge verdict
  never publishes and never fails — infrastructure gaps are not the item's fault.
- **Code** — `decide()` in `apps/content-quality/src/gate.ts` (+ `gate.spec.ts`);
  the sole `published` write is
  `POST /internal/question-items/verdict` in `apps/content-api`.
- **Not to confuse with** — a feature flag. The gate is a per-item decision with a
  recorded rationale, not a global on/off switch.

## HITL (human-in-the-loop)

- **Definition** — Routing the cases automation should not decide alone to a
  human, with enough context to decide well.
- **In Quizzeira** — Items that are `failed` or `needs_review` appear in the admin
  quality queue with their score, machine-readable fail reasons, judge notes,
  full review history, and a link to the source document. An admin can publish
  anyway, reject, or send the item back through Eval.
- **Code** — `apps/content-api/src/routes/admin.ts`,
  `apps/web/src/features/admin/AdminPages.tsx` (`AdminQualityPage`);
  `QualityReview` model.
- **Not to confuse with** — manual authoring. Humans adjudicate here; they do not
  write questions.

## Sampling (not RAG)

- **Definition** — Selecting items from an existing, finished pool to assemble a
  session.
- **In Quizzeira** — Starting a study pill draws N `published` questions for the
  exam from `content-api`, filtered by subject and locale, shuffled. **No
  retrieval, no embeddings, no model call on the request path.** The questions
  already exist and already passed the gate.
- **Code** — `apps/api/src/lib/pipeline-clients.ts`
  (`samplePublishedForAttempt`), `apps/api/src/services/pill.service.ts`,
  `POST /published/sample`.
- **Not to confuse with** — **Retrieval (RAG)**. Sampling picks from finished
  items; RAG fetches context to build something new. Quizzeira does RAG once, in
  Generation, offline — never while a learner waits.

## Grading

- **Definition** — Scoring a learner's response against ground truth.
- **In Quizzeira** — The `quiz-corrector` worker claims submitted attempts and
  grades them 0/1 per question against the stored `correctIndex` or
  `referenceAnswer`, adding a comment, explanation, and answer reveal. The prompt
  forbids inventing or changing the correct answer.
- **Code** — `apps/quiz-corrector/`, `/internal/reviews/*` in
  `apps/api/src/routes/internal.ts`, `quiz-correction` prompt in
  `apps/api/src/lib/default-prompts.ts`.
- **Not to confuse with** — **LLM-as-judge**. Grading assesses the learner and
  treats the question as correct by construction.

## Worker loop

- **Definition** — A long-running process that repeatedly performs a bounded unit
  of work on an interval.
- **In Quizzeira** — All four background services share `runLoop` with per-pass
  caps and optional time windows, so a pass is always bounded and a restart is
  always safe. Progress is durable in Postgres, never in worker memory.
- **Code** — `packages/worker-kit/src/loop.ts`; `src/index.ts` of each worker.
- **Not to confuse with** — a job queue. There are no per-item messages; each
  pass queries for outstanding work.

## Guardrails

- **Definition** — Controls on what enters and leaves a model, independent of the
  prompt.
- **In Quizzeira** — Crawled text is untrusted (OWASP LLM01): it is fenced and
  input-screened before reaching a model, and every model-authored string is
  output-screened (LLM10) before being persisted or shown in admin. Token and
  call budgets are shared in Redis (LLM06).
- **Code** — `packages/worker-kit/src/guardrails.ts`, `llm.ts`; see
  [`docs/guardrails.md`](./guardrails.md).
- **Not to confuse with** — prompt instructions. A model can ignore its prompt; it
  cannot ignore a screen that runs outside it.
