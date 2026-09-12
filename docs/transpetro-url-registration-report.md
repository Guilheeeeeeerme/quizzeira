# Transpetro URL registration report

**Date:** 2026-09-12  
**Scope:** All non-test URLs from `concurso-transpetro-urls.txt` registered as Discovery sources, crawled, cleaned up, and exercised through Content where possible.  
**Environment:** local Docker Compose (`quizzeira`), Gemini direct (`LLM_USE_HEADROOM=false`), embedding model `gemini-embedding-001`.

## Verdict

| Area | Result |
| --- | --- |
| Source registration | **Works** — 16 archaeology URLs upserted (test-only `example.org` / `exemplo.gov.br` skipped) |
| Force crawl | **Works** after Discovery API is healthy |
| Primary Transpetro exam | **Works** — `Transpetro 2026` open, studyable (`bankReady: true`, 9 bank questions) |
| Past-exam extraction / embeddings / generation | **Works** against public Gemini (with Headroom bypass) |
| Broad banca listings | **Partial** — crawls succeed but many pages yield nav/chrome noise (closed in admin) |
| Fixture / single-PDF archaeology paths | **Mostly disabled** — not useful as live listing sources |

---

## URL inventory

### Registered and kept **enabled**

| Source | URL | Crawl | Useful signal |
| --- | --- | --- | --- |
| Cesgranrio Concursos | `https://www.cesgranrio.org.br/concursos/` | OK | **Yes** — discovers `Transpetro 2026` (`/concurso/transpetro-2026/`) |
| Cesgranrio Transpetro PSP Terra Edital | `https://www.cesgranrio.org.br/concursos/transpetro-psp-terra/edital.pdf` | OK (PDF treated as single listing) | Partial — historic edital path; artifact stored when reachable |
| PCI Concursos Provas | `https://www.pciconcursos.com.br/provas/` | OK | Partial — finds prova index rows; noisy without tight patterns |
| FCC Concursos | `https://www.fcc.org.br/concursos/` | OK | Weak — institutional chrome dominated listings |
| Cebraspe Concursos | `https://www.cebraspe.org.br/concursos/` | OK | Weak / no Transpetro-specific opens in this pass |
| FGV Conhecimento | `https://conhecimento.fgv.br/concursos` | OK | Weak / no Transpetro-specific opens in this pass |
| Transpetro Selections | `https://transpetro.com.br/.../carreiras/concursos.htm` (retargeted from home) | OK after upsert fix | Org careers page; not a full edital feed |

### Registered then **disabled** (fixture / low-signal / noisy)

| Source | URL | Why disabled |
| --- | --- | --- |
| PCI Concursos Home | `https://www.pciconcursos.com.br/` | Home page noise; Provas index kept instead |
| IBAMSP Concursos 179 | `https://www.ibamsp-concursos.org.br/informacoes/179/` | Seeded historic path; not Transpetro |
| GovBR Concursos Trabalho | `https://www.gov.br/pt-br/categorias/.../concursos` | Category page; low signal |
| Cesgranrio BB Escriturario | `https://www.cesgranrio.org.br/concursos/bb-escriturario/` | Fixture path from git archaeology |
| Cesgranrio Caixa Tecnico | `https://www.cesgranrio.org.br/concursos/caixa-tecnico/` | Fixture path; intermittent Playwright close error |
| Cesgranrio Evento Edital PDF | `https://www.cesgranrio.org.br/concursos/evento/edital.pdf` | Spec fixture URL |
| Cesgranrio Evento 1 | `https://www.cesgranrio.org.br/concursos/evento/1` | Spec fixture URL |
| FCC Arquivo Antigo | `https://www.fcc.org.br/concursos/arquivo-antigo/` | Fixture path; broken `[object Object]` links |
| Correios Concursos Edital | `https://www.correios.com.br/.../edital.pdf` | Fixture PDF; browser chrome produced many false exams |

