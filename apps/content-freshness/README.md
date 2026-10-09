# content-freshness

Content-plane worker that watches curated **official legislation URLs**
(Planalto, CNJ, …) for `ETag` / `Last-Modified` changes and asks content-api to
requeue matching knowledge documents. Keeps the corpus relevant when laws are
amended — without seeding questions.

## LLM ownership

| Step | Owner |
| --- | --- |
| HTTP fingerprint / change detection | **Code** |
| Requeue document for re-extract | content-api (code) |
| Re-classify / remapping residue after reprocess | **JEV** Choice (`JEV_CLASSIFY_MODE` / `JEV_MAPPING_MODE`) when active |
| Re-distill KUs / regenerate drafts | **Gemini** `gemini-3.1-flash-lite` |
| Re-judge published replacements | **JEV** Score+Choice (`JEV_JUDGE_MODE`) |

This worker never calls Gemini or JEV directly (`LLM_USE_HEADROOM` irrelevant).

## Safety

Defaults: `CONTENT_FRESHNESS_ENABLED=false`, `CONTENT_FRESHNESS_DRY_RUN=true`.

## Run

```bash
CONTENT_FRESHNESS_ENABLED=true \
CONTENT_FRESHNESS_DRY_RUN=true \
INTERNAL_API_URL=http://localhost:3020 \
INTERNAL_API_KEY=dev-content-key \
npm run dev -w @quizzeira/content-freshness

docker compose --profile freshness up content-freshness
```
