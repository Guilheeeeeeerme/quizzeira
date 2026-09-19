# Autonomous Discovery and Question Quality Design

**Date:** 2026-09-19

**Status:** Proposed for implementation

**Scope:** Quizzeira discovery, content production, canonical question bank, quality control, observability, and production operations.

## 1. Product intent

Quizzeira must continuously find open Brazilian public exams, identify trustworthy preparation material and previous tests, extract each exam's syllabus, and maintain a reusable bank of accurate questions. A validated question belongs to a canonical curriculum topic and may serve every exam whose active syllabus maps to that topic. The system must keep working without routine operator intervention, while uncertain sources and questionable questions remain quarantined rather than published.

Success means:

- newly published exams enter the catalog without manual source registration;
- every active exam progresses visibly from discovery through syllabus coverage to a ready question bank;
- a provider outage pauses only provider-dependent jobs and cannot exhaust budgets, block unrelated work, or restart workers;
- every published question has syllabus, evidence, validation, and version provenance;
- shared topics reuse questions and knowledge across exams;
- stale or contradicted questions leave circulation automatically;
- every unit of work can be traced across services from structured logs and durable job state;
- production load stays within the current 2-vCPU, 7.8-GiB VPS envelope and avoids provider traffic spikes.

## 2. Confirmed production diagnosis

The redesign starts from measured failures, not hypothetical improvements:

- 36 exams exist in Discovery, but published questions belong to only 4 exam slugs.
- The content database contains 114 pending documents, 4 extracting documents, and 572 failed documents.
- Only 4,794 of 35,924 chunks have embeddings.
- The newest published question and newest draft were created on 2026-09-17.
- The configured Gemini credential returns HTTP 401. OpenAI embeddings return HTTP 429 because the account has no credits.
- The shared call counter reached 6,915 against a limit of 6,000 despite no recorded successful token use. Rejected attempts continue incrementing the counter.
- `runLoop` permits overlapping ticks. The content worker reaches its 1-GiB cgroup limit and is OOM-killed approximately every 16 minutes; the inspected container had restarted 121 times.
- Quality evaluation repeatedly selects the same oldest draft. Provider failure therefore blocks every later draft.
- Some document output transactions exceed Prisma's default interactive transaction timeout.
- Five of eleven configured listing sources are broken. Nineteen discovered source proposals remain inert, and many are social, navigation, or unrelated domains.
- The current `QuestionItem` is owned by one `examSlug`; `canonicalKey` does not provide a many-to-many mapping to compatible exam syllabi.

The content and quality workers were stopped as a reversible safety measure. Discovery, APIs, the web app, document processor, and existing published content remain online.

## 3. Architectural choice

### 3.1 Considered approaches

1. **Credentials and restart only.** Fast, but restores the same retry storm, OOM loop, manual source bottleneck, and exam-bound question model. Rejected.
2. **One hardened content worker.** Fixes overlap and backoff with limited deployment change, but one high-memory document can still disrupt embeddings, generation, and Eval. Scaling and logs remain ambiguous. Rejected as the target architecture.
3. **Durable staged pipeline with bounded services.** Separate consumers by resource profile and failure domain, retain the existing Discovery/Content/Study database ownership, and use Postgres job leases plus Redis only for provider budgets and short-lived circuit state. Recommended.

### 3.2 Boundary rule

A deployable service is justified when it has a distinct resource profile, provider dependency, retry policy, or scaling requirement. Pure transformations stay as library modules. This avoids both the current monolith and a container per function.

## 4. Target services

Existing APIs remain the owners of their schemas. Workers never connect directly to another plane's database.

