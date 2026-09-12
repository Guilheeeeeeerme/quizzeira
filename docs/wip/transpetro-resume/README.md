# WIP resume: Transpetro URL registration

Snapshots from the 2026-09-12 local Compose run. Use with
`docs/transpetro-url-registration-report.md` and `concurso-transpetro-urls.txt`.

| File | Contents |
| --- | --- |
| `register-results.json` | Admin upserts for archaeology URLs + force-crawl queue |
| `mid-status.json` | Sources / Transpetro exams after first full crawl |
| `final-status.json` | Post-cleanup source health, open/artifact exams, study `/exams` |

## Resume checklist

1. ~~`docker compose up`~~ done
2. ~~Cesgranrio-only → `Transpetro 2026` on study~~ done
3. ~~Fine-tune: enable 7 high-signal sources, FIFO force queue, slug/artifact/generation fixes~~ done
4. ~~`bankReady: true` for Transpetro 2026 (6 published) + Caixa 2025 (5)~~ done
5. Sister infra PR: Headroom bypass docs (`docs/quizzeira-headroom.md`) — still draft if open

Do not commit `.env`, cookie jars, or Playwright MCP caches.
