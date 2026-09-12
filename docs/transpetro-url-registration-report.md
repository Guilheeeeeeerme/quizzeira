# Transpetro URL registration report

**Date:** 2026-09-12  
**Scope:** All non-test URLs from `concurso-transpetro-urls.txt` registered as Discovery sources, crawled, cleaned up, and exercised through Content where possible.  
**Environment:** local Docker Compose (`quizzeira`), Gemini direct (`LLM_USE_HEADROOM=false`), embedding model `gemini-embedding-001`.

## Verdict

| Area | Result |
| --- | --- |
| Source registration | **Works** — 16 archaeology URLs upserted (test-only skipped) |
| Force crawl | **Works** — FIFO queue (no longer last-write-wins); drained Cesgranrio → PCI → PDF → Transpetro → FCC → Cebraspe → FGV |
| Primary Transpetro exam | **Works** — `Transpetro 2026` / `transpetro-2026`, study `bankReady: true` (6 published) |
| Sibling Cesgranrio open | **Works** — `Caixa Econômica Federal – CAIXA-01/2025` also `bankReady: true` (5 published) |
| Past-exam extraction / embeddings / generation | **Works** with `gemini-embedding-001` + generation slug priority |
| Broad banca listings | **Partial** — PCI/FCC/Cebraspe/FGV crawl OK with patterns; low Transpetro-specific signal |
| Fixture archaeology paths | **Disabled** (9 sources) |

---

## Fine-tune pass (2026-09-12 late)

### Enabled sources (7)

| Source | Patterns / notes | Crawl result |
| --- | --- | --- |
| Cesgranrio Concursos | ranking + recent `/concurso/` open | **Primary** — Transpetro 2026 + Caixa open + artifacts |
| PCI Concursos Provas | `link/openPatterns` concurso/prova/edital | OK, fingerprint skip after first |
| Cesgranrio Transpetro PSP Terra Edital | PDF-as-single-listing | OK (1 open) |
| Transpetro Selections | retargeted to `…/carreiras/concursos.htm` | OK, low new opens |
| FCC / Cebraspe / FGV | concurso/edital/prova patterns | OK, weak Transpetro signal |

### Disabled (9)

PCI Home, IBAMSP, GovBR, BB/Caixa/Evento fixtures, FCC Arquivo Antigo, Correios PDF.

### Study catalog (end state)

| Exam | Slug | Published | bankReady |
| --- | --- | --- | --- |
| Transpetro 2026 | `transpetro-2026` | 6 | **true** |
| Caixa Econômica Federal – CAIXA-01/2025 | `caixa-economica-federal-caixa-01-2025` | 5 | **true** |

### Fixes landed this fine-tune

| Fix | Why |
| --- | --- |
| `concursoPathSlug` / title-based slug (not org-only) | Nav pages were collapsing to `examSlug=transpetro` and poisoning the bank |
| Artifacts only for `status=open` | Stopped feeding Content `certificacao` / `voltar-para-home` junk |
| Generation queue slug priority + junk denylist | Prefer year/concurso slugs over nav chrome |
| Force-crawl **FIFO queue** | Multiple “Crawl now” no longer overwrite each other |
| Quarantine junk Content documents | Cleared pending/extracted nav docs |
| HITL publish 2 Transpetro `needs_review` | Crossed `BANK_READY_THRESHOLD=5` |
| (earlier) rate-limit / db push / ranking / embed model / browser-closed health | See prior resume section |

---

## URL inventory

### Registered and kept **enabled**

| Source | URL | Useful signal |
| --- | --- | --- |
| Cesgranrio Concursos | `https://www.cesgranrio.org.br/concursos/` | **Yes** — `Transpetro 2026` |
| Cesgranrio Transpetro PSP Terra Edital | `…/transpetro-psp-terra/edital.pdf` | Partial |
| PCI Concursos Provas | `https://www.pciconcursos.com.br/provas/` | Partial |
| FCC Concursos | `https://www.fcc.org.br/concursos/` | Weak |
| Cebraspe Concursos | `https://www.cebraspe.org.br/concursos/` | Weak |
| FGV Conhecimento | `https://conhecimento.fgv.br/concursos` | Weak |
| Transpetro Selections | `https://transpetro.com.br/…/carreiras/concursos.htm` | Org careers |

### Registered then **disabled**

PCI Home, IBAMSP 179, GovBR Trabalho, Cesgranrio BB/Caixa/Evento fixtures, FCC Arquivo Antigo, Correios Edital PDF.

### Intentionally **not** registered

`portal.exemplo.gov.br`, `example.org` (test-only).

---

## What works end-to-end

1. Admin source upsert + enable/disable + pattern tuning  
2. Force crawl queue → one source per crawler tick  
3. Cesgranrio discovery → open exams with path slugs  
4. Content extract → embed (`gemini-embedding-001`) → generate → Eval (+ HITL)  
5. Study `GET /exams` with `bankReady` for Transpetro 2026  

## Limitations

1. Broad bancas still need per-domain selectors for high precision  
2. Eval fail rate on generated items is still high — HITL / judge quality remains a bottleneck  
3. Local crawler interval was temporarily 45s for drain; compose default remains 30 min  
4. MinIO Docker Hub pull may still need Quay retag after prune  

## Follow-ups

- Per-banca Playwright selectors  
- Optional seed JSON for archaeology sources  
- Wake-on-force without depending on short interval  
- Further HITL / judge tuning to raise publish rate without manual tips  
