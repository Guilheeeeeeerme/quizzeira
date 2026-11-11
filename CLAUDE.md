# CLAUDE.md — Quizzeira (product: Concurseria)

Concurso-only study platform: continuous **Ingestion** of public exams → **Extraction/Generation** into a draft Question bank → **Eval** publish gate → **Sampling** into study pills. Grading via `quiz-corrector`.

Agent behavioral rules: see [AGENTS.md](./AGENTS.md). Concept map: [docs/ai-swe-concepts.md](./docs/ai-swe-concepts.md). Guardrails: [docs/guardrails.md](./docs/guardrails.md).

## Live

| App | URL |
| --- | --- |
| Web | https://app.concurseria.ferredemo.dev |
| API | https://api.concurseria.ferredemo.dev |

Production deploys use this repo's **Deploy quizzeira** workflow (GitHub Actions → GHCR → Dokploy, `deploy/compose.prod.yml`) and **Pages + edge** workflow (Cloudflare Pages/Workers). Infra owns shared host operations; do not add a competing deployment path. Study/Discovery/Content Postgres run on Hostinger VPS; workers call Gemini and JEV directly. See [deploy/README.md](./deploy/README.md) and [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

User-facing brand is **Concurseria** (subtitle **Gourmet**). Engineering names (`quizzeira` schemas, packages, GHCR paths) stay as-is.

## Layout

npm workspaces (`apps/*`, `packages/*`):

| Plane | Apps | Store |
| --- | --- | --- |
| Discovery | `discovery-api`, `discovery-crawler` | Postgres `quizzeira_discovery` + MinIO |
| Content | `content-api`, `content-worker`, `content-quality` | Postgres `quizzeira_content` + pgvector |
| Study | `api`, `web`, `quiz-corrector` | Postgres `quizzeira_study` + Redis |

Shared packages: `packages/shared`, `packages/worker-kit`.

Specs / agent tooling: `docs/`, `specs/`, `.specify/`, `.agents/skills/` (e.g. Ralph). Legacy/extra trees may still exist (`exam-crawler`, `question-generator`, `question-updater`) — prefer the planes above.

## Stack

- TypeScript/Node, Prisma, React
- Postgres/pgvector (Study + Discovery + Content) + Redis + MinIO
- LLM via `worker-kit`: Gemini `gemini-3.1-flash-lite` owns generation + embeddings; JEV (TypeSafe `jev-1.13.0`) owns closed Choice/Score decisions under `JEV_*_MODE` (default `active` with key; `shadow` = staging only). Both are direct. See [docs/llm-ownership.md](./docs/llm-ownership.md).

## Local

```bash
cp .env.sample .env
# Configure DATABASE_* in .env for an explicitly selected local database.
# The sample's tunnel placeholders require replacement before startup.
docker compose up --build
```

**DB switch:** one `.env` — configure `DATABASE_*` hosts for your development target; do not reuse the Argus Supabase helper. Redis/MinIO hosts likewise. Study is Postgres (not MySQL).

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

Pre-deploy gates are defined in `.github/workflows/deploy.yml`; content-worker typecheck and all listed test steps fail closed before image builds.

## Conventions

- **No content seed.** Bank fills only via Ingestion → Content → Eval. `SEED_DEMO` / platform seed are users only.
- Only Eval-approved items reach Study Sampling.
- Internal service keys: scoped `INTERNAL_API_KEY_*` — never ship defaults in production.
- Align LLM calls with [docs/guardrails.md](./docs/guardrails.md) (Promptdesk-compatible contracts).
- **Crawler redesign**: [`docs/crawler-redesign-spec.md`](./docs/crawler-redesign-spec.md) is the canonical source of truth. [`specs/001-crawler-redesign/spec.md`](./specs/001-crawler-redesign/spec.md) exists only for Ralph compatibility. On any disagreement, **`docs/crawler-redesign-spec.md` wins**.
- Ralph autonomy is governed by `.specify/memory/constitution.md` when that skill/flow is active — do not apply unattended-commit rules to ordinary chat work unless asked.