| Service | Responsibility | External dependency | Initial concurrency / memory |
| --- | --- | --- | --- |
| `discovery-api` | Source, exam, artifact, candidate, and discovery-job ownership | Supabase, MinIO | existing / 1 GiB |
| `source-scout` | Search for exam authorities and open-exam pages; score source candidates | Firecrawl/search | 1 / 256 MiB |
| `exam-crawler` | Crawl approved listing/detail sources and store official artifacts | Chromium/web | 1 / 2 GiB |
| `topic-fetcher` | Execute syllabus-topic searches and fetch knowledge/evidence candidates | Firecrawl/web | 1 / 768 MiB |
| `content-api` | Documents, canonical curriculum, jobs, questions, mappings, reviews | Supabase, MinIO | existing / 1 GiB |
| `artifact-importer` | Idempotently mirror new Discovery artifacts into Content | internal APIs | 1 / 256 MiB |
| `document-worker` | Normalize, classify, section, chunk, map, rank, and distill one document | doc-processor; LLM only for residue/distillation | 1 / 768 MiB |
| `embedding-worker` | Embed eligible chunks and canonical topics | embedding provider | 1 / 384 MiB |
| `coverage-planner` | Compare open-exam syllabus coverage and enqueue missing knowledge/questions | internal APIs only | singleton / 256 MiB |
| `question-generator` | Generate drafts for canonical topic deficits | LLM provider | 1 / 384 MiB |
| `quality-validator` | Deterministic structure, relevance, grounding, duplication, and temporal checks | internal APIs only | 2 / 384 MiB |
| `quality-judge` | LLM adjudication only for deterministic survivors | LLM provider | 1 / 384 MiB |
| `question-revalidator` | Recheck evidence freshness and changed source facts; quarantine stale items | internal APIs; optional LLM | singleton / 384 MiB |
| `doc-processor` | PDF/HTML/OCR normalization | CPU/memory | existing / 2 GiB |
| `edge-watchdog` | Check public web/API/pipeline health from outside the VPS and notify an operator webhook on state changes | Cloudflare Worker Cron | one sub-10-ms invocation / 5 min |

`quiz-corrector`, Study API, and web remain separate. Node workers use small images built from the shared dependency layer. Services default to concurrency one; scale is increased only from measured queue latency. Browser and OCR workloads never share a process with LLM workloads.

## 5. Durable job model

Each asynchronous boundary uses a typed Postgres job table owned by the relevant API. A job contains:

- `id`, `kind`, `entityId`, and deterministic `dedupeKey`;
- `status`: `queued`, `leased`, `deferred`, `done`, or `dead`;
- `priority`, `availableAt`, `leaseOwner`, and `leaseExpiresAt`;
- `attempts`, `maxAttempts`, `lastErrorCode`, and sanitized `lastError`;
- `correlationId`, `causationId`, `createdAt`, `startedAt`, and `finishedAt`.

Workers claim jobs atomically with `FOR UPDATE SKIP LOCKED`. Lease expiry makes crash recovery automatic. Success is idempotent. Retry schedules are error-class specific and include jitter. Terminal failures enter a dead-letter view instead of disappearing or hot-looping.

No interval may start a second pass while its previous pass is active. The shared `runLoop` becomes single-flight and records skipped-overlap events. Every worker also enforces a per-process concurrency semaphore.

## 6. Autonomous source and exam discovery

### 6.1 Source scouting

`source-scout` runs a small rotating set of Portuguese queries for public exams, banca portals, official notices, and previous-test repositories. It stores `SourceCandidate` evidence rather than activating arbitrary outbound domains.

Candidate scoring is deterministic:

- official government or recognized banca identity;
- exam-language signals and recent edital/detail links;
- robots/accessibility result;
- historical artifact yield and content density;
- domain age/history already observed by Quizzeira;
- penalties for social, storefront, login, link farm, advertising, foreign-language, and unrelated content.

Policy bands:

- score at or above `0.85` and an official/banca classification: automatically activate with restrictive role permissions;
- `0.60–0.84`: quarantine for admin review;
- below `0.60` or a hard deny rule: blocklist with evidence and expiry;
- repeated low-value or failed crawls: automatically suspend, then probe with 1d/3d/7d/30d backoff;
- a blocklist entry may expire for transient failures but is permanent for malicious or categorically irrelevant sources.

Outbound-link discovery remains a weak signal only. Social and navigation domains are rejected before proposal creation.

### 6.2 Exam identity and lifecycle

Exam identity requires organization, edition or year, and an official detail or edital signal. A catalog row records why it is considered open. Each run revalidates registration dates and publication state. An exam becomes `stale` when not observed within its source-specific interval and `closed` only from explicit evidence or the existing grace-period rule.

