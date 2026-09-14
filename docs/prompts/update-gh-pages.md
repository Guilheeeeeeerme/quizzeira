# Prompt: update GitHub Pages (ecosystem docs) — Quizzeira

Use this when Quizzeira planes (Discovery / Content / Study), crawler redesign,
eval gate, sampling, embeddings, or guardrails change and the shared ecosystem
docs may be stale.

**Ecosystem docs live only in ferredemo-docs** — never recreate a multi-product
VitePress site (or Pages deploy) inside this repository.

| | |
| --- | --- |
| **Docs repo** | https://github.com/Guilheeeeeeerme/ferredemo-docs |
| **Live URL** | https://guilheeeeeeerme.github.io/ferredemo-docs/ |
| **Full SoT prompt** | https://github.com/Guilheeeeeeerme/ferredemo-docs/blob/main/prompts/update-gh-pages.md |

Product branding, icons, and README links in **this** repo may point at that
URL. Edits and deploys happen in **ferredemo-docs** only.

## 1. Identify relevant commits / diffs (this repo)

Collect commits since the last docs update that touch Quizzeira paths such as:

| Area | Typical paths |
| --- | --- |
| Discovery | `apps/discovery-api/**`, `apps/discovery-crawler/**` |
| Content | `apps/content-api/**`, `apps/content-worker/**`, `apps/content-quality/**` |
| Study | `apps/api/**`, `apps/web/**`, `apps/quiz-corrector/**` |
| Shared | `packages/worker-kit/**`, `packages/shared/**` |
| Specs / defaults | `docs/crawler-redesign-spec.md`, `docs/guardrails.md`, `.env.sample`, compose |
| Eval / bank | Eval thresholds, BANK_READY, KU targets, sampling |

Record **SHA range** (or single SHAs) and a one-line summary per commit.
Cross-check sibling repos (`infra` Headroom notes) only when those diffs
affect Quizzeira claims.

**Do not invent** Agents, token streaming, full semantic RAG, question-bank
seeds, or Quizzeira Headroom-on without code evidence. Workers use
`LLM_USE_HEADROOM=false` by design.

## 2. Diff against documented claims

In a checkout of **ferredemo-docs**, open matching Pages under `docs/en/**`
(and `pt/**` if translated) and check:

- Defaults tables (intervals, TTLs, budgets, thresholds)
- Mermaid diagrams (new/removed services or edges)
- Status tags: `VERIFIED` / `PARTIAL` / `UNUSED` / `NOT FOUND`
- Comparison matrix + defaults cheatsheet + known-gaps

Upgrade/downgrade tags **only** with code evidence. Prefer citing
`path:symbol` in the PR body.

## 3. Update only affected sections (in ferredemo-docs)

Edit the smallest set of markdown under `docs/` in **ferredemo-docs**, not here.

Quizzeira checklist (paths relative to ferredemo-docs `docs/`):

- [ ] `en/quizzeira/architecture.md` / `ingestion.md` / `content-generation.md`
- [ ] `en/quizzeira/eval-gate.md` / `sampling-and-study.md` / `embeddings-and-retrieval.md`
- [ ] `en/quizzeira/known-gaps.md`
- [ ] Defaults cheatsheet (intervals, eval 0.8/0.5, BANK_READY, KU targets)
- [ ] Headroom notes (Quizzeira OFF) / `en/standards/observability.md` if ops claims moved
- [ ] `en/reference/not-in-scope.md` if a capability was wrongly implied
- [ ] PT mirrors for any page you substantially changed

Preserve status-tag HTML (`<span class="status …">`). Keep EN canonical.
Never document unused code as live behavior.

## 4. Rebuild and deploy (ferredemo-docs)

```bash
# from ferredemo-docs checkout
npm ci
npm run build
```

Push/merge to `main` in **ferredemo-docs**. Workflow
`.github/workflows/deploy-pages.yml` builds and deploys Pages.

Confirm Actions green and
`https://guilheeeeeeerme.github.io/ferredemo-docs/` serves updated `/en/` content.

## Done criteria

1. SHAs + claim deltas listed in the ferredemo-docs PR
2. `npm run build` succeeds in ferredemo-docs
3. Pages workflow green on ferredemo-docs only
4. No new undocumented “Agents / streaming / full RAG / bank seed / Headroom-on” claims
5. This product repo was **not** given a VitePress tree or Pages workflow
