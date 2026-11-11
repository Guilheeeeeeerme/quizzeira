# Quizzeira — deployment

Quizzeira is split across three places: **VPS Postgres** for the three database schemas,
**Cloudflare** for the static web app, DNS proxy and the edge watchdog, and the
**Hostinger VPS** for every API and worker. The build/deploy machinery lives in
this repository's `.github/workflows` and `deploy/` directories; this page explains what happens when you push.

## What runs where

| Place | What |
| --- | --- |
| GitHub Actions (this repo) | `Deploy quizzeira`, `Pages + edge`, `Pipeline v2 gates` |
| GHCR | `ghcr.io/guilheeeeeeerme/quizzeira/<service>:<sha>` and `:production` |
| VPS — Dokploy Compose stack | Study API (3000 via Traefik), private Discovery API (3010), Content API (3020), workers and doc-processor (3030 internal); `deploy/compose.prod.yml` |
| App-owned Redis + Cloudflare R2 | Redis for this stack; S3-compatible R2 object storage |
| Hostinger VPS Postgres (`postgres-quizzeira`) | Schemas `quizzeira_study`, `quizzeira_discovery`, `quizzeira_content` (pgvector), role `quizzeira` (Supabase is Argus-only) |
| Cloudflare Pages `quizzeira-web` | `apps/web` static build → `app.concurseria.ferredemo.dev` |
| Public API DNS | `api.concurseria.ferredemo.dev` → VPS Traefik |
| Cloudflare Workers | `quizzeira-edge-watchdog` (cron `*/5`, KV `WATCH_STATE`) — deploy via this repo's **Pages + edge** workflow |
| LLM | Workers call Gemini (generation + embeddings) and TypeSafe JEV (typed decisions, `JEV_*_MODE`, default `active` with key) directly — see [llm-ownership.md](./llm-ownership.md) |

**File triage & retention.** `contentworker` runs a `triage` pass every
`CONTENT_TRIAGE_INTERVAL_SEC` (default 6h): re-tries the LLM classifier on files
still `unknown`/low-confidence (max 3, then they wait for a human in
`/admin/exams` → *Files* → *Needs label*), prunes clearly useless files
(administrative, terminal failures, knowledge with no usable chunks — bytes and
sections deleted, stub row kept as `pruned:<reason>`), and deletes raw bytes of
any terminal document after `CONTENT_RETENTION_GRACE_DAYS` (default 7). A
reprocess after purge re-fetches `sourceUrl`. `CONTENT_WORKER_PROFILE=maintenance`
runs only this pass if it should live in its own container.

Secrets: Dokploy stack environment plus GitHub repository secrets; keep an operator backup outside git.
Worker secrets (`WATCH_TARGETS`, `ALERT_WEBHOOK`) are set with `wrangler secret put`.

## Step by step: push → production

1. Push to `main`. This repo's `.github/workflows/deploy.yml` runs **Deploy quizzeira**.
2. Unit tests and the content-worker typecheck must pass before the GHCR image matrix builds. Images use immutable `<sha>` and moving `production` tags.
3. Runner smoke starts Redis, a temporary Postgres database, migrations and the Study API; it checks `/health` and `/version`.
4. The deploy job advances this repo's `production` branch, calls the Dokploy webhook and polls the public API `/version` for the released SHA.
5. Independently, `.github/workflows/pages.yml` builds/publishes the web app to Cloudflare Pages and typechecks/deploys the watchdog Worker. This workflow does not wait for the API deployment.

Manual triggers: this repo → Actions → **Deploy quizzeira** (optional `sha`) and **Pages + edge**. The separate **Pipeline v2 gates** workflow provides wider validation; it is not a dependency of the deploy workflow.

A public `/health` response proves HTTP availability only. Verify `/version` and the individual worker/container status after a release; an API SHA alone does not prove every worker uses that release.

## Schema changes (Prisma, three schemas)

Add migrations under `apps/api/prisma`, `apps/discovery-api/prisma` or `apps/content-api/prisma`. Keep the Dokploy `migrate` profile enabled: `deploy/migrate.sh` runs `prisma migrate deploy` for all three schemas and the users-only platform seed before dependent services start. Configure database URLs in the Dokploy stack, not in tracked files. See [deploy/README.md](../deploy/README.md).

## Rollback

Set `SKIP_MIGRATIONS=1` in the Dokploy stack before a schema-compatible rollback, then dispatch **Deploy quizzeira** with the previous good `sha` and `skip_migrations=true`. The workflow input prints an operator reminder; it does not change the stack environment. Reset the stack setting after rollback. To restore the web/Worker code, run **Pages + edge** from the desired repository ref.

## Local

```bash
cp .env.sample .env
# Configure DATABASE_* for your development target; replace sample placeholders.
docker compose up --build
```

Single `.env`: configure `DATABASE_*` for your development target. The sample tunnel placeholders require replacement; do not use the Argus Supabase helper. Redis/MinIO default to development Compose. Production uses VPS Postgres and R2. Operator details: [deploy/README.md](../deploy/README.md); shared host operations: sibling infra repo.