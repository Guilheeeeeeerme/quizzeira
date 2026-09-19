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

## Next (pick topmost unfinished)

1. [ ] **prod readiness gate (§9)** — provider-dependent workers must fail readiness when no configured provider passes a capability probe; APIs and deterministic workers stay healthy. Add `circuitHealth`/`hasLlmProvider`-based readiness check to worker startup + admin health endpoint. Files: `packages/worker-kit` (new `readiness.ts` or extend `circuit.ts`), `apps/content-worker/src/index.ts`, `apps/content-quality`.
2. [ ] **durable job lease layer** — generic typed Postgres job table per plane (fields per §5: kind, dedupeKey, status queued/leased/deferred/done/dead, leaseOwner/leaseExpiresAt, attempts, lastErrorCode, correlation/causation). Workers claim via `FOR UPDATE SKIP LOCKED`; add to content-api first, then discovery-api. Contentworker passes convert to claims.
3. [ ] **weighted fair scheduling** (§9): one exam/provider/poison job can't consume the queue; queue depth/age into `StageMetric`.
4. [ ] **backfill wiring**: add `/internal/canonical/backfill` invocation to a migration-ish script or admin-triggered CI step; dual-read parity assertion before switching fully.
5. [ ] **shadow metrics report**: after running compose with `shadow` profile, compare per-stage `StageMetric` of split vs monolith, then flip default profile (§12 slice 2 exit).
6. [ ] **scouting autonomous enablement** (§12 slice 4 exit): compare observe-only decisions vs admin review for a full cycle → then set `DISCOVERY_SCOUT_AUTO_ACTIVATE=true` in infra prod only with the wave-2 backoff bands (1d/3d/7d/30d probes; source suspend; blocklist expiry).
7. [ ] **canary (§12 verification)**: one topic, one exam, concurrency 1; acceptance per spec §14 (24 h stable memory, no overlap, correct backoff, full log correlation, bounded provider calls, one published/rejected outcome).
8. [ ] **dashboard + alerts wiring (§10.3)**: Grafana overview + per-correlation drill-down; alerts listed in runbook table; AI Gateway account config (payload logging disabled); workers-AI golden-set benchmark only if someone opts in to that adapter.
9. [ ] **Edge watchdog deploy**: take `wrangler.toml` out of `replace-me` KV id, set secrets, add synthetic public-health failure fixture for the "one state-change alert" acceptance criterion.
10. [ ] **PR graduation**: when canary exits clean, drop draft → ready for review; then land and deploy per infra repo (not this repo).

## Working conventions

- Query first, never edit blind; smallest diff.
- Commit message format: `feat(scope): what (§12 slice N)` like prior commits.
- Push from `/home/ferre/Code/quizzeira` on branch `feat/autonomous-discovery-question-quality`; PR title/body already set.
- Typecheck after each slice: `npm run typecheck`. Full Nx tests only when change spans planes.
- **UPDATE `next` marker after every completed step** — append the next goal line.
