# Open exams — catalog + smart refresh

## Label
**Open exams** (pt: Concursos abertos). Routes: `/exams`. Internal keys use English `exam*`.

## Ingestion

1. **Every 30 minutes** (`EXAM_CRAWLER_INTERVAL_MS=1800000`, empty windows): `exam-crawler` discovery pass.
2. **Smart skip**: per-source listing fingerprint — if unchanged, no upsert/search. Open-exam fingerprint — only count/search when new or changed. Past-exam search skipped when the question bank already has items for that `examSlug`.
3. **Force**: `POST /admin/crawler/run-now`.
4. **Catalog UI**: `GET /exams` seeds placeholders if empty so the page is usable before the first crawl finishes.

Default local: `EXAM_CRAWLER_FIXTURE_MODE=true` (no live browse required).

## User flow

Open exams → pick exam → prepare topic → pill / 15–90 / focus → study (bank preferred).

## Local

```bash
docker compose up --build
docker compose up -d --build exam-crawler
```

Then open http://localhost:5173 → **Open exams**.

## Env

| Var | Default | Meaning |
| --- | --- | --- |
| `EXAM_CRAWLER_ENABLED` | `true` | Master switch |
| `EXAM_CRAWLER_FIXTURE_MODE` | `true` | Fixture HTML vs live Playwright |
| `EXAM_CRAWLER_INTERVAL_MS` | `1800000` | Tick interval (2×/hour) |
| `EXAM_CRAWLER_WINDOWS` | empty | Continuous ticks (no daily window) |
| `FIRECRAWL_API_KEY` | empty | Live past-exam enrich (optional) |
