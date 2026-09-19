# discovery-social-scout

Discovery-plane worker that watches **public / consented** social feeds for
Brazilian concurso talk and shared exam files (editais, provas, gabaritos),
then hands outbound file hosts into the existing Discovery ingestion path.

## What it does

1. Poll pluggable source adapters (`fixture`, stub `telegram-public`, stub `reddit-public`).
2. Detect exam-language signals and file / document links in post text.
3. **Never** register social networks as crawl `Source`s (they are hard-denied in `discovery-api` scouting).
4. Propose the **outbound file host** via `POST /internal/scout/candidates` (observe / quarantine / admin activate — same status model as §6.1).
5. Optionally record a URL-only artifact with social provenance in `fetchSignals` (`DISCOVERY_SOCIAL_STORE_URL_ARTIFACTS=true`).

It talks to **discovery-api only** (same DMZ contract as `discovery-crawler`). It does not call Content or Study.

## Ethics / ToS

- Designed for public APIs, bot tokens the operator owns, or user-consented feeds.
- No credential stuffing, no auth-wall bypass, no scraping of private groups.
- Live adapters are stubs; enable only after wiring a compliant client.

## Local

```bash
# fixture pass (default when DISCOVERY_SOCIAL_FIXTURE_MODE=true)
npm run dev -w @quizzeira/discovery-social-scout
npm test -w @quizzeira/discovery-social-scout
```

Compose service: `discovery-social-scout` (disabled by default via
`DISCOVERY_SOCIAL_ENABLED=false`).

## Env

| Variable | Default | Meaning |
| --- | --- | --- |
| `DISCOVERY_SOCIAL_ENABLED` | `false` | Master switch |
| `DISCOVERY_SOCIAL_FIXTURE_MODE` | `true` | Use fixture adapter only |
| `DISCOVERY_SOCIAL_STORE_URL_ARTIFACTS` | `false` | Also POST URL-only artifacts |
| `DISCOVERY_SOCIAL_ADAPTERS` | `fixture` | Comma list: `fixture`, `telegram-public`, `reddit-public` |
| `WORKER_INTERVAL_MS` | from worker-kit | Poll interval |
| `INTERNAL_API_URL` / `INTERNAL_API_KEY` | discovery-api | DMZ auth |

See `NOTES.md` for infra / Workstream C handoff.