Discovery must measure `last_new_exam_at`, source coverage, candidate acceptance rate, broken-source duration, and artifact yield. “Successful run with zero discoveries” is healthy only while freshness SLOs remain satisfied.

## 7. Canonical curriculum and reusable question bank

`CanonicalTopic` is the durable subject/topic/subtopic identity. Exam-specific `SyllabusNode` rows map to it through `SyllabusTopicMap`, including confidence and mapping method. Knowledge units attach primarily to `CanonicalTopic`, while retaining document and chunk provenance.

`Question` becomes exam-independent and contains the prompt, answer, explanation, locale, difficulty, canonical topic, knowledge-unit provenance, fingerprint, and validation lifecycle. `QuestionApplicability` maps one question to any compatible syllabus node and records:

- match confidence and mapping method;
- position/exam constraints;
- effective dates and legal-version constraints;
- active, quarantined, or revoked state;
- last validation time.

Sampling selects published questions through active applicability mappings. The coverage planner first reuses compatible published questions, then generates only the remaining canonical-topic deficit. Exam-specific wording is prohibited unless an applicability record explicitly scopes the item to that exam.

Legacy `QuestionItem` rows migrate without destructive deletion: canonical topics are inferred, applicability rows are created for their existing exam/syllabus node, and the original identifiers remain traceable.

## 8. Quality and freshness pipeline

### 8.1 Deterministic validator

`quality-validator` claims drafts independently and evaluates shape, syllabus mapping, administrative trivia, duplicate/near-duplicate stems, grounding, answer support, option pathologies, temporal claims, and provenance completeness. Hard failures are terminal. Valid survivors enter `awaiting_judge`; uncertain deterministic cases enter `needs_review` without spending LLM tokens.

### 8.2 LLM judge

`quality-judge` only sees deterministic survivors and the smallest necessary evidence bundle. It independently answers the item, checks correctness and single-answer defensibility, and returns calibrated relevance, grounding, durability, and difficulty scores. Provider failure defers the job with exponential backoff and a provider circuit breaker; it never blocks a different draft indefinitely.

Publishing requires all mandatory deterministic checks plus the configured judge threshold. The publish transition remains single-owner and auditable.

### 8.3 Revalidation

Every published question has a `validThrough` policy derived from its evidence:

- timeless grammar/math/foundational knowledge: long interval;
- legislation and regulations: shorter interval and source-version fingerprint;
- explicitly current facts: short interval or forced human review;
- missing or changed evidence: immediate quarantine.

`question-revalidator` prioritizes changed documents, expiring questions, reported questions, and high-usage questions. Revalidation creates a new review record. It never silently rewrites a published question; replacement creates a new version and revokes the old applicability.

## 9. Provider control and cost safety

Each provider/model capability has an explicit health state: `healthy`, `open`, `half_open`, or `disabled`. Authentication and billing failures open the circuit for hours; transient 429/5xx failures use exponential backoff. Only one half-open probe is allowed per cooldown.

Budget reservation is atomic and non-incrementing after a cap is reached. Failed authentication, local policy rejection, cache hit, and budget rejection do not count as successful usage. Provider attempts, successful calls, and tokens are separate counters. Embeddings have their own budget and circuit.

Workers use weighted fair scheduling across exams and canonical topics. A single exam, provider, or poisoned job cannot consume the queue. Initial production canary limits are one provider-dependent job at a time, at most one generation batch and one judge item per minute, with configurable daily ceilings below provider quotas.

A valid Gemini key or funded OpenAI account is an external prerequisite for live generation and judging. Deployment must fail readiness for provider-dependent workers when no configured provider passes a capability probe; APIs and deterministic workers remain healthy.

### 9.1 Cloudflare free-tier adoption

Cloudflare is an edge and provider-control layer, not the authoritative workflow engine.

