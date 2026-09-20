# discovery-social-scout

Discovery-plane worker that watches **public / consented** social feeds for
Brazilian concurso talk and shared exam files (editais, provas, gabaritos),
then hands outbound file hosts into the existing Discovery ingestion path.

## What it does

1. Poll pluggable source adapters (fixture + live public APIs).
2. Detect exam-language signals and file / document links in post text.
3. **Never** register social networks as crawl `Source`s (they are hard-denied in `discovery-api` scouting).
4. Propose the **outbound file host** via `POST /internal/scout/candidates` (observe / quarantine / admin activate — same status model as §6.1).
5. Optionally record a URL-only artifact with social provenance in `fetchSignals` (`DISCOVERY_SOCIAL_STORE_URL_ARTIFACTS=true`).

It talks to **discovery-api only** (same DMZ contract as `discovery-crawler`). It does not call Content or Study.

## Locale (pt-BR default)

Default locale is **`pt-BR`** (`DISCOVERY_SOCIAL_LOCALE=pt-BR`). Search defaults use
Brazilian concurso vocabulary (edital, inscrição, gabarito, prova, CESPE/Cebraspe,
FCC, FGV, VUNESP, CESGRANRIO, OAB). English terms are **not** default — append via
`DISCOVERY_SOCIAL_KEYWORDS_EXTRA` if needed.

| Adapter | pt-BR query shaping | Gap |
| --- | --- | --- |
| `x-public` | query includes `lang:pt` | no country filter on recent search |
| `google-cse` | `lr=lang_pt`, `gl=br`, `hl=pt-BR` + edital/gabarito/prova suffix | — |
| `youtube-data` | `relevanceLanguage=pt`, `regionCode=BR` | — |
| `reddit-public` | default subs `concursos,brasil` + pt-BR keywords | **no** official lang/region param |
| `instagram-graph` | operator-chosen BR IG Business accounts | **no** search lang filter |
| `facebook-graph` | operator-chosen BR Pages | **no** feed lang filter |
| `telegram-public` | bot added to BR concurso channels | **no** lang filter on `getUpdates` |

Optional `DISCOVERY_SOCIAL_LOCALE=en` flips X/Google/YouTube params for experiments.

## Adapters

| Adapter id | Platform | API | Required env |
| --- | --- | --- | --- |
| `fixture` | fixture | local JSON | none |
| `x-public` | X / Twitter | API v2 recent search | `X_BEARER_TOKEN` (or `TWITTER_BEARER_TOKEN`) |
| `google-cse` | Google | Custom Search JSON API | `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX` |
| `instagram-graph` | Instagram | Graph API (Business/Creator) | `INSTAGRAM_ACCESS_TOKEN` (or `META_GRAPH_ACCESS_TOKEN`), `INSTAGRAM_BUSINESS_ACCOUNT_IDS` |
| `facebook-graph` | Facebook | Graph API Page feed | `FACEBOOK_ACCESS_TOKEN` (or `META_GRAPH_ACCESS_TOKEN`), `FACEBOOK_PAGE_IDS` |
| `reddit-public` | Reddit | OAuth, or public `.json` only with `REDDIT_ALLOW_ANONYMOUS=true` | `REDDIT_SUBREDDITS` (default `concursos,brasil`); `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT`; without credentials the adapter reports `disabled` unless anonymous is explicitly allowed |
| `youtube-data` | YouTube | Data API v3 search | `YOUTUBE_API_KEY` |
| `telegram-public` | Telegram | Bot API `getUpdates` | `TELEGRAM_BOT_TOKEN` |

Missing credentials → adapter returns `{ status: "disabled", posts: [] }`. The worker still starts; unit tests pass without live keys.

### Honest limits

- **Instagram**: no official arbitrary public post search. Only media from Instagram Business / Creator accounts the operator authorizes via Graph.
- **Facebook**: public Page feeds the token can read — not private groups or auth-wall bypass.
- **Telegram**: only channels/groups the bot was added to.
- **X / Google / YouTube**: require paid/approved API access from the vendor; without keys the adapter stays disabled.

## Ethics / ToS

- Official public APIs / SDKs and operator-owned tokens only.
- No credential stuffing, no auth-wall bypass, no scraping of private groups.
- Social domains are never registered as Discovery crawl Sources.

## Local

```bash
# fixture pass (default when DISCOVERY_SOCIAL_FIXTURE_MODE=true)
npm run dev -w @quizzeira/discovery-social-scout
npm test -w @quizzeira/discovery-social-scout
npm run typecheck -w @quizzeira/discovery-social-scout   # via root: tsc -p apps/discovery-social-scout
```

Optional live smoke (not CI):

```bash
DISCOVERY_SOCIAL_SMOKE=true X_BEARER_TOKEN=… npm test -w @quizzeira/discovery-social-scout
```

Compose service: `discovery-social-scout` (disabled by default via
`DISCOVERY_SOCIAL_ENABLED=false`).

## Env

| Variable | Default | Meaning |
| --- | --- | --- |
| `DISCOVERY_SOCIAL_ENABLED` | `false` | Master switch |
| `DISCOVERY_SOCIAL_FIXTURE_MODE` | `true` | Use fixture adapter only |
| `DISCOVERY_SOCIAL_STORE_URL_ARTIFACTS` | `false` | Also POST URL-only artifacts |
| `DISCOVERY_SOCIAL_ADAPTERS` | `fixture` | Comma list of adapter ids (see table) |
| `DISCOVERY_SOCIAL_LOCALE` | `pt-BR` | Scout locale (`pt-BR` or `en`) |
| `DISCOVERY_SOCIAL_KEYWORDS` | built-in pt-BR concurso queries | Comma-separated search queries (replaces defaults) |
| `DISCOVERY_SOCIAL_KEYWORDS_EXTRA` | _(empty)_ | Optional extra keywords (e.g. English) appended to defaults |
| `DISCOVERY_SOCIAL_SMOKE` | `false` | Enable optional live API smoke tests |
| `DISCOVERY_SOCIAL_MAX_POSTS` / `MAX_FILES` | `40` / `12` | Pass caps |
| `WORKER_INTERVAL_MS` | from worker-kit | Poll interval |
| `INTERNAL_API_URL` / `INTERNAL_API_KEY` | discovery-api | DMZ auth |

Live API keys (set only when enabling the matching adapter):

| Variable | Used by |
| --- | --- |
| `X_BEARER_TOKEN` / `TWITTER_BEARER_TOKEN` | `x-public` |
| `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX` | `google-cse` |
| `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_IDS` | `instagram-graph` |
| `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_IDS` | `facebook-graph` |
| `META_GRAPH_ACCESS_TOKEN` | shared Meta fallback for IG/FB |
| `YOUTUBE_API_KEY` | `youtube-data` |
| `TELEGRAM_BOT_TOKEN` | `telegram-public` |
| `REDDIT_SUBREDDITS`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`, `REDDIT_ALLOW_ANONYMOUS` | `reddit-public` |

See `NOTES.md` for infra / Workstream C handoff.
