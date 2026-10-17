# AGENTS.md — Quizzeira

Coding-agent rules for this repository.

| Reference | Doc |
| --- | --- |
| Project map | [CLAUDE.md](./CLAUDE.md) · [README.md](./README.md) |
| Concepts | [docs/ai-swe-concepts.md](./docs/ai-swe-concepts.md) |
| LLM ownership (Gemini+JEV) | [docs/llm-ownership.md](./docs/llm-ownership.md) |
| Gemini+JEV routing (canonical) | infra [docs/intelligence-routing.md](../infra/docs/intelligence-routing.md) · local [docs/intelligence-routing.md](./docs/intelligence-routing.md) |
| Guardrails | [docs/guardrails.md](./docs/guardrails.md) |
| Crawler spec (canonical) | [docs/crawler-redesign-spec.md](./docs/crawler-redesign-spec.md) |

## Scope

- Work inside this monorepo (`apps/`, `packages/`, `docs/`, `specs/`).
- Production Compose and GitHub Actions workflows live in **infra** — GHA + GHCR is the sole supported production control plane (do not use Jenkins; VPS Jenkins removal is CONFIRM-gated in infra after GHA is proven). Do not invent a parallel prod deploy path here.
- Cloudflare Pages (`quizzeira-web`) and Worker (`quizzeira-edge-watchdog`) deploy only via infra **Quizzeira edge**; this repo’s `.github/workflows/deploy-infra.yml` dispatches VPS deploy — do not add a competing Pages/Worker workflow here.
- Prefer targeted changes. Do not run the full `npm test` matrix unless asked or the change spans planes.

## Hard rules

| Rule | Detail |
| --- | --- |
| **No question-bank seed** | No fixtures faking published curriculum; ingestion + Eval only. |
| **Publish gate** | Study Sampling may use Eval-approved items only. |
| **Planes separate** | Discovery / Content / Study use distinct VPS Postgres schemas. No Supabase for Quizzeira. |
| **Study is Postgres** | `quizzeira_study`; do not reintroduce MySQL. |
| **LLM** | Workers `LLM_USE_HEADROOM=false`. Gemini `gemini-3.1-flash-lite` for generation/embeddings; JEV `jev-1.13.0` for closed decisions (`JEV_*_MODE=active` when key present). Never share JEV key across stacks. See [docs/llm-ownership.md](./docs/llm-ownership.md). |
| **Keys** | Scoped `INTERNAL_API_KEY_*`; never commit real secrets or default internal keys for prod. |
| **Env** | `.env.sample` → `.env`; never commit `.env`. |
| **Crawler spec** | [docs/crawler-redesign-spec.md](./docs/crawler-redesign-spec.md) wins over `specs/001-crawler-redesign/spec.md` on any disagreement. |
| **Ralph** | Autonomous rules in `.specify/memory/constitution.md` apply only when that flow is invoked. |

## MCP and plugin access

Use existing connections before installing replacements. Verify access with a narrow read before acting.

| Integration | Purpose |
| --- | --- |
| GitHub plugin | `Guilheeeeeeerme/quizzeira` + sibling `infra`. Production: infra `Deploy app`/`Migrate app`/`Quizzeira edge` workflows + GHCR. |
| Cloudflare MCP | Pages `quizzeira-web`, Worker `quizzeira-edge-watchdog`, proxied DNS. |
| Supabase plugin | Project `zgoscslzyizwnzqoyqul`; preserve schema ownership. |
| Hostinger MCP | Domains/DNS/web hosting; does not grant VPS access. Verify authoritative DNS source before changes. |
| Ops plane (infra) | ChrisLOG / Uptime Kuma / Beszel / Flipt — [observability](./docs/observability.md), infra [OPS.md](../infra/docs/OPS.md). |

Connection setup does not authorize deployments, DB writes, DNS changes, purchases, or plan upgrades. Keep tokens/credentials out of tracked files.

Runbooks: [deployment](./docs/DEPLOYMENT.md) · [infra rules](../infra/AGENTS.md) · [Cloudflare](../infra/docs/quizzeira-cloudflare.md) · [observability](./docs/observability.md).

## Verification

```bash
npm run typecheck
# or focused tests for touched packages:
npm run test:shared && npm run test:i18n
```

## Communication

User-facing text in English.
