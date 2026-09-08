# OWASP GenAI LLM Top 10 (2026) — Quizzeira

Living control map. Full audit: [security-audit-owasp-llm-2026.md](./security-audit-owasp-llm-2026.md).

## Architecture controls

| Control | Location | Coverage |
| --- | --- | --- |
| SSRF-hardened link fetch | `apps/api/src/lib/fetch-url.ts` | Links fetched for excerpts |
| Input fence + regex pre-screen | `packages/worker-kit` `generateJson` / `guardrails/registry.yml` | All LLM user payloads |
| Grounding gate | `apps/question-generator` | Search only when `hasLinks` and **no** attachments/links present |
| HITL question/prompt proposals | `question_update_proposals`, `/admin/proposals/*` | Updater curriculum + prompt bodies |
| HITL bank deposits | Redis `qa:bank:proposal:*`, `/admin/proposals/bank/*` | LLM + past-exam deposits staged; **seed** writes stay live |
| Pill generation | `pill.service` + `screenGeneratedQuestions` | Live for UX; output policy + media allowlist |
| Redis call + token budgets | `packages/worker-kit/src/llm.ts` | Call counts + `LLM_DAILY_TOKEN_BUDGET`; Redis required outside tests |
| Output policy on persist | `packages/shared/src/output-policy.ts` via API `screen-model` | Corrections, pills, syllabus, bank proposals, updater patches |
| Media URL allowlist | `packages/shared/src/media-url.ts`, `QuestionMedia` | Blocks `data:` / unknown hosts; HTTPS allowlist |
| Scoped internal keys | `INTERNAL_API_KEY_*` + `internal-auth.ts` | Per-worker scopes; compose binds API to `127.0.0.1` |
| Prod internal key guard | `apps/api/src/index.ts` | Refuses `dev-internal-key` when `NODE_ENV=production` |

## OWASP 2026 mapping

| ID | What we have | Residual |
| --- | --- | --- |
| LLM01 | Fence + regex; Search off when any materials present; SSRF | Regex is depth not prevention |
| LLM02 | Keys stripped from in-progress quiz DTOs; provider keys in env | Keys in DB; prompts in Redis |
| LLM03 | Scoped worker keys; HITL for updater + bank LLM deposits; MCQ score from DB | Pills still live (screened); syllabus live (screened) |
| LLM04 | Hosted APIs; env-pinned defaults; raw fetch | `model-rank` catalog promotion |
| LLM05 | Bank LLM/past-exam → HITL; updater proposals | Seed path trusted |
| LLM06 | Redis call + token hard halt; fail closed | Estimate usage when provider omits counts |
| LLM07 | HITL before bank/updater publish; deterministic MCQ grade | Pill questions still go live after shape + screen |
| LLM08 | No secrets in prompts | Assume prompt bodies leakable |
| LLM09 | N/A (no vector store) | — |
| LLM10 | Output policy on persist; media allowlist; React text feedback | — |

## Env

- `QUESTION_UPDATE_GROUNDING=true` — updater Search (still HITL)
- `INTERNAL_API_KEY_*` — per-worker scoped keys (corrector/generator/updater/crawler)
- `REDIS_URL` — required for worker LLM budgets (use `LLM_ALLOW_MEMORY_BUDGET=true` only in tests)
- `LLM_DAILY_TOKEN_BUDGET` — hard daily token halt (default 2_000_000)
- `MEDIA_URL_ALLOWLIST` — comma-separated HTTPS host suffixes for question figures
- `INTERNAL_API_KEY` — must not be `dev-internal-key` in production (legacy full-access)
