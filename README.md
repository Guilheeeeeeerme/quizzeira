# Quizzeira

Educational quiz platform for AI software-development topics — agent design, prompt engineering, workflow automation and more — with AI-powered answer grading and continuous question upkeep.

## Live

| Application | URL |
| --- | --- |
| Web | https://app.quizzeira.ferredemo.dev |
| API | https://api.quizzeira.ferredemo.dev |

## Features

- **Five difficulty levels** — Beginner to Pro, each with multiple-choice and open-question pools.
- **Asynchronous AI grading** — submitted attempts are queued as `PENDING`, picked up by the `quiz-corrector` worker, and returned `CORRECTED` with a score, general comment and per-question feedback.
- **Question upkeep** — the `question-updater` worker periodically modernizes outdated questions and re-levels them across the difficulty ladder using structured LLM output.
- **Answer-key isolation** — the UI never receives `correctIndex` or `referenceAnswer`; grading happens entirely in the worker layer.
- **Hardened API** — JWT access/refresh tokens in httpOnly cookies, Redis-backed rate limiting, internal endpoints isolated behind the API boundary.

## Architecture

```
Web (Vite + Chakra UI)
    │  httpOnly JWT cookies
    ▼
Fastify API (Prisma → MySQL 8)
    ├── Redis            → rate limiting + job coordination
    ├── quiz-corrector   → claims pending attempts → Gemini grading
    └── question-updater → modernizes / re-levels question pools
```

Workers share a `worker-kit` package that standardizes LLM loops, structured JSON generation, prompt loading and internal API calls — new workers are a few files, not a new framework.

### Quiz flow

1. Register / sign in.
2. Pick a level and answer **4 MCQ + 1 open** question.
3. Submit → attempt status `PENDING` (no grading at submit time).
4. The corrector worker moves it through `IN_CORRECTION` → `CORRECTED`.
5. The results page polls until `CORRECTED` and renders score + feedback.

## Tech stack

| Layer | Technology |
| --- | --- |
| API | Fastify, Prisma, MySQL 8 |
| Cache / limits | Redis (`@fastify/rate-limit`) |
| Workers | Node workers on a shared `worker-kit` (Gemini structured output) |
| Frontend | React, Vite, Chakra UI v3 |
| Auth | JWT access/refresh in httpOnly cookies (SSO-ready) |

## Local development

```bash
cp .env.sample .env
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:3000 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

On first boot the API runs migrations and seeds five difficulty levels with MCQ and open question pools, plus local users `root@quizzeira.local` and `admin@quizzeira.local` (`Password123!`).

## Repository layout

```
apps/api               Fastify API — auth, levels, attempts, reviews
apps/quiz-corrector    AI grading worker (claims pending attempts)
apps/question-updater  Question modernization / re-leveling worker
apps/web               React + Chakra UI client
packages/shared        Shared types and contracts
packages/worker-kit    Reusable worker runtime (LLM loops, prompts, internal API)
```

## Guardrails & LLM spend

Worker LLM calls are standardized behind `worker-kit` (`packages/worker-kit`): every call goes through `llm.generateJson`, which owns provider fallback, guardrails and spend budgets.

OWASP Top 10 for LLM apps mapping:

| OWASP risk | Mitigation |
| --- | --- |
| LLM01 Prompt injection | Every untrusted payload (quiz questions, user answers) is pre-screened against regex policies (`packages/worker-kit/guardrails/registry.yml`, `guardrail_block` errors, no LLM call and no spend on a block) and then wrapped in a `BEGIN_UNTRUSTED_QUIZ_DATA` / `END_UNTRUSTED_QUIZ_DATA` fence, with a system-prompt appendix stating the content is data, not instructions. |
| LLM02 Sensitive disclosure | The same guardrail appendix forbids revealing system prompts, other prompts, secrets or credentials; spec views and prompts stay behind `/internal*` routes (API rate limiting applies, Redis-backed `@fastify/rate-limit`). |
| LLM10 Unbounded consumption | In-process fixed-window rate limit (`LLM_RATE_LIMIT_PER_MINUTE`, default 20/min) plus a daily budget (`LLM_DAILY_BUDGET`, default 500/day, UTC reset). Budget is per worker process and resets on container restart; values are read from env so the API/infra deployment can provision them. |

Provider and model selection:

- `LLM_PROVIDER_ORDER` (default `gemini,openai`) defines the fallback order; unknown names are ignored and providers without an API key are skipped. With no key at all, workers log and skip ticks (`llm_unavailable`): quiz-corrector releases the claimed attempt, question-updater skips the question.
- The `grounding: true` option (Google Search grounding) is honored only by the Gemini provider; the OpenAI provider ignores it.
- Model per call: `opts.attempt` (0-based) picks `rank[attempt]` from the cheapest-model table (`model-rank.ts`, seeded with input USD/1M prices, enriched best-effort from each provider's `models.list` every `MODEL_RANK_REFRESH_MS`, default 12h, text-generation models only, `MODEL_RANK_TOP_N` per provider). Attempt 0 is the configured default model (cheapest available).

Scheduling:

- `WORKER_WINDOWS` ("HH:MM,HH:MM", with `WORKER_TZ`, default UTC) restrict ticks to a ±30 min window; outside windows ticks are cheap no-ops. Unset = continuous.
- Docker compose runs question-updater 2x/day by default (`07:00,19:00`). quiz-corrector stays continuous by default (corrections stay near-real-time); set `WORKER_WINDOWS` to switch it to batch mode as a deliberate tradeoff.
- API hardening is unchanged: global Fastify rate limit with `/health` and `/internal*` allowlisting; the API itself makes no LLM calls, so no LLM budget env is consumed there.

## Deployment

Production images, DNS, TLS and rollout are owned by a separate private infrastructure repository. Pushes to `main` request a deployment from that repository, which builds reproducible release bundles (application SHA + infrastructure SHA) and rolls them out with health-checked Compose deployments.