### Intentionally **not** registered

| URL | Reason |
| --- | --- |
| `https://portal.exemplo.gov.br/concursos/1` | Test-only |
| `https://www.example.org/concursos` | Test-only |

---

## What works end-to-end

1. **Admin source upsert** — `POST /admin/sources` with cookie JWT (`root@quizzeira.local`).
2. **Force crawl** — `POST /admin/crawl/force` → crawler consume on next tick.
3. **Transpetro 2026** — status `open`, listing `https://www.cesgranrio.org.br/concurso/transpetro-2026/`, exposed on study `GET /exams` with `bankReady: true` and published questions.
4. **Content pipeline** (with public Gemini):
   - Extraction imports artifacts / drafts MCQs
   - Embeddings via `gemini-embedding-001` (legacy `text-embedding-004` 404 on this AI Studio project)
   - Quality gate can publish extraction without LLM judge (`CONTENT_QUALITY_PUBLISH_EXTRACTION_WITHOUT_JUDGE`)
5. **Headroom opt-out** — `LLM_USE_HEADROOM=false` so workers hit `generativelanguage.googleapis.com` instead of broken host/proxy paths.

## What does not work / limitations

1. **Listing HTML noise** — Banca/org pages emit nav, privacy, cultural, and institutional links. Mitigations added (junk title/URL filters, PDF-as-single-listing, admin closes). Residual unknowns remain until patterns are tuned per domain.
2. **Empty `linkPatterns` = keep everything** — Fixture archaeology sources with empty patterns flooded the exam table; those sources are disabled.
3. **Open-exam unique collisions (fixed in code)** — Upsert by title-derived `id` hit Prisma `P2002` on `(examSlug, listingUrl)` when the same listing was rediscovered with different anchor text (seen on Transpetro org pages). Fixed to upsert on `examSlug_listingUrl`.
4. **Direct Cesgranrio Transpetro edital PDF** — Path may 404 or lack HTML listing; pipeline now stores PDF start URLs as a single exam/artifact instead of scraping error chrome.
5. **Headroom inside Compose** — Still unsuitable for Quizzeira workers (localhost bind / 401). Documented in infra `docs/quizzeira-headroom.md`.
6. **Study catalog routes** — `/study/catalog` etc. 404; study surface uses `/exams`.
7. **Correios / Evento / Arquivo Antigo fixtures** — Not production discovery sources; disabled after registration for completeness of the archaeology list.

## Crawl snapshots (local)

| Pass | Status | Sources OK | Open discovered | Artifacts | Notes |
| --- | --- | --- | --- | --- | --- |
| First full registry | ok | 16 | 70 | 32 | High noise; many false exams |
| After disable + junk close | partial→ok | 6–9 | 2–16 | 3–17 | Transpetro retained |
| Targeted Transpetro force | ok | (single) | — | — | After upsert fix |

## Code / config changes tied to this work

**Quizzeira**

- Discovery: junk listing filters; PDF start-URL handling; open-exam upsert on natural unique key; admin force-crawl bypass / listing HTML artifact behavior (prior session + this pass)
- Content: plain-text extraction fix; Gemini embed header auth; embedding model default `gemini-embedding-001`; quality publish-without-judge for extraction
- Worker-kit: `LLM_USE_HEADROOM` bypass
- Compose: Headroom opt-out on workers; higher crawler budgets; embedding model env

**Infra**

- Document that Quizzeira Compose skips Headroom; OPERATIONS / README / Headroom compose notes

## Follow-ups (not done here)

- Per-banca Playwright selectors (FCC / Cebraspe / FGV) instead of generic `<a href>` harvest
- Persist archaeology sources as a checked-in seed JSON (optional) rather than only runtime admin upserts
- Rotate the Gemini API key that was pasted in chat
- Wire Headroom for Compose only if a Docker-reachable, auth-compatible proxy is required later
