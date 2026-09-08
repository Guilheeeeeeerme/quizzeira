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

See [docs/guardrails.md](docs/guardrails.md) for the OWASP GenAI Top 10 **2026** control map, and [docs/security-audit-owasp-llm-2026.md](docs/security-audit-owasp-llm-2026.md) for the audit.

Worker LLM calls go through `worker-kit` (`packages/worker-kit`): `generateJson` owns provider fallback, fencing, Redis call budgets, and daily token hard-halts (`LLM_DAILY_TOKEN_BUDGET`).

| OWASP risk (2026) | Mitigation |
| --- | --- |
| LLM01 Prompt injection | Pre-screen + fence; SSRF-hardened link fetch; Search off when any attachments/links are present |
| LLM03 Excessive agency | Updater + bank LLM deposits require admin HITL; per-worker scoped `INTERNAL_API_KEY_*` |
| LLM06 Unbounded consumption | Redis call + token budgets; `/internal` rate-limited |
| LLM10 Improper output | Persist-time output policy; media URL allowlist (no `data:`) |

Provider notes:

- `QUESTION_UPDATE_GROUNDING=true` opts into Gemini Search for the updater; proposals still go to HITL. Default is **off**.
- Generator grounds only when `hasLinks` and materials lists are empty.
- Compose binds the API to `127.0.0.1:3000` and passes distinct worker keys + `REDIS_URL`.


## Deployment

Production images, DNS, TLS and rollout are owned by a separate private infrastructure repository. Pushes to `main` request a deployment from that repository, which builds reproducible release bundles (application SHA + infrastructure SHA) and rolls them out with health-checked Compose deployments.
