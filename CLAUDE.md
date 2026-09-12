# CLAUDE.md — Quizzeira

Concurso-only study platform: continuous **Ingestion** of public exams → **Extraction/Generation** into a draft Question bank → **Eval** publish gate → **Sampling** into study pills. Grading via `quiz-corrector`.

Agent behavioral rules: see [AGENTS.md](./AGENTS.md). Concept map: [docs/ai-swe-concepts.md](./docs/ai-swe-concepts.md). Guardrails: [docs/guardrails.md](./docs/guardrails.md).

## Live

| App | URL |
| --- | --- |
| Web | https://app.quizzeira.ferredemo.dev |
| API | https://api.quizzeira.ferredemo.dev |

Production deploys are owned by the **infra** repo (Jenkins job `quizzeira`). Quizzeira workers skip Headroom (`LLM_USE_HEADROOM=false`) — see infra `docs/quizzeira-headroom.md`.

## Layout

npm workspaces (`apps/*`, `packages/*`):

| Plane | Apps | Store |
| --- | --- | --- |
| Discovery | `discovery-api`, `discovery-crawler` | Postgres `quizzeira_discovery` + MinIO |
| Content | `content-api`, `content-worker`, `content-quality` | Postgres `quizzeira_content` + pgvector |
| Study | `api`, `web`, `quiz-corrector` | MySQL + Redis |

Shared packages: `packages/shared`, `packages/worker-kit`.

Specs / agent tooling: `docs/`, `specs/`, `.specify/`, `.agents/skills/` (e.g. Ralph). Legacy/extra trees may still exist (`exam-crawler`, `question-generator`, `question-updater`) — prefer the planes above.

## Stack

- TypeScript/Node, Prisma, React
- MySQL (study) + Postgres/pgvector (discovery + content) + Redis + MinIO
- Gemini/OpenAI via `worker-kit`

## Local

```bash
cp .env.sample .env
docker compose up --build
```

User seed only (no question-bank seed):

```bash
npm run db:seed -w @quizzeira/api
```

## Commands

```bash
npm run typecheck
npm test
# focused:
npm run test:shared
npm run test:i18n
npm run test:api
npm run test:content
npm run test:quality
npm run test:discovery

npm run db:generate
npm run db:migrate
npm run db:migrate:discovery
npm run db:migrate:content
```

Jenkins (via infra): `npm run test:shared && npm run test:i18n`.

## Conventions

- **No content seed.** Bank fills only via Ingestion → Content → Eval. `SEED_DEMO` / platform seed are users only.
- Only Eval-approved items reach Study Sampling.
- Internal service keys: scoped `INTERNAL_API_KEY_*` — never ship defaults in production.
- Align LLM calls with [docs/guardrails.md](./docs/guardrails.md) (Promptdesk-compatible contracts).
- **Crawler redesign**: [`docs/crawler-redesign-spec.md`](./docs/crawler-redesign-spec.md) is the canonical source of truth. [`specs/001-crawler-redesign/spec.md`](./specs/001-crawler-redesign/spec.md) exists only for Ralph compatibility. On any disagreement, **`docs/crawler-redesign-spec.md` wins**.
- Ralph autonomy is governed by `.specify/memory/constitution.md` when that skill/flow is active — do not apply unattended-commit rules to ordinary chat work unless asked.
