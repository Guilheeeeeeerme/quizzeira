# Observability — structured logs → VPS ChrisLOG

Production tails container stdout via **ChrisLOG** on the Hostinger VPS
(`stacks/ops` in the infra repo). **Retention: 72 hours (3 days)** plus a
secondary SQLite size cap. Uptime and host/container metrics live beside it
(Uptime Kuma + Beszel). Feature flags: Flipt.

Canonical ops doc: [`infra/docs/OPS.md`](https://github.com/Guilheeeeeeerme/infra/blob/main/docs/OPS.md).

| Plane | URL |
| --- | --- |
| Logs | https://logs.ferredemo.dev |
| Uptime | https://status.ferredemo.dev |
| Metrics | https://metrics.ferredemo.dev |
| Flags | https://flags.ferredemo.dev |

**Do not** point operators at Grafana/Loki/Alloy — that stack was removed and
must not be revived.

## What this repo emits

- Fastify API logger emits JSON with `service` base field (`SERVICE_NAME`, `LOG_LEVEL`).
- `packages/worker-kit` adds `logInfo` / `logWarn` / `logError` (secret-key redaction) and uses them in `runLoop`.
- Compose/production injects `SERVICE_NAME=quizzeira-<service>`.

ChrisLOG scrapes Docker logs for every container on the VPS (including Headroom
and Dokploy). Filter by container/service name in the UI.

## Rollback

Revert structured-logger commits if needed; workers fall back to prior
`console.*` strings. The VPS ChrisLOG hub still tails stdout until the 72h TTL.
