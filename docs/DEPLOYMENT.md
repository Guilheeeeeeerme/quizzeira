# Quizzeira — deployment

Quizzeira is split across three places: **Supabase Free** for Postgres,
**Cloudflare** for the static web app, DNS proxy and the edge watchdog, and the
**Hostinger VPS** for every API and worker. The build/deploy machinery lives in
the private **infra** repo; this page explains what happens when you push.

## What runs where

| Place | What |
| --- | --- |
| GitHub Actions (`infra` repo) | `Deploy app`, `Migrate app`, `Quizzeira edge` workflows |
| GHCR | `ghcr.io/guilheeeeeeerme/quizzeira/{api,discoveryapi,contentapi,discoverycrawler,contentworker,contentquality,quizcorrector,docprocessor,app}:<appSha>.<infraSha>` |
| VPS — Compose project `quizzeira` | `api` (Study, loopback `13200`), `discoveryapi` (`13201`, private), `contentapi` (`13202`, private), `discoverycrawler` (Playwright), `contentworker`, `contentquality`, `quizcorrector`, `docprocessor` (`3030` internal), `app` (nginx fallback, `18280`) |
| VPS — shared `infra_data` | Redis DB `/2`, MinIO bucket `quizzeira` (`artifacts/` raw bytes, `normalized/` extracted text, `briefs/`; lifecycle backstop 30d/never/365d set by infra `shared_ensure.py`) |
| Supabase Free (`zgoscslzyizwnzqoyqul`, eu-west-1) | Postgres schemas `quizzeira_study`, `quizzeira_discovery`, `quizzeira_content` (pgvector), role `quizzeira`, reached over the IPv6 direct host |
| Cloudflare Pages `quizzeira-web` | `apps/web` static build → `app.quizzeira.ferredemo.dev` |
| Cloudflare DNS (proxied) | `api.quizzeira.ferredemo.dev` → VPS nginx (Let's Encrypt origin) |
| Cloudflare Workers | `quizzeira-edge-watchdog` (cron `*/5`, KV `WATCH_STATE`) |
| LLM | Workers call Gemini/OpenAI directly (`LLM_USE_HEADROOM=false`); Headroom is not used |

**File triage & retention.** `contentworker` runs a `triage` pass every
`CONTENT_TRIAGE_INTERVAL_SEC` (default 6h): re-tries the LLM classifier on files
still `unknown`/low-confidence (max 3, then they wait for a human in
`/admin/exams` → *Files* → *Needs label*), prunes clearly useless files
(administrative, terminal failures, knowledge with no usable chunks — bytes and
sections deleted, stub row kept as `pruned:<reason>`), and deletes raw bytes of
any terminal document after `CONTENT_RETENTION_GRACE_DAYS` (default 7). A
reprocess after purge re-fetches `sourceUrl`. `CONTENT_WORKER_PROFILE=maintenance`
runs only this pass if it should live in its own container.

Secrets: `/opt/infra/secrets/quizzeira.env` on the VPS, sourced from `infra/secrets/production.enc.yaml` (SOPS).
Worker secrets (`WATCH_TARGETS`, `ALERT_WEBHOOK`) are set with `wrangler secret put`.

## Step by step: push → production

1. Push to `main`. `.github/workflows/deploy-infra.yml` sends `repository_dispatch`
   (`project=quizzeira`, this repo, the commit SHA) to `infra` using secret `INFRA_DISPATCH_TOKEN`.
   (`pipeline-v2.yml` gates still run here on PRs/pushes.)
2. `infra` → **Deploy app**:
   1. `resolve`: SHA must be the current head of `main` (older pushes are skipped).
   2. `build` (GitHub runner): `scripts/app_test.sh quizzeira` runs `npm ci`,
      `test:shared`, `test:i18n`; `build.sh` builds the shared deps base and every
      service image from `infra/containers/quizzeira/*` and pushes to GHCR.
   3. `deploy` (VPS over SSH): `deploy.sh quizzeira <release> deploy` — pulls the
      images, **checks `prisma migrate status` in `api`, `discoveryapi` and `contentapi`
      (fails closed if pending)**, `docker compose up -d --wait`, smoke (`api`,
      `discovery-api`, `content-api` `/health`), promotes the release. Failure restores
      the previous release automatically.
   4. Dispatches **Quizzeira edge**: builds `apps/web` with
      `VITE_API_ORIGIN=https://api.quizzeira.ferredemo.dev`, adds SPA `_redirects`,
      `wrangler pages deploy` to project `quizzeira-web`; then `wrangler deploy` in
      `edge/edge-watchdog` (after its `npm test`).
3. Nothing else restarts: Argus and PromptDesk are separate Compose projects.

Manual triggers: `infra` → Actions → **Deploy app** (`project=quizzeira`, optional `sha`)
and **Quizzeira edge** (optional `sha`).

## Step by step: schema change (Prisma, three schemas)

1. Add the migration under `apps/api/prisma`, `apps/discovery-api/prisma` or
   `apps/content-api/prisma` and push.
2. In `infra`, run **Deploy app** with `migrate=true` (or **Migrate app** then **Deploy app**).
   On the VPS this runs `docker compose run --rm <service> npx prisma migrate deploy` for
   `api`, `discoveryapi` and `contentapi` against Supabase, then `npm run db:seed:platform`.
   `seed_demo=true` adds `db:seed:demo`.
3. A plain deploy never migrates. `discovery-api` and `content-api` images **no longer run
   `prisma migrate deploy` on start**.

## Rollback

`infra` → **Deploy app** with the previous `sha` (VPS side), then **Quizzeira edge** with
the same `sha` (Pages/Worker). On the VPS only:
`bash /opt/infra/repository/scripts/deploy.sh quizzeira <previous release> rollback`.

## Local

```bash
cp .env.sample .env.local.docker && docker compose --env-file .env.local.docker up
```

Optional prod-like data: `bash ../infra/scripts/supabase_dev_tunnel.sh -f` then
`python3 ../infra/scripts/write_local_supabase_env.py` writes `.env` pointing at
Supabase through `127.0.0.1:15432`.

Full infra view: `infra/docs/DEPLOYMENT.md`; Cloudflare setup: `infra/docs/quizzeira-cloudflare.md`;
Supabase topology: `infra/docs/supabase.md`.
