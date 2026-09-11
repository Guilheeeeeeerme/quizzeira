# Quizzeira

Concurso-only study platform: continuous **Ingestion** of public exams, **Extraction/Generation** into a draft Question bank, **Eval** publish gate, then **Sampling** into study pills. Grading remains **Grading** via `quiz-corrector`.

## Live

| Application | URL |
| --- | --- |
| Web | https://app.quizzeira.ferredemo.dev |
| API | https://api.quizzeira.ferredemo.dev |

## Features

- **Open exams catalog** — discovered via admin-registered sources (no content seeds / placeholders).
- **Published Question bank** — only Eval-approved items reach Study.
- **Study pills** — pick exam → focus → timed/pill session from published Sampling.
- **Async Grading** — `quiz-corrector` scores attempts.
- **Admin** (`role=ADMIN`) — Source registry, exams, quality HITL queue in the same design system.

## Architecture

See [`docs/ai-swe-concepts.md`](docs/ai-swe-concepts.md) for the canonical AI SWE concept map (Ingestion, Extraction, Generation, Eval, Publish gate, Sampling, Guardrails, …).

| Plane | Apps | Store |
| --- | --- | --- |
| Discovery | `discovery-api`, `discovery-crawler` | Postgres `quizzeira_discovery` + MinIO artifacts |
| Content | `content-api`, `content-worker`, `content-quality` | Postgres `quizzeira_content` + pgvector |
| Study | `api`, `web`, `quiz-corrector` | MySQL (users/topics/attempts) + Redis budgets |

**No content seed.** Only user seed (`seed-platform`: admin root; optional demo guest account without curriculum). Bank fills via continuous Ingestion → Content → Eval.

## Local compose

```bash
cp .env.sample .env
docker compose up --build
```

Services: MySQL, Postgres(+pgvector), Redis, MinIO, discovery-api/crawler, content-api/worker/quality, study api/web, quiz-corrector.

## Seed (users only)

```bash
npm run db:seed -w @quizzeira/api
```

Creates platform ADMIN from `DEV_ROOT_EMAIL` / `DEV_ROOT_PASSWORD`. Admin then adds sources under `/admin/sources`.

## Guardrails

See [`docs/guardrails.md`](docs/guardrails.md).
