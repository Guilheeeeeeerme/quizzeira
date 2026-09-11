# Observability — structured logs for the infra Loki hub

Production scrapes container stdout via Grafana Alloy into Loki (24h retention).
Design write-up lives in the `infra` repo:
[`docs/love-logs-tot.md`](https://github.com/Guilheeeeeeerme/infra/blob/love-logs/observability-24h/docs/love-logs-tot.md)
([Phase 5 — Selection](https://github.com/Guilheeeeeeerme/infra/blob/love-logs/observability-24h/docs/love-logs-tot.md#phase-5--selection)).

## What changed here

- Fastify API logger emits JSON with `service` base field (`SERVICE_NAME`, `LOG_LEVEL`).
- `packages/worker-kit` adds `logInfo` / `logWarn` / `logError` (secret-key redaction) and uses them in `runLoop`.
- Compose/production injects `SERVICE_NAME=quizzeira-<service>` from infra.

## Rollback

Revert this branch. Workers fall back to prior `console.*` strings; API returns to `logger: true`. Infra Loki hub still tails stdout until 24h TTL.
