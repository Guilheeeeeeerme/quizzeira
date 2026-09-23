# AGENTS.md — Quizzeira

Coding-agent rules for this repository. Project map: [CLAUDE.md](./CLAUDE.md), [README.md](./README.md). Concepts: [docs/ai-swe-concepts.md](./docs/ai-swe-concepts.md).

## Scope

- Work inside this monorepo (`apps/`, `packages/`, `docs/`, `specs/`).
- Production Compose and GitHub Actions workflows live in **infra** (Jenkins is decommissioned) — do not invent a parallel prod deploy path here.
- Prefer targeted changes. Do not run the full `npm test` matrix unless asked or the change spans planes.

## Hard rules

- **No question-bank seed.** Do not add fixtures that fake published curriculum; ingestion + Eval only.
- **Publish gate**: Study Sampling may use Eval-approved items only.
- **Planes stay separate**: Discovery / Content / Study use distinct Supabase schemas (and local DBs in dev) — do not collapse stores or cross-wire without an explicit migration task.
- **Study is Postgres** (`quizzeira_study`); do not reintroduce MySQL for Study without an explicit task.
- **LLM**: workers use `LLM_USE_HEADROOM=false` by design; do not point them at Headroom without fixing network/auth (see infra `docs/quizzeira-headroom.md`). Follow [docs/guardrails.md](./docs/guardrails.md).
- **Keys**: scoped `INTERNAL_API_KEY_*`; never commit real secrets or leave default internal keys for prod.
- **Env**: `.env.sample` → `.env`; never commit `.env`.
- **Crawler redesign source of truth**: [`docs/crawler-redesign-spec.md`](./docs/crawler-redesign-spec.md) is canonical. [`specs/001-crawler-redesign/spec.md`](./specs/001-crawler-redesign/spec.md) exists only for Ralph compatibility. If they disagree, **`docs/crawler-redesign-spec.md` wins**.
- **Ralph**: `.agents/skills/ralph-wiggum` and `.specify/memory/constitution.md` apply only when that autonomous flow is invoked — ordinary agent chats still ask before commits unless the user requested otherwise.

## MCP and plugin access

Use existing connections before installing replacements. Tool availability does not prove authentication: verify access with a narrow project read. Keep tokens, passwords, OAuth state, and private keys out of tracked files.

| Integration | Purpose and access path |
| --- | --- |
| GitHub plugin | Repository, PRs, and CI for `Guilheeeeeeerme/quizzeira` and sibling `infra`. Production uses infra's `Deploy app`, `Migrate app`, and `Quizzeira edge` workflows; GHCR stores images. |
| Cloudflare MCP | Existing `cloudflare-bindings`, `cloudflare-builds`, `cloudflare-observability`, and `cloudflare-docs` servers. Pages project `quizzeira-web`, Worker `quizzeira-edge-watchdog`, and proxied DNS. For DNS/Pages operations absent from these tools, use infra's scripts/Wrangler workflow. |
| Supabase plugin | Postgres project `zgoscslzyizwnzqoyqul`; preserve `quizzeira_study`, `quizzeira_discovery`, and `quizzeira_content` ownership. The plugin and separately configured Supabase MCP server are alternative access paths; do not add duplicates just because one is unavailable. |
| Hostinger MCP + infra | Existing tools cover domains, DNS, and web hosting; this does not establish VPS access. APIs/workers run on the Hostinger VPS via infra SSH/Compose tooling. Do not substitute shared hosting, WordPress, or MySQL. Verify authoritative DNS before choosing Hostinger or Cloudflare for record changes. |
| Grafana MCP | Existing `grafana` server provides dashboards and configured Loki/Prometheus datasource access for production diagnosis. Verify with a datasource/dashboard read. |

Connection check (2026-09-22): GitHub repository read, Supabase project listing (`ACTIVE_HEALTHY`), Cloudflare Worker listing, and Grafana datasource listing (Loki) succeeded. Hostinger DNS read for `ferredemo.dev` did not respond within a 20-second verification window; authentication and VPS access remain unverified. Recheck before Hostinger work; a timeout alone does not establish an authentication failure.

Task-dependent tools: Playwright/browser for UI verification, Context7 for library documentation, and Firecrawl for discovery research. Redis and MinIO use existing app/infra access, without new hosted plugins. Headroom/RTK/Serena usage follows active chat policy; production workers still use `LLM_USE_HEADROOM=false`.

Connections belong in local Codex plugin/MCP settings, not application `.env` or committed credentials. If a read fails, record the actual error and reconnect the existing provider account before installing replacements. Connection setup does not authorize production deployments, database writes, DNS changes, purchases, or plan upgrades.

Runbooks: [deployment](./docs/DEPLOYMENT.md), [infra rules](../infra/AGENTS.md), [Cloudflare](../infra/docs/quizzeira-cloudflare.md), [Supabase](../infra/docs/supabase.md), and [observability](./docs/observability.md).

## Verification

```bash
npm run typecheck
# or focused tests for touched packages:
npm run test:shared && npm run test:i18n
```

## Communication

User-facing text in English.
