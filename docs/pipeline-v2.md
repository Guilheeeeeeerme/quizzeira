# Pipeline v2 runbook

Short operator guide for the role-typed content pipeline (`docs/crawler-redesign-spec.md`). Canonical contracts live in `@quizzeira/shared` and `apps/content-api` internal routes.

Pipeline v2 is the only path: import → process → planner → eligible-only embeddings → syllabus-leaf generation. The `PIPELINE_V2` flag has been removed.

## Verification

```bash
bash scripts/cleanup-and-verify-pipeline-v2.sh
# or without tombstone cleanup:
bash scripts/verify-pipeline-v2.sh
```

CI: `.github/workflows/pipeline-v2.yml` runs shared/quality/discovery/content tests, typecheck, build, and doc-processor pytest. `.github/workflows/no-listing-trivia.yml` remains the focused REG-001..006 job.

## Stage toggles (content-worker)

All default **on** unless set to `false` or `0`:

| Flag | Stage |
| --- | --- |
| `CONTENT_STAGE_IMPORT` | Discovery artifacts → Content documents |
| `CONTENT_STAGE_NORMALIZE` | doc-processor / HTML fallback |
| `CONTENT_STAGE_CLASSIFY` | Document + section roles |
| `CONTENT_STAGE_SYLLABUS` | Edital → syllabus tree |
| `CONTENT_STAGE_EVIDENCE` | Prova/gabarito → previous questions + style profile |
| `CONTENT_STAGE_KNOWLEDGE` | Chunk, map, distill knowledge units |
| `CONTENT_STAGE_PLANNER` | Coverage planner → topic queries |

Worker passes (also default on): `CONTENT_EXTRACTION_ENABLED`, `CONTENT_EMBEDDINGS_ENABLED`, `CONTENT_GENERATION_ENABLED`.

## Budgets and caps

| Env | Default | Purpose |
| --- | --- | --- |
| `CONTENT_DOCS_PER_PASS` | 3 | Documents processed per tick |
| `CONTENT_CHUNKS_PER_EMBED_PASS` | 32 | Embedding batch size |
| `CONTENT_EXAMS_PER_GENERATION_PASS` | 2 | Planner queue leaves per tick |
| `CONTENT_QUESTIONS_PER_RUN` | 6 | Drafts per generation run |
| `CONTENT_PUBLISHED_TARGET` | 40 | Target published items per syllabus leaf |
| `CONTENT_EMBEDDING_DIMENSIONS` | 768 | Must match pgvector column |
| `DOC_PROCESSOR_URL` | `http://doc-processor:3030` | Normalize service |

LLM token/call budgets are enforced in Redis via worker-kit guardrails (`docs/guardrails.md`). Stage budgets: `LLM_BUDGET_*_TOKENS` in `.env.sample`.

## Embeddings (eligible only)

The worker always requests `/internal/embeddings/queue?eligibleOnly=true`. Only chunks with `eligibility = eligible` are embedded. Search defaults to eligible chunks (`eligibleOnly` defaults true on `/internal/chunks/search`).

## Generation unit of work

Generation uses `GET /internal/generation/planner-queue` (syllabus leaves with KU deficit). Each run and draft **requires** `syllabusNodeId`, a non-`geral` subject (leaf path), and non-empty `knowledgeUnitIds` (`origin: generation`). The API returns 400 otherwise. Exam-level `/internal/generation/queue` no longer exists.

## Eval ladder

content-quality runs: structural → relevance → grounding → judge → gate. Regression guard: `npm run test:regression` (REG-001..006 must fail `tests_exam_metadata`).

## Study sampling

- `GET /published/exams/:slug/syllabus` — active syllabus tree
- Study API: `GET /topics/:topicId/syllabus` + `POST /topics/:topicId/pills/start` with optional `syllabusNodeIds`
- Transcription mix capped at ~30% of a sample

## Backfill (existing deployments)

1. Apply content migration: `npm run db:migrate:content`
2. Apply discovery migration: `npm run db:migrate:discovery`
3. Regenerate clients: `npm run db:generate`
4. Demote legacy generation publishes (idempotent): `POST /internal/question-items/demote-legacy-generation` on content-api
5. Re-import / re-process artifacts so roles, syllabi, and eligible chunks populate
6. Ensure doc-processor is healthy (`DOC_PROCESSOR_URL`)

Migration SQL also sets existing chunks to `eligibility = parked` and demotes published `origin=generation` items to `needs_review`.

## Verify locally

```bash
# Preferred: unlink §48.8 tombstones then run the full gate
bash scripts/cleanup-and-verify-pipeline-v2.sh

# Or verification only:
bash scripts/verify-pipeline-v2.sh
```

Until shell/delete work in the agent harness, run these locally. Tombstones
(`pdf-text.ts`, `chunk.ts`, `extraction/index.ts`, `listing-parse.ts`) remain
on disk as empty stubs until `cleanup-and-verify-pipeline-v2.sh` unlinks them
and clears the matching tsconfig excludes.
