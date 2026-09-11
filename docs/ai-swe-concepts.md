# AI software engineering concepts in Quizzeira

Canonical names below match code modules. Grep the concept name to find the implementation.
**No content seed** — continuous Ingestion only; Study never invents exams or questions.

### Ingestion
**Definition:** Continuous collection of external sources into an artifact store.
**In Quizzeira:** Playwright crawl of admin-registered sources; open exams + PDF/edital objects.
**Code:** `apps/discovery-crawler`, `apps/discovery-api` (`Source`, `Exam`, `Artifact`, `CrawlRun`).
**Not to confuse with:** Extraction (parse already-fetched artifacts) or Sampling (study reads published bank).

### Source registry
**Definition:** Admin catalog of origins with politeness, trust, and health.
**In Quizzeira:** Enable/interval/trust; proposals wait for HITL approve.
**Code:** `Source`, `/admin/sources`, `apps/discovery-api/src/routes/admin.ts`.
**Not to confuse with:** Document store (objects) or Question bank.

### Document store
**Definition:** Object + metadata store for editais/provas/gabaritos.
**In Quizzeira:** MinIO bucket `quizzeira` + `Artifact` / `Document` rows.
**Code:** `apps/discovery-api/src/lib/storage.ts`, `Artifact`, `apps/content-api` `Document`.
**Not to confuse with:** Question bank (Q&A lifecycle).

### Extraction
**Definition:** Raw artifact → text/structure (chunks).
**In Quizzeira:** Split document text into chunks before Generation.
**Code:** `apps/content-worker/src/extraction/`.
**Not to confuse with:** Generation (LLM creates Q&A) or Embeddings.

### Generation
**Definition:** LLM creates Q&A from programa/edital evidence.
**In Quizzeira:** Worker deposits `QuestionItem` with `status=draft` only.
**Code:** `apps/content-worker/src/generation/`, `POST /internal/questions/deposit`.
**Not to confuse with:** Grading (learner attempt correction) or Eval (bank quality).

### Question bank
**Definition:** Versioned corpus of Q&A with lifecycle states.
**In Quizzeira:** Postgres `QuestionItem` (`draft` → Eval → `published`|`failed`).
**Code:** `apps/content-api` Prisma `QuestionItem`.
**Not to confuse with:** Redis legacy stores (being retired) or Study MySQL attempt snapshots.

### Publish gate
**Definition:** Only approved items enter the product surface.
**In Quizzeira:** Content never self-publishes; Quality promotes draft→published.
**Code:** `apps/content-quality`, `POST /internal/quality/:id/complete`, `/published/*`.
**Not to confuse with:** Admin force-publish (HITL exception with audit).

### Eval
**Definition:** Automatic quality assessment of items/outputs.
**In Quizzeira:** Continuous worker over draft items.
**Code:** `apps/content-quality` (`// Concept: Eval`).
**Not to confuse with:** Grading (learner scores).

### LLM-as-judge
**Definition:** Model returns structured JSON judging completeness/coherence.
**In Quizzeira:** Completeness, coherence, single clear answer.
**Code:** `apps/content-quality/src/judge.ts`, prompt key `quality-completeness`.
**Not to confuse with:** Structural validation (no LLM).

### Structural validation
**Definition:** Deterministic rules without an LLM.
**In Quizzeira:** Stem/options/correctIndex/referenceAnswer shape checks.
**Code:** `apps/content-quality/src/structural.ts`.
**Not to confuse with:** Output-policy / media allowlist (shared Guardrails).

### HITL
**Definition:** Human approves/rejects before production.
**In Quizzeira:** Quality failure queue + source proposals.
**Code:** `/admin/quality`, `/admin/sources` proposals, `QualityFailure`.
**Not to confuse with:** Publish gate automation (default path).

### Guardrails
**Definition:** Fences, budgets, output policy around LLM use.
**In Quizzeira:** worker-kit fence/screen, Redis LLM budgets, internal key scopes.
**Code:** `packages/worker-kit`, `packages/shared` output-policy, `docs/guardrails.md`.
**Not to confuse with:** Eval (item quality) or Grading.

### Prompt registry
**Definition:** Versioned prompts loaded at runtime.
**In Quizzeira:** Study API prompt store; workers `loadPrompt(key)`.
**Code:** `apps/api/src/services/prompt-store.ts`, worker-kit `loadPrompt`.
**Not to confuse with:** default prompt seed strings in repo (templates, not content bank).

### Worker / agent loop
**Definition:** Claim job → tools/LLM → write results → repeat.
**In Quizzeira:** `runLoop` workers for discovery/content/quality/corrector.
**Code:** `packages/worker-kit/src/loop.ts`, each `apps/*/src/index.ts`.
**Not to confuse with:** HTTP request/response Study API.

### Grading
**Definition:** Correct a learner attempt (≠ bank Eval).
**In Quizzeira:** `quiz-corrector` claims PENDING attempts.
**Code:** `apps/quiz-corrector`, `apps/api` review internal routes.
**Not to confuse with:** Eval / LLM-as-judge on the bank.

### Embeddings
**Definition:** Vectors for similarity search.
**In Quizzeira:** `Chunk.embedding` (pgvector) written on ingest path readiness.
**Code:** `apps/content-api` `Chunk`, migration `vector`.
**Not to confuse with:** RAG (not on Study path yet).

### RAG
**Definition:** Retrieve → augment → generate.
**In Quizzeira:** Prepared via embeddings; **not** used on Study Sampling in this refactor.
**Code:** embeddings on `Chunk`; Study uses Sampling instead.
**Not to confuse with:** Sampling (metadata filter of published bank).

### Grounding
**Definition:** Constrain generation to evidence.
**In Quizzeira:** Future Content path; Generation already passes chunk evidence.
**Code:** `apps/content-worker` generation prompt evidence block.
**Not to confuse with:** Guardrails fencing of untrusted text.

### Sampling (not RAG)
**Definition:** Filter the bank by metadata (exam/subject/locale).
**In Quizzeira:** Study `startPill` calls `/published/questions/sample`.
**Code:** `apps/content-api/src/routes/published.ts`, `apps/api/src/lib/pipeline-clients.ts`, `pill.service.ts`.
**Not to confuse with:** RAG retrieval.
