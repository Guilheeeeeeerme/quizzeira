<p align="center">
  <img src="branding/quizzeira.svg" alt="Quizzeira" width="72" height="72" />
</p>

# Quizzeira

Concurso-only study platform: continuous **Ingestion** of public exams → **Extraction/Generation** into a draft Question bank → **Eval** publish gate → **Sampling** into study pills. Grading via `quiz-corrector`.

## Live

| Application | URL |
| --- | --- |
| Web | https://app.quizzeira.ferredemo.dev |
| API | https://api.quizzeira.ferredemo.dev |

## Technical docs (GitHub Pages)

**https://guilheeeeeeerme.github.io/ferredemo-docs/** — shared ecosystem docs (`/en/quizzeira/…`). Hosted in dedicated repo [`ferredemo-docs`](https://github.com/Guilheeeeeeerme/ferredemo-docs).

## AI engineering (audit-honest)

| Capability | Status |
| --- | --- |
| Three planes (Discovery / Content / Study); workers use **runLoop** (not BullMQ) | **VERIFIED** |
| Intervals 60s study/quality/corrector, 120s content-worker, 30m crawler; Eval 0.8/0.5; BANK_READY≥5; MIN_KU/TARGET 4/12; PUBLISHED_TARGET 40 | **VERIFIED** |
| Headroom **OFF** (`LLM_USE_HEADROOM=false`); no question-bank seed | **VERIFIED** |
| Embeddings 768d | **VERIFIED** |
| `searchChunks` in generation / `googleSearch` | **UNUSED** |
| Full semantic RAG on gen path | **NOT FOUND** |
| `specs/001` / compose vs sample | **PARTIAL** — crawler SoT is `docs/crawler-redesign-spec.md` |

Guardrails: [`docs/guardrails.md`](docs/guardrails.md). Concepts: [`docs/ai-swe-concepts.md`](docs/ai-swe-concepts.md).

## Architecture snapshot

| Plane | Apps | Store |
| --- | --- | --- |
| Discovery | `discovery-api`, `discovery-crawler` | Postgres + MinIO |
| Content | `content-api`, `content-worker`, `content-quality` | Postgres + pgvector |
| Study | `api`, `web`, `quiz-corrector` | Postgres `quizzeira_study` + Redis |

Brand mark: [`branding/quizzeira.svg`](branding/quizzeira.svg) — exam card + Eval check gate.

## Quick start

```bash
# Single .env — hosts are the switch (primary: local apps → staging Supabase).
cp .env.sample .env
bash ../infra/scripts/supabase_dev_tunnel.sh -f   # 127.0.0.1:15432 via VPS
python3 ../infra/scripts/write_local_supabase_env.py  # DATABASE_* → host.docker.internal:15432
docker compose up --build
```

User seed only (no question-bank seed):

```bash
npm run db:seed -w @quizzeira/api
```

## Deeper docs

- Agent map: [`CLAUDE.md`](CLAUDE.md) · [`AGENTS.md`](AGENTS.md)
- Crawler SoT: [`docs/crawler-redesign-spec.md`](docs/crawler-redesign-spec.md)
- Production deploy: private **infra** repo (GitHub Actions → GHCR → VPS; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

## Deployment

Push to `main` → infra GitHub Actions builds to GHCR and deploys. Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
