# WIP resume: Transpetro URL registration

Snapshots from the 2026-09-12 local Compose run. Use with
`docs/transpetro-url-registration-report.md` and `concurso-transpetro-urls.txt`.

| File | Contents |
| --- | --- |
| `register-results.json` | Admin upserts for archaeology URLs + force-crawl queue |
| `mid-status.json` | Sources / Transpetro exams after first full crawl |
| `final-status.json` | Post-cleanup source health, open/artifact exams, study `/exams` |

## Resume checklist

1. `docker compose up` (Gemini key in `.env`, `LLM_USE_HEADROOM=false`, embed model `gemini-embedding-001`)
2. Login as admin; confirm Cesgranrio + enabled sources match `final-status.json`
3. Force crawl Cesgranrio; verify `Transpetro 2026` on `GET /exams` with `bankReady`
4. Re-close junk exams if a noisy source was re-enabled
5. Sister infra PR: Headroom bypass docs (`docs/quizzeira-headroom.md`)

Do not commit `.env`, cookie jars, or Playwright MCP caches.
