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
| Dead letters, repeated lease expiry, retry storm | dead-letter view per plane | Read `lastErrorCode`; poison jobs must be parked, not hot-looped |
| Worker restart / OOM | Docker events, `worker_restarted` | Check which profile OOM'd (`quizzeira-contentworker-*`); scale memory, keep one pass per lease |
| Embedding / syllabus coverage stagnation | Content admin metrics | Likely embedding provider budget/circuit; resume after refill |
| No published question for 24 h with deficits | `StageMetric` funnel | Check generation + judge queues and quality worker logs by correlationId |
| Unexpected cost-rate increase | token counters vs budget | Compare `StageMetric` token buckets; look for cache misses |

## Diagnostic entry points

- **Logs**: Alloy/Loki, one-line JSON per service. Filter by
  `correlationId`, then `jobId`; `traceparent` crossing internal HTTP.
  Retention 24 h — durable counters live in `StageMetric`.
- **Content admin**: `/admin/content/*` quality queue, pipeline metrics.
- **Discovery admin**: source list health, listing fingerprints, `CrawlRun`.
- **Edge**: Grafana Quizzeira overview; `edge-watchdog` alerts only mark
  state changes (KV state under `targets-v1`).

## Change-control checklist

- Provider keys: rotate, watch for exactly one probe then an open circuit.
- Scale up only after the canary (one topic, one exam, concurrency 1)
  shows stable memory, no overlap, correct backoff, full correlation.
- Shadow profile rollout: keep `content-worker` + shadow
  `content-worker-*` services running until metrics match, then swap.
- Scouting: `DISCOVERY_SCOUT_AUTO_ACTIVATE=true` only after observe-only
  decisions match review for a full freshquence cycle.
