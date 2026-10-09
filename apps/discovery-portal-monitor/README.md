# discovery-portal-monitor

Keeps the Discovery Source registry honest: probes `startUrls`, reports
`/internal/sources/:id/health`, and queues force-crawls when a broken/stale
portal recovers. No LLM.

## Why it exists

Production diagnosis (2026-09): most listing Sources sat `broken` after DMZ/DB
blips and never self-healed. This worker closes that loop without scraping
commercial banks.

## LLM ownership

| Step | Owner |
| --- | --- |
| HTTP probe, health report, force-crawl queue | **Code** |

## Run

```bash
DISCOVERY_PORTAL_MONITOR_ENABLED=true \
INTERNAL_API_URL=http://localhost:3010 \
INTERNAL_API_KEY=dev-discovery-key \
npm run dev -w @quizzeira/discovery-portal-monitor

docker compose --profile portal-monitor up discovery-portal-monitor
```
