# AGENTS.md — Quizzeira

Coding-agent rules for this repository. Project map: [CLAUDE.md](./CLAUDE.md), [README.md](./README.md). Concepts: [docs/ai-swe-concepts.md](./docs/ai-swe-concepts.md).

## Scope

- Work inside this monorepo (`apps/`, `packages/`, `docs/`, `specs/`).
- Production Compose/Jenkins lives in **infra** — do not invent a parallel prod deploy path here.
- Prefer targeted changes. Do not run the full `npm test` matrix unless asked or the change spans planes.

## Hard rules

- **No question-bank seed.** Do not add fixtures that fake published curriculum; ingestion + Eval only.
- **Publish gate**: Study Sampling may use Eval-approved items only.
- **Planes stay separate**: Discovery / Content / Study databases and APIs — do not collapse stores or cross-wire without an explicit migration task.
- **LLM**: workers use `LLM_USE_HEADROOM=false` by design; do not point them at Headroom without fixing network/auth (see infra `docs/quizzeira-headroom.md`). Follow [docs/guardrails.md](./docs/guardrails.md).
- **Keys**: scoped `INTERNAL_API_KEY_*`; never commit real secrets or leave default internal keys for prod.
- **Env**: `.env.sample` → `.env`; never commit `.env`.
- **Ralph**: `.agents/skills/ralph-wiggum` and `.specify/memory/constitution.md` apply only when that autonomous flow is invoked — ordinary agent chats still ask before commits unless the user requested otherwise.

## Verification

```bash
npm run typecheck
# or focused tests for touched packages:
npm run test:shared && npm run test:i18n
```

## Communication

User-facing text in English.
