# START_HERE.md — autonomous pipeline implementation tracker

**Purpose:** any agent opening this repo resumes from the "Next" line at the bottom. Do not redo completed work; verify it and move on.

**Canonical spec:** `docs/superpowers/specs/2026-09-19-autonomous-discovery-question-quality-design.md`
**Runbook:** `docs/quizzeira-pipeline-runbook.md`
**Draft PR:** https://github.com/Guilheeeeeeerme/quizzeira/pull/28 (branch `feat/autonomous-discovery-question-quality`)
**Rule:** one commit per checkpoint (§12 rollout slices). User-facing text in English. No question-bank seeds, no cross-plane DB wiring, no unattended autonomy defaults.

## Done (committed, verify before touching)

| Slice | Commit (PR branch) | What | Verify |
| --- | --- | --- | --- |
| 1 | `6d8df99` | worker-kit safety foundation: single-flight `runLoop` (overlap logged, never stacked), provider circuit breaker (`circuit.ts`, auth/billing → open 6 h, transient → backoff, 1 half-open probe), atomic non-incrementing budget reserve (Lua), auth/billing non-deferrable, log severity/version/env, pipeline-output tx timeout 120 s | `npm test -w @quizzeira/worker-kit` (70/71; 1 pre-existing fixture env fail) |
| 2 | `d23566f` | `CONTENT_WORKER_PROFILE=all\|documents\|embeddings\|generation` one-image entrypoints; compose `shadow` profile services (`content-worker-documents/-embeddings/-generation`) | `docker compose config -q` |
| 3 | `5ab42bb` | `CanonicalTopic`/`SyllabusTopicMap`/`QuestionApplicability` + additive migration `20260919000000_canonical_bank`; idempotent `/internal/canonical/backfill`; `/published/sample` dual-read via active applicability | `npm run typecheck` |
| 4 | `5e8769f` | `SourceCandidate` + migration; deterministic `scoreCandidate`/`hardDeny` (scouting.spec 5/5); `/internal/scout/candidates` observe-only (`DISCOVERY_SCOUT_AUTO_ACTIVATE` gates activation) | `cd apps/discovery-api && npx tsx --test src/lib/scouting.spec.ts` |
| 5 | `53250eb` | judge deferral w/ exponential backoff (`deferredJudge` map + `pending-review?excludeIds=`), `/internal/question-items/quarantine` (revokes applicability, never rewrites content), sampling honours `validThrough` | `npm run test:quality` (green) + typecheck |
| 6 | `84f0064` | `edge/edge-watchdog`: Workers Free cron `*/5`, KV state, metadata-only serial probes, state-change-only webhook alerts, local type shims, `tsc --noEmit` clean | `cd edge/edge-watchdog && npx tsc --noEmit -p tsconfig.json` |
| 7 | `d3d1d3b` | `cf-aig-collect-log-payload: false` on Gemini+OpenAI calls; `docs/quizzeira-pipeline-runbook.md` | grep for header string |
| 8 | `2d2602a` | prod readiness gate (§9): `checkProviderReadiness()` in worker-kit (`readiness.ts` + `configuredProviderNames()`); startup readiness log in content-worker (generation pass only), content-quality, quiz-corrector; `providerReadiness` surfaced on content-api `/admin/health` (same Redis circuit state) | worker-kit/content-worker/content-quality/quiz-corrector `tsc --noEmit` clean; `npm run test:quality` 107/107; content-api test 3/3 |
| 9 | `299bed5` | durable job lease layer, content-api half (§5, item 1a): generic `Job` table + additive migration `20260919010000_job_lease` (kind/dedupeKey/status queued\|leased\|deferred\|done\|dead/priority/availableAt/leaseOwner+leaseExpiresAt/attempts+maxAttempts/lastErrorCode+lastError/correlation+causation); `src/lib/jobs.ts` (`enqueueJob` idempotent-by-dedupeKey, `claimJobs` via `FOR UPDATE SKIP LOCKED` reclaiming expired leases, `completeJob`/`deferJob`/`failJob` with `computeBackoffMs` exponential-full-jitter → `dead` on `maxAttempts`); `/internal/jobs/{enqueue,claim,:id/complete,:id/defer,:id/fail,dead}` routes (workers still only ever reach content-api over HTTP, per §3.2). Content-worker passes are **not yet** converted to claim from this table — still direct entity polling. | `cd apps/content-api && node --import tsx --test src/lib/jobs.spec.ts` (6/6); `npm run test:content` 157/161 (4 pre-existing failures, see below); schema validated + migration DDL diffed byte-for-byte against `prisma migrate diff --from-empty` (see gotcha below re: generated-client typecheck) |
| 10 | `d97b110` | durable job lease layer, discovery-api half (§5, item 1a done): identical `Job` model/migration/`jobs.ts`/routes in discovery-api's own `quizzeira_discovery` database — no table sharing across planes. discovery-crawler still polls entity status directly; only item 1b (content-worker claim wiring) remains open under item 1. | `cd apps/discovery-api && node --import tsx --test "src/**/*.spec.ts"` (11/11: 6 new job-lease + 5 pre-existing scouting); migration DDL diffed byte-for-byte against `prisma migrate diff --from-empty` |

Repo note: worktree commits were cherry-picked into `/home/ferre/Code/quizzeira` (origin).
Worktree at `/home/ferre/Code/.codex-worktrees/quizzeira-autonomy` contains the originals (`codex/quizzeira-autonomy`) — future work should be committed on the PR branch in the main checkout to avoid re-sync.
Conclusion: work on the branch in `/home/ferre/Code/quizzeira` from now on; push to PR branch there so the draft PR accumulates commits correctly.

