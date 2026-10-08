# LLM ownership — Gemini generation, JEV typed decisions

Implements the Quizzeira JEV/Gemini audit (`JEV_GEMINI_AUDIT_PLAN.md`, Stage A + B).
Engineering truth for which model owns which call. Discovery has no LLM. Study API/web
never call providers. Stack is **Gemini + JEV only** (no OpenAI, no Firecrawl, no
Headroom on workers).

## Cost-aware routing (cheapest stable)

| Layer | Owner | Why |
| --- | --- | --- |
| Closed Choice / Score (classify T3, mapping T3, judge scores + `answerIndex`) | **JEV** when mode=`active` | Cheap, fast, typed; no Gemini substitute on failure |
| Open Portuguese generation + embeddings + quiz corrector | **Gemini** pinned `GEMINI_MODEL=gemini-3.1-flash-lite` / `CONTENT_GEMINI_EMBEDDING_MODEL=gemini-embedding-001` | Bulk JSON + vectors; no models.list |
| Staging comparison | mode=`shadow` | Fires **both** JEV and Gemini — double spend; staging/holdout only |
| Discovery topic search | allowlist / `SEARCH_API_*` / fixture | No LLM; Firecrawl removed |

Prefer `active` in production so closed decisions pay JEV once. Keep `shadow` for
Portuguese holdout evaluation before promoting a rubric change; never leave prod on
`shadow` long-term.

## Owners

| Use case | Owner | Code |
| --- | --- | --- |
| Classify T3 role residue | **JEV Choice** over the closed `DocumentRole` set (`JEV_CLASSIFY_MODE`) | `apps/content-worker/src/stages/classify-llm.ts` |
| Mapping T3 syllabus residue | **JEV Choice**, batched (≤8 chunks × ≤12 leaves + `none`) (`JEV_MAPPING_MODE`) | `apps/content-worker/src/stages/knowledge/mapping-llm.ts` |
| Eval judge scores + `answerIndex` | **JEV Score×4 + Choice**; reason tags and notes are code templates (`JEV_JUDGE_MODE`) | `apps/content-quality/src/judge.ts` |
| Syllabus residue topics, KU distill, question generation, quiz corrector | **Gemini** `gemini-3.1-flash-lite` via `generateJson` | content-worker stages, `quiz-corrector` |
| Chunk / leaf embeddings | **Gemini** `gemini-embedding-001` @ 768 | `apps/content-worker/src/embeddings/index.ts` |
| T0–T2 classify/mapping, budgets, circuits, publish gate | Code | — |

`generateJson` has exactly one owner per call (Gemini, or the `fixture` provider in CI)
and dials the pinned env model only (`GEMINI_MODEL`, default `gemini-3.1-flash-lite` —
cheapest unrestricted stable Flash-Lite per Google pricing (2.5 is access-gated)). There is no `models.list` catalog
refresh, no model-rank `setInterval`, and no cross-model failover. Embeddings use
`CONTENT_GEMINI_EMBEDDING_MODEL` (`gemini-embedding-001` @ 768).

## JEV transport and contract

- `packages/worker-kit/src/jev.ts`: `POST {JEV_BASE_URL}/v1/systemone`, bearer `JEV_API_KEY`,
  model `JEV_MODEL` (`jev-1.13.0`), 10 s timeout, direct to TypeSafe (never Headroom).
- Questions: `choice` (`criteria` = option → description, 2..255 options) and `score`
  (`criteria` = ordered level descriptions, 2..10). Answers are validated strictly: exact
  question-id set, matching types, option names from the supplied criteria, finite
  probabilities in `[0,1]` summing to 1 (±1e-3), finite confidence. Free text is never parsed.
- Errors expose provider, task, HTTP status and a stable `code`; never the response body or
  the key. 401/403/404/422 are not retried; 429/529/5xx/timeout retry the **same** model with
  full-jitter backoff up to `JEV_MAX_ATTEMPTS` (3).

## Modes (`off` | `shadow` | `active`, per task)

| Mode | Production decision | JEV call | Failure handling |
| --- | --- | --- | --- |
| `off` | Gemini / code (legacy path) | none | unchanged |
| `shadow` | Gemini / code | fired beside it, result logged (`jev_shadow`, `jev_shadow_compare`) | logged as `jev_shadow_error`; production untouched; **double cost** |
| `active` | **JEV** | owns the decision | typed error → stage defers/retries; **no Gemini substitute** |

Unset `JEV_*_MODE` → `active` when `JEV_API_KEY` is present, `off` otherwise
(empty compose passthrough so local stacks without a key stay `off`).
`shadow`/`active` without a key fails `checkProviderReadiness` with `jev_key_missing`
(loud at startup). Production env example sets modes to `active` explicitly.

Budgets: `active` JEV calls are counted exactly like Gemini calls (global per-minute, daily
calls/tokens, per-stage caps). `shadow` calls use their own caps (`JEV_SHADOW_RATE_PER_MINUTE`,
`JEV_SHADOW_DAILY_CALLS`) and never the shared `llm:rate:*` limiter, so shadow sampling cannot
starve the generation/judge production slots. Both share the `jev` circuit breaker.

Readiness still requires Gemini when JEV is fully `active`: generation, embeddings, and
quiz-corrector are Gemini-owned.

## Promotion checklist (Stage C — per task, operator config only)

Prod defaults to `active`. After changing a rubric, model, or threshold, temporarily set
`JEV_<TASK>_MODE=shadow` for a Portuguese holdout, then return to `active`. Before that
holdout window ends, for a frozen set with the rubric versions below pinned:

1. No material quality regression vs the Gemini/code baseline (role accuracy; leaf accuracy;
   judge score/answer agreement and no new false publishes).
2. Mean provider cost for the task path ≤ baseline; p95 latency not materially worse.
3. No new schema, tenant or failure-handling defects (shadow error rate reviewed).
4. Acceptance artifact tied to `JEV_MODEL`, rubric version, prompt/config fingerprint.

Rubric versions: `role-t3-jev-v1`, `map-t3-jev-v1`, `judge-jev-v1`. Changing a rubric,
model or threshold returns that task to `shadow` until re-evaluated, then back to `active`.

Rollback = set the mode to `shadow`/`off` and recreate. Never introduce a second generation
provider.

## Secrets

The Quizzeira JEV key is Quizzeira-only. It lives in infra SOPS / Dokploy panel under
`quizzeira:` → Compose `env_file`. Never reuse an Argus, PromptDesk, `providers` or
`headroom` token; never put it in `.env.sample`, build args, images, workflow logs or docs.
Panel checks: `JEV_*` present on `content-worker`, `content-quality`, `quiz-corrector`;
no retired provider keys.
