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
| Study | `api`, `web`, `quiz-corrector` | MySQL + Redis |

Brand mark: [`branding/quizzeira.svg`](branding/quizzeira.svg) — exam card + Eval check gate.

## Quick start

```bash
cp .env.sample .env
docker compose up --build
```

User seed only (no question-bank seed):

```bash
npm run db:seed -w @quizzeira/api
```

## Deeper docs

- Agent map: [`CLAUDE.md`](CLAUDE.md) · [`AGENTS.md`](AGENTS.md)
- Crawler SoT: [`docs/crawler-redesign-spec.md`](docs/crawler-redesign-spec.md)
- Production deploy: private **infra** repo (Jenkins)