- Route provider traffic through **AI Gateway** where supported. Its free core supplies request analytics, caching, and rate limiting; enable spend limits or routing features only when the account exposes them without changing the approved budget. Application-side budgets and circuits remain authoritative so the system can bypass the gateway without losing safety. Exactly one layer owns retries for a request to prevent retry multiplication. Send `cf-aig-collect-log-payload: false`, attach only sanitized correlation metadata, and retain Loki plus `StageMetric` as the complete audit record. Gateway use does not make third-party inference free and does not repair invalid provider credentials.
- Deploy **`edge-watchdog` on Workers Free** with one Cron trigger every five minutes. It checks only bounded public health/readiness endpoints and sends a notification only when state changes or remains unhealthy past a threshold. It stores a tiny state record in Workers KV. This provides an independent failure domain while staying far below the free 100,000 requests/day, 10-ms CPU/invocation, five-Cron-trigger, and 1,000 KV writes/day limits.
- Add **Turnstile Free** to abuse-prone anonymous submission, report, and authentication forms. Server-side token verification is mandatory; it is not placed in service-to-service paths.
- Treat **Workers AI** as an experimental, circuit-broken provider adapter for low-volume classification or judging only. The free allowance is 10,000 neurons/day and ends with hard failures when exhausted. A Portuguese golden-set evaluation must meet the same accuracy threshold as the primary provider before it can receive production work. It never becomes an implicit fallback that spends or publishes without configured policy.
- Browser Rendering's free allowance (10 browser minutes/day) may be used only for controlled diagnostics or a small rescue path after ordinary fetching fails. It is not the primary crawler.

Cloudflare Queues, Workflows, D1, Hyperdrive, and R2 are deliberately excluded from the core design. Queue retention is at most 24 hours and the free 10,000 operations/day budget is consumed by writes, reads, and acknowledgements; Workflows duplicates the durable job state; D1/Hyperdrive would split database ownership; and R2 would violate the current MinIO storage decision. The Postgres lease model therefore remains the durable source of truth.

## 10. Complete observability

### 10.1 Structured event contract

All services write one-line JSON to stdout for Alloy/Loki. Required fields are:

- timestamp, severity, service, version, environment;
- event name and outcome;
- `traceId`, `correlationId`, `causationId`, and `jobId`;
- safe domain identifiers such as sourceId, examSlug, documentId, canonicalTopicId, questionId, and stage;
- attempt, queue age, duration, retry delay, provider/model capability, HTTP status class, and normalized error code;
- token counts and estimated cost when applicable.

Logs never contain API keys, authorization headers, complete provider bodies, raw documents, full prompts, or full candidate answers. URLs are normalized and query strings removed when they may contain tokens.

### 10.2 Coverage requirements

Every job emits `enqueued`, `claimed`, `started`, one terminal or deferred event, and lease-expiry recovery when applicable. Every internal HTTP boundary propagates W3C `traceparent` plus the correlation ID. APIs log request completion, status, latency, caller service, and route template. Provider wrappers log each attempt and final circuit decision. Process startup logs sanitized configuration, build SHA, enabled stages, and capability readiness.

Durable `StageMetric` records cover the same funnel independently of Loki's 24-hour retention. Metrics include queue depth/age, throughput, retry/dead-letter counts, discovery freshness, source yield, document success, embedding coverage, canonical coverage, generation yield, publish rate, revalidation lag, provider health, budget usage, worker RSS, restarts, and OOM events.

### 10.3 Operator views and alerts

Grafana receives a Quizzeira overview and per-correlation drill-down. Alerts are emitted for:

- no new exam or artifact beyond configured freshness SLO;
- oldest runnable job beyond stage SLO;
- provider circuit open or credential failure;
- queue dead letters, repeated lease expiry, or retry storm;
- worker restart/OOM;
- embedding or syllabus coverage stagnation;
- no published question for 24 hours while deficits exist;
- unexpected cost-rate increase.

Admin health endpoints expose the same status without requiring log access. A pipeline can be `degraded` while the HTTP process is live; readiness reflects whether that worker can perform its advertised capability.

## 11. Error handling and data integrity

