# OWASP GenAI LLM Top 10 (2026) — Quizzeira

## Architecture controls

| Control | Location |
| --- | --- |
| SSRF-hardened link fetch | `apps/api/src/lib/fetch-url.ts` |
| Grounding gate (no Search + untrusted materials) | `apps/question-generator`, `apps/question-updater` |
| HITL question/prompt proposals | `question_update_proposals`, `/admin/proposals/*` |
| Redis LLM budgets | `packages/worker-kit/src/llm.ts` |
| Output screening before persist | `screenModelOutput` / proposal `screenPatch` |
| Prod internal key guard | `apps/api/src/index.ts` |

## OWASP 2026 mapping

| ID | Control |
| --- | --- |
| LLM01 | Fence + regex; no Google Search when materials present; SSRF blocks private fetch |
| LLM02 | Answer keys stripped from UI DTOs; keys only in env |
| LLM03 | Curriculum/prompt live only after admin approve |
| LLM04 | Hosted APIs; seed-priced models |
| LLM05 | Proposals + screening before bank write |
| LLM06 | Shared Redis call budgets; `/internal` rate-limited |
| LLM07 | HITL before curriculum publish |
| LLM08 | No secrets in prompts |
| LLM09 | N/A (no vector store) |
| LLM10 | React text sinks; output policy screen |

## Env

- `QUESTION_UPDATE_GROUNDING=true` — opt-in Search for updater (still HITL)
- `INTERNAL_RATE_LIMIT_MAX` — high ceiling for worker claim loops (default 120)
- `REDIS_URL` — required for shared worker budgets across replicas
- `INTERNAL_API_KEY` — must not be `dev-internal-key` in production
