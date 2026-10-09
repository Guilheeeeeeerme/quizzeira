# discovery-source-scout

Thin Discovery-plane worker that rotates a **curated catalog of official Brazilian
exam / legislation portals** into `SourceCandidate` rows via
`POST /internal/scout/candidates`. No LLM. Never activates Sources by itself
(observe/quarantine until admin review, unless
`DISCOVERY_SCOUT_AUTO_ACTIVATE=true` on discovery-api).

## LLM ownership

| Step | Owner |
| --- | --- |
| Catalog rotation, propose candidates | **Code** (no Gemini, no JEV) |
| Candidate scoring | discovery-api `scouting.ts` (deterministic) |

## Run locally

```bash
# requires discovery-api healthy
DISCOVERY_SOURCE_SCOUT_ENABLED=true \
INTERNAL_API_URL=http://localhost:3010 \
INTERNAL_API_KEY=dev-discovery-key \
npm run dev -w @quizzeira/discovery-source-scout

# or compose profile
docker compose --profile source-scout up discovery-source-scout
```

## Operator flow

1. Enable the worker (`DISCOVERY_SOURCE_SCOUT_ENABLED=true`).
2. Review `/admin/sources` candidates (quarantined/observed).
3. Promote high-trust domains with correct `kind` (`banca_portal`, `legislation`, …)
   and `discoveryMode` — do not leave everything as `aggregator`.
4. Prefer P0 first (`DISCOVERY_SOURCE_SCOUT_PRIORITY=P0`).

Catalog: `src/catalog/sources.json`. Commercial Q-banks are listed under
`doNotScrape` and rejected.
