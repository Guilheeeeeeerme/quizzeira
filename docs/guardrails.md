# Guardrails (Quizzeira concurso)

Living control map. Concept map: [ai-swe-concepts.md](./ai-swe-concepts.md). Full audit: [security-audit-owasp-llm-2026.md](./security-audit-owasp-llm-2026.md).

## Architecture controls

| Control | Location | Coverage |
| --- | --- | --- |
| Input fence + regex pre-screen | `packages/worker-kit` | Content Generation + Eval judge + Grading |
| Publish gate | `apps/content-quality` | Only Eval-approved items become `published` |
| Structural validation | `apps/content-quality/src/structural.ts` | Deterministic pre-LLM reject |
| HITL quality queue | `/admin/quality`, `QualityReview` | Admin approve/reject/recheck, audited |
| HITL source proposals | `/admin/sources`, `SourceProposal` | New domains pending until approve |
| Sampling (not RAG) | `content-api` `/published/*`, Study `startPill` | Study never invents bank items |
| Redis call + token budgets | `packages/worker-kit/src/llm.ts` | LLM workers |
| Output policy on persist | `packages/shared` output-policy | Screens on persist paths |
| Scoped internal keys | `INTERNAL_API_KEY_*` | discovery/content/corrector scopes |
| Prod internal key guard | `apps/api/src/index.ts` | Refuses default key in production |

## OWASP notes

- **LLM09:** Embeddings on `Chunk` (pgvector). Study path uses **Sampling**, not RAG — see concept map.
- **No content seed:** continuous Ingestion only; users seed only.

## Env

- `CONTENT_API_URL` / `DISCOVERY_API_URL` — Study proxies published Sampling + admin Source registry
- `INTERNAL_API_KEY_*` — per-plane keys
- `REDIS_URL` — LLM budgets (not domain bank)