## Retry-against-baseline test instructions

`apps/content-worker` tests hang unless you disable the host REDIS_URL; always run with:
```bash
cd apps/content-worker && REDIS_URL= LLM_PROVIDER=fixture npx tsx --test "src/**/*.spec.ts"
```
Pre-existing failures (identical on baseline, pre-change) — do not investigate as regressions:
- 4 content-worker golden/role-classification failures (`EDT-002`, `KNW-002`, fuzz §41.6, edital-estadual-tce leaf coverage)
- 1 worker-kit `fixture LLM provider > yields a draftable MCQ` (unreachable `redis://redis:6379` from `.env` in test env)

**Environment gotcha (this host, 2026-09-19):** `packages/shared/dist/`, `apps/discovery-api/src/generated/prisma/`, and `apps/content-api/src/generated/prisma/` had root-owned files (leftover from a `docker compose` build run as root), blocking `npm run typecheck` / `npm run db:generate` with `EACCES`. Removing `packages/shared/dist` worked (plain user owned the dir); the two `generated/prisma` dirs are root-owned themselves and need `sudo chown -R $USER` before `db:generate` will work — user was asked again on 2026-09-19 (slice 9) and again declined, so it's still unfixed. Until fixed, verify changed packages in isolation: `cd <pkg> && npx tsc --noEmit -p tsconfig.json`. The 173 content-api and ~60 discovery-api repo-wide typecheck errors you'll see are this stale-client issue, not real regressions — confirmed via `git stash` against baseline.

**Workaround that does work without touching the root-owned dir (used for slice 9):** point a copy of `prisma/schema.prisma` at a sibling output dir outside `src/generated/` (e.g. `output = "../prisma-check-client"`, schema file kept inside `prisma/` so project-root inference still works), `prisma generate --schema prisma/schema.check.prisma`, then `tsc --noEmit` a scratch copy of the new file against that fresh client. Delete both scratch artifacts afterward — never commit them. Also usable standalone: `prisma validate` / `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` need real-looking (but fake) `*_DATABASE_URL`/`*_DATABASE_DIRECT_URL` env values inline — they don't hit a real DB, just parse the schema — and `migrate diff` is the fastest way to confirm a hand-written migration's DDL matches what Prisma would generate.

## Next (pick topmost unfinished)

1. [ ] **durable job lease layer — remaining sub-steps** (content-api + discovery-api `Job` tables + claim APIs landed as slices 9-10; see Done table):
   - [x] 1a. discovery-api job table — done, slice 10.
   - [ ] **1b. worker claim wiring** (the actual behavior change — slices 9/10 only added the table+API, nothing calls it yet): convert content-worker's `runImportPass`/`runProcessPass`/`runPlannerPass`/embedding/generation passes, and discovery-crawler's equivalent passes, from direct entity-status polling to `POST /internal/jobs/claim` + `complete`/`defer`/`fail`. One pass at a time, verify that pass's existing tests still pass before moving to the next, so a bad rollout is bisectable. Start with content-worker's `runImportPass` (apps/content-worker/src/stages/import.ts) as the smallest single pass.
   - [ ] **1c. dead-letter visibility**: `GET /internal/jobs/dead` exists (both planes, slices 9-10) but nothing surfaces it yet — wire into the §10.3 dashboard work (item 7) rather than building a one-off view now.
2. [ ] **weighted fair scheduling** (§9): one exam/provider/poison job can't consume the queue; queue depth/age into `StageMetric`.
3. [ ] **backfill wiring**: add `/internal/canonical/backfill` invocation to a migration-ish script or admin-triggered CI step; dual-read parity assertion before switching fully.
4. [ ] **shadow metrics report**: after running compose with `shadow` profile, compare per-stage `StageMetric` of split vs monolith, then flip default profile (§12 slice 2 exit).
5. [ ] **scouting autonomous enablement** (§12 slice 4 exit): compare observe-only decisions vs admin review for a full cycle → then set `DISCOVERY_SCOUT_AUTO_ACTIVATE=true` in infra prod only with the wave-2 backoff bands (1d/3d/7d/30d probes; source suspend; blocklist expiry).
6. [ ] **canary (§12 verification)**: one topic, one exam, concurrency 1; acceptance per spec §14 (24 h stable memory, no overlap, correct backoff, full log correlation, bounded provider calls, one published/rejected outcome).
7. [ ] **dashboard + alerts wiring (§10.3)**: Grafana overview + per-correlation drill-down; alerts listed in runbook table; AI Gateway account config (payload logging disabled); workers-AI golden-set benchmark only if someone opts in to that adapter.
8. [ ] **Edge watchdog deploy**: take `wrangler.toml` out of `replace-me` KV id, set secrets, add synthetic public-health failure fixture for the "one state-change alert" acceptance criterion.
9. [ ] **PR graduation**: when canary exits clean, drop draft → ready for review; then land and deploy per infra repo (not this repo).

## Working conventions

- Query first, never edit blind; smallest diff.
- Commit message format: `feat(scope): what (§12 slice N)` like prior commits.
- Push from `/home/ferre/Code/quizzeira` on branch `feat/autonomous-discovery-question-quality`; PR title/body already set.
- Typecheck after each slice: `npm run typecheck`. Full Nx tests only when change spans planes.
- **UPDATE `next` marker after every completed step** — append the next goal line.
