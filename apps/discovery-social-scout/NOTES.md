# Infra / Workstream C handoff

App-local social scout. Prefer not editing the infra repo from this workstream.

## Production packaging (when ready)

- Add GHCR image build for `quizzeira/discovery-social-scout` (same tag scheme as other workers).
- Compose / deploy: env from SOPS (`INTERNAL_API_KEY_DISCOVERY`, interval, enable flag, API keys below).
- Default **off** in prod until adapters are ToS-reviewed (`DISCOVERY_SOCIAL_ENABLED=false`).
- No new Postgres schema required for v0 (reuses SourceCandidate + Artifact).
- No Playwright / browser dependency (unlike discovery-crawler).
- Network: same DMZ + private pattern as discovery-crawler → discovery-api only.
- Secrets for live adapters belong in SOPS — never bake into images:
  - `X_BEARER_TOKEN`
  - `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_CX`
  - `INSTAGRAM_ACCESS_TOKEN` / `INSTAGRAM_BUSINESS_ACCOUNT_IDS`
  - `FACEBOOK_ACCESS_TOKEN` / `FACEBOOK_PAGE_IDS`
  - `META_GRAPH_ACCESS_TOKEN` (optional shared Meta token)
  - `YOUTUBE_API_KEY`
  - `TELEGRAM_BOT_TOKEN`
  - optional Reddit OAuth + `REDDIT_SUBREDDITS`

## Open questions for operators

1. Synthetic Discovery `Source` row for social provenance vs `sourceId=null` + `fetchSignals` only?
2. Should activated scout candidates from social auto-enqueue a one-shot download job, or wait for the normal crawler pass?
3. Rate limits / allow-lists for which social channels / pages / IG business accounts are monitored?
