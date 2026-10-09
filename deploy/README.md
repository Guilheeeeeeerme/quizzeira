# Quizzeira @ Dokploy — deploy notes (operator runbook)

Production target per `infra/docs/plans/2026-10-07-dokploy-rebuild.md`: CI builds
images and pushes them to GHCR, Dokploy runs the stack from `deploy/compose.prod.yml`.
The local dev compose (`docker-compose.yml`) is untouched and is NOT this stack.

## File map

| File | Purpose |
| --- | --- |
| `deploy/compose.prod.yml` | Dokploy stack (redis, one-shot `migrate`, `api`, `quiz-corrector`, `discovery-api`, `content-api` core; profiles `content`, `discovery`, `social`, `migrate`). Content profile includes `content-freshness`; discovery profile includes source-scout + portal-monitor. |
| `deploy/compose.smoke.yml` | CI-runner-only override (local pgvector postgres + hosted api port) |
| `deploy/docker/*.Dockerfile` | 8 self-contained images, per-service ports (see below) |
| `deploy/migrate.sh` | three-schema `prisma migrate deploy` + users-only platform seed |
| `deploy/env.production.example` | env surface, names only — paste real values in the panel |
| `deploy/tiers/{16gb,8gb}.env` | memory-limit env per VPS tier |

## Architecture decisions

- **Private plane.** `discovery-api` (3010), `content-api` (3020) and every
  worker live only on the `quizzeira-internal` bridge (`internal: true`). No
  Traefik routers, no host ports — matching `infra/projects.json`
  (`private_routes`). Only the study `api` (3000) is routed:
  `api.concurseria.ferredemo.dev` with the
  `security-headers@file,compress@file` middlewares and an
  `internal` highest-priority router that 404s `/internal/*` at the edge
  (`noop@internal`), while inside the mesh workers keep calling
  `http://api:3000/internal/...`.
- **`migrate` gate.** Every long-running service `depends_on: migrate`
  (`service_completed_successfully`) — a compose-valid pattern: profiled
  dependencies are fine when the `migrate` profile is enabled. Keep the
  `migrate` profile enabled in Dokploy permanently so every deploy recreates it
  and re-runs migrations; they are idempotent (`migrate deploy`). For a
  rollback: set `SKIP_MIGRATIONS=1` in the stack env → the script exits 0 and
  acts as a no-op gate.
- **doc-processor sits in the `content` profile.** Only `content-worker`'s
  documents/extraction pass calls `DOC_PROCESSOR_URL` (verified: no
  `DOC_PROCESSOR_URL`/doc-processor reference in `apps/quiz-corrector`).
  `quiz-corrector` grades via the study api + LLM only.
- **Images** (GHCR `ghcr.io/guilheeeeeeerme/quizzeira/<name>`): `api`,
  `discoveryapi`, `discoverylifecycle`, `discoverycrawler`,
  `discoverysourcescout`, `discoveryportalmonitor`, `discoverysocial`,
  `contentapi`, `contentworker`, `contentquality`, `contentfreshness`,
  `docprocessor`, `quizcorrector` — built by `.github/workflows/deploy.yml`.
  Tags: immutable `<sha>` + moving `production`, `pull_policy: always`.
  See `docs/self-sustaining-discovery.md`. LLM workers use
  `deploy/docker/worker.Dockerfile` (`ARG APP`) and run via `tsx` (no Prisma
  client — HTTP to plane APIs only).
- **Crawler** keeps `mcr.microsoft.com/playwright:v1.50.1-jammy` (matches the
  pinned `playwright@1.50.1` dep), runs as `pwuser`, and the compose service
  sets `shm_size: 1gb` (Chromium /dev/shm).
- **Ports** at runtime: api 3000 (Traefik), discovery-api 3010, content-api
  3020, lifecycle 3012, source-scout 3014, portal-monitor 3015, social 3013,
  freshness 3024, doc-processor 3030, redis 6379. `/health` and `/version`
  (returns `{service, gitsha}`) exist on the three APIs.

## Panel steps (Dokploy, generic Git source)

1. **Stack creation.** New project → Compose → General → Generic Git:
   - repo `Guilheeeeeeerme/quizzeira`, branch **`production`** (a read-only
     GitHub deploy key added in the Dokploy SSH-keys panel),
   - compose path `deploy/compose.prod.yml`.
   CI pushes `<sha>` + `production` tags to GHCR and updates `production`-tagged
   images; the webhook (below) triggers the pull.