- Document processing handles one bounded document per lease and releases large buffers before claiming another.
- Large section/chunk writes use bulk operations or an explicit bounded transaction timeout; partial output is never visible.
- Exact artifact, document, knowledge-unit, and question dedupe keys make retries safe.
- Poison jobs move to dead letter after classified attempts and do not block FIFO queues.
- Provider errors are normalized as authentication, billing, rate limit, transient, budget, invalid response, or policy.
- Source failures distinguish access, robots, parse drift, duplicate identity, and low-value content.
- Schema migrations are additive first, backfilled, switched through compatibility reads, then cleaned up only after verification.

## 12. Rollout and verification

Implementation is split into independently deployable slices:

1. **Safety foundation:** single-flight loop, job leases/backoff, provider circuits, budget correctness, transaction fix, and logging contract.
2. **Worker extraction:** deploy new consumers with existing behavior behind stage flags; run shadow metrics before disabling the monolithic worker.
3. **Canonical bank:** add canonical topic and applicability models, backfill, dual-read verification, then switch sampling/planning.
4. **Autonomous scouting:** deploy candidate scoring in observe-only mode, compare decisions, then enable high-confidence auto-activation.
5. **Async Eval and revalidation:** deterministic queue, judge queue, freshness policies, and quarantine workflow.
6. **Cloudflare boundary:** configure AI Gateway with payload logging disabled, deploy the edge watchdog, and add Turnstile where anonymous traffic creates abuse risk. Benchmark Workers AI independently before enabling its adapter.
7. **Operational hardening:** dashboards, alerts, runbooks, and dead-letter controls.

Tests include unit tests for state machines and scoring, contract tests for every API boundary, transaction and lease concurrency tests against Postgres, provider failure simulations, deterministic replay fixtures, migration/backfill tests, and a production canary. The canary processes one topic for one exam with concurrency one. It must demonstrate stable memory, no overlapping jobs, correct backoff, full log correlation, bounded provider calls, and a valid published/rejected outcome before capacity increases.

Quizzeira verification remains targeted during development and ends with typecheck plus all affected Discovery, Content, Quality, worker-kit, API, and infra Compose tests. No seed-clean or broad data reset is part of this rollout.

## 13. Non-goals

- No collapse of Discovery, Content, and Study schemas.
- No replacement of Supabase Postgres, Redis, MinIO, Loki, Alloy, or Jenkins.
- No Cloudflare Queue, Workflow, D1, Hyperdrive, or R2 dependency in the authoritative content pipeline.
- No unbounded agentic browser that searches and publishes in one opaque step.
- No automatic publication without the Eval gate.
- No automatic activation of uncertain third-party sources.
- No Headroom routing change for Quizzeira workers in this project.

## 14. Acceptance criteria

- Workers run for 24 hours without overlap, OOM, or unbounded memory growth.
- Invalid provider credentials cause one probe and an open circuit, not repeated traffic.
- Runnable jobs behind a deferred job continue to progress.
- Every job is traceable in Loki and durable metrics by correlation ID.
- Source scouting discovers, scores, and correctly classifies a controlled golden set; only high-confidence official/banca candidates auto-activate.
- At least one new open exam completes discovery through syllabus coverage in the production canary.
- A canonical published question is sampled by two compatible exam syllabi through separate applicability mappings.
- Every new published question has canonical topic, knowledge provenance, deterministic review, judge review, and validation timestamps.
- A changed or expired evidence fixture automatically quarantines its affected question.
- Provider calls and tokens remain within configured canary limits, with no burst above concurrency one.
- AI Gateway records sanitized provider metadata without payloads, and disabling or bypassing it preserves application budget enforcement.
- The edge watchdog detects a synthetic public-health failure and emits exactly one state-change alert without exposing internal data.

## 15. Cloudflare references

Free-tier limits and feature decisions were checked against the official documentation on 2026-09-19:

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [AI Gateway features](https://developers.cloudflare.com/ai-gateway/features/)
- [AI Gateway limits](https://developers.cloudflare.com/ai-gateway/reference/limits/)
- [AI Gateway metadata-only logging](https://developers.cloudflare.com/ai-gateway/observability/logging/)
- [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)
- [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/)
- [Browser Rendering pricing announcement](https://developers.cloudflare.com/changelog/post/2025-07-28-br-pricing/)
