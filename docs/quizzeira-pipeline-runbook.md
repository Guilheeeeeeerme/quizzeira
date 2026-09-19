# Quizzeira autonomous pipeline — operator runbook

Companion to `docs/superpowers/specs/2026-09-19-autonomous-discovery-question-quality-design.md`.
Alerts, severity, and first actions. All identifiers are metadata-only; no
secrets or payloads live in logs (worker-kit `log.ts` redacts them).

## Alert map

| Alert trigger | Signal source | First action |
| --- | --- | --- |
| No new exam/artifact beyond freshness SLO | Discovery `last_new_exam_at`, `StageMetric` | Check scout/crawler `CrawlRun` status; inspect broken sources count |
| Oldest runnable job beyond stage SLO | `StageMetric`, Loki job events | Look for deferred-with-backoff loops (judge provider outage is expected to defer, not stall) |
| Provider circuit open / credential failure | `circuit_opened` / `circuit_closed` log events | ADC rotation of `GEMINI_API_KEY` / fund OpenAI; circuits reopen automatically after `CIRCUIT_AUTH_OPEN_MS` (default 6 h) |
| Dead letters, repeated lease expiry, retry storm | `GET /internal/jobs/dead` (content-api and discovery-api each have their own `Job` table — §5) | Read `lastErrorCode`; poison jobs must be parked (`status=dead`), not hot-looped. A job cycling `queued→leased→queued` without ever completing means its lease keeps expiring mid-work — check the claiming worker's actual runtime, not just its `leaseMs` |
| Worker restart / OOM | Docker events, `worker_restarted` | Check which profile OOM'd (`quizzeira-contentworker-*`); scale memory, keep one pass per lease |
| Embedding / syllabus coverage stagnation | Content admin metrics | Likely embedding provider budget/circuit; resume after refill |
| No published question for 24 h with deficits | `StageMetric` funnel | Check generation + judge queues and quality worker logs by correlationId |
| Unexpected cost-rate increase | token counters vs budget | Compare `StageMetric` token buckets; look for cache misses |
| A specific leaf/topic never generates despite a positive deficit | `GET /internal/generation/planner-queue` omits it silently | It is likely poisoned (§9): its last 3 `GenerationRun`s all failed. Check `GenerationRun.error` for that `syllabusNodeId` — a bad brief/KU set needs a human fix, not a retry; the leaf resumes on its own once one run against it succeeds |
| Generation or judge throughput looks capped at ~1/min even with budget headroom | `LLM_RATE_GENERATION_PER_MINUTE` / `LLM_RATE_JUDGE_PER_MINUTE` (default 1 each, §9) | This is by design, not an incident — raise the env var if the canary's acceptance criteria (§14) support a higher ceiling |

## Diagnostic entry points

- **Logs**: Alloy/Loki, one-line JSON per service. Filter by
  `correlationId`, then `jobId`; `traceparent` crossing internal HTTP.
  Retention 24 h — durable counters live in `StageMetric`.
- **Content admin**: `/admin/content/*` quality queue, pipeline metrics.
- **Discovery admin**: source list health, listing fingerprints, `CrawlRun`.
- **Edge**: Grafana Quizzeira overview; `edge-watchdog` alerts only mark
  state changes (KV state under `targets-v1`).
- **Shadow vs monolith comparison** (§12 slice 2 exit): `StageMetric` rows
  carry `service` (the emitting `SERVICE_NAME`). Call
  `GET /internal/stage-metrics?service=quizzeira-contentworker` and again
  with `?service=quizzeira-contentworker-documents` (`-embeddings`,
  `-generation`) over the same `?hours=` window to compare split vs
  monolith per-stage counts before flipping the default profile. Rows
  written before this field existed read as `service=""`.

## Change-control checklist

- Provider keys: rotate, watch for exactly one probe then an open circuit.
- Scale up only after the canary (one topic, one exam, concurrency 1)
  shows stable memory, no overlap, correct backoff, full correlation.
- Shadow profile rollout: keep `content-worker` + shadow
  `content-worker-*` services running until metrics match, then swap.
- Scouting: `DISCOVERY_SCOUT_AUTO_ACTIVATE=true` only after observe-only
  decisions match review for a full review cycle.