2. **GHCR pull credential.** Add the `read:packages` PAT as the stack registry
   credential (Dokploy → Registries) so the VPS can pull private images.
3. **Env.** Paste every variable from `deploy/env.production.example` with real
   values, then paste `deploy/tiers/<tier>.env` after it if your VPS RAM is below 32 GB.
   Rules:
   - no real secrets in git — the panel holds the only copies; keep a
     password-manager copy;
   - `SKIP_MIGRATIONS=1` only on rollback deploys;
   - **`LLM_USE_HEADROOM=false`** and direct Gemini + JEV base URLs for quizzeira
     workers (quiz-corrector, content-worker, content-quality) — hard rule from
     `AGENTS.md` / `infra/docs/quizzeira-headroom.md`. Do not point them at
     Headroom (Argus-only). Set `S3_BUCKET=quizzeira-objects`.
   - DB target: discovery on Supabase `ferredemo`; content + study → VPS Postgres
     (pgvector) when that cutover lands — not “three schemas forever on one Free project”.
4. **Profiles.** Dokploy → this stack → Services/Profiles: enable `migrate`
   (keep enabled), and enable `content` / `discovery` / `social` when their
   budget exists (see Secret-free sizing below). A profile's service only runs
   when enabled, no restart of unrelated services (deployment isolation).
5. **DNS + Traefik.** `api.concurseria.ferredemo.dev` = DNS-only A record to the
   VPS (Cloudflare Free can't issue TS certs for two-level names). Traefik
   issues Let's Encrypt; the SPA lives on Cloudflare Pages (`quizzeira-app`).
6. **Webhook.** Copy the stack's deploy webhook URL → GitHub repo secret
   `DOKPLOY_DEPLOY_HOOK_URL`. `Deploy quizzeira` fires it after tests, build
   matrix and the runner smoke pass; then polls `/version` until `gitsha`
   matches the released SHA.
7. **Secrets to add in GitHub** (+ variables): `DOKPLOY_DEPLOY_HOOK_URL`,
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Rollback

Dispatch `Deploy quizzeira` with `sha` = previous good commit and
`skip_migrations` = true; set `SKIP_MIGRATIONS=1` in the panel first.

## Smoke checklist (after every release)

1. `GET https://api.concurseria.ferredemo.dev/health` → 200.
2. `GET /version` → `gitsha` equals the deployed commit.
3. Login flow against the Pages SPA (cookies on `.ferredemo.dev`).
4. `GET https://.../internal/...` from outside → **404** (edge noop router).
5. R2 object roundtrip: upload via admin → fetch back (S3_* env →
   `https://<account>.r2.cloudflarestorage.com`, bucket `quizzeira`, forced path style).
6. Edge watchdog: the `quizzeira-edge-watchdog` Worker still pings `/health`
   targets every 5 min from Workers KV state — expect no state-change alerts
   within 15 min of the deploy.

## R2 / storage notes

- MinIO on the VPS is gone (its image is archived/CVE-pinned); objects move to
  **Cloudflare R2** via the S3 API. Keys are app-scoped, one bucket
  (`quizzeira`), `S3_FORCE_PATH_STYLE=true`, `S3_REGION=auto`.
- R2 free tier is ample for this workload; Supabase Free (500 MB/project) is
  the real cap. The study DB stays modest, but the **content bank may outgrow
  500 MB** — at that point the honest options are pruning raw discovery
  artifacts, splitting content into its own project (still free, 2-project
  cap) — or moving to a VPS Postgres. **No Supabase Pro upgrade without budget
  approval** (repo hard rule). No backups on Supabase Free → the weekly
  `pg_dump`-to-R2 task in the infra runbook is mandatory, and keep an R2
  lifecycle check on object size.
- Quizzeira never joins shared platform services: this stack owns its own Redis
  (`password + noeviction`) and its own schemas
  (`quizzeira_study` / `quizzeira_discovery` / `quizzeira_content`).

## What this repo does NOT own anymore

- VPS build/deploy logic (`deploy.sh`), MinIO, build args, APP_REPO_TOKEN /
  SOPS — deleted paths; keep it that way.
- Cross-app tokens: no INFRA_DISPATCH_TOKEN, no repo-to-repo workflow calls.
  One workflow touches only this app.
