# Intelligence routing (Quizzeira)

Canonical cross-app contract: infra [`docs/intelligence-routing.md`](../../infra/docs/intelligence-routing.md).

Quizzeira ownership detail: [llm-ownership.md](./llm-ownership.md).

| Need | Owner |
| --- | --- |
| Closed Choice/Score (classify T3, mapping T3, judge, MCQ corrector) | JEV `active` |
| PT generation, open-text grades, `generalComment`, embeddings | Gemini `gemini-3.1-flash-lite` / `gemini-embedding-001` |
| Discovery / Study API+web | No LLM |

Prod: keep all `JEV_*_MODE=active`. Use `shadow` only for Portuguese holdouts; never leave prod on `shadow`.
After holdout, promote `JEV_MODEL` from `jev-1.13.0` → `jev-1.14.0`.
