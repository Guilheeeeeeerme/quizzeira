# Self-sustaining Discovery — architecture & LLM routing

How Quizzeira keeps a clean, expanding base of Brazilian public exams and
knowledge without question-bank seeds. Complements
[`crawler-redesign-spec.md`](./crawler-redesign-spec.md) and
[`llm-ownership.md`](./llm-ownership.md).

## Loop (eternal)

```
catalog / scout → SourceCandidate → admin promote Source
       ↓
listing / oab_fgv / direct crawl → Exam + Artifacts (edital, prova, gabarito)
       ↓
content import → classify → syllabus / evidence / knowledge
       ↓
coverage planner → TopicQuery → allowlisted knowledge fetch
       ↓
KU distill → generation → Eval gate → Study sampling
       ↑                                         │
legislation freshness ───────────────────────────┘
portal monitor heals broken Sources
lifecycle archives past-year noise
```

## Microservices (new + existing)

| Service | Plane | Role | LLM |
| --- | --- | --- | --- |
| `discovery-api` | Discovery | Source/Exam/Artifact/TopicQuery ownership | none |
| `discovery-crawler` | Discovery | Listing / OAB / topic / direct fetch | none |
| `discovery-lifecycle` | Discovery | OPEN/CLOSED + calendar GC | none |
| `discovery-social-scout` | Discovery | Social → outbound file candidates only | none |
| **`discovery-source-scout`** | Discovery | Curated official catalog → SourceCandidate | **none** |
| **`discovery-portal-monitor`** | Discovery | Probe Sources, health, force-crawl recovery | **none** |
| `content-api` | Content | Documents, jobs, bank, freshness watches | none |
| `content-worker` | Content | Normalize → classify → syllabus → KU → gen | Gemini + JEV |
| `content-quality` | Content | Structural + judge + publish gate | JEV (+ Gemini if mode off) |
| **`content-freshness`** | Content | Legislation URL fingerprints → requeue | **none** |
| `doc-processor` | Content | PDF/HTML normalize | none |
| `quiz-corrector` | Study | Grade answers | Gemini |
| Study `api` / `web` | Study | Sampling only | none |

## JEV vs Gemini matrix (full pipeline)

| Stage | Owner | Notes |
| --- | --- | --- |
| Source scout / portal probe / robots | Code | No LLM |
| Listing crawl, artifact store | Code | No LLM |
| Topic search | allowlist / `SEARCH_API_*` / fixture | Firecrawl **not** in product stack |
| Doc normalize / sectioning | Code (+ doc-processor) | |
| Classify T0–T2 | Code | |
| Classify T3 residue | **JEV Choice** | `JEV_CLASSIFY_MODE` |
| Syllabus residue topics | **Gemini** | open Portuguese structure |
| Evidence parse (prova/gabarito) | Code | |
| Mapping T0–T2 | Code | |
| Mapping T3 residue | **JEV Choice** | `JEV_MAPPING_MODE` |
| KU distill | **Gemini** | |
| Question generation | **Gemini** `gemini-3.1-flash-lite` | |
| Embeddings | **Gemini** `gemini-embedding-001` | |
| Structural / relevance / grounding | Code | |
| Judge scores + `answerIndex` | **JEV Score×4 + Choice** | `JEV_JUDGE_MODE` |
| Legislation freshness detect | Code (`content-freshness`) | |
| Quiz corrector | **Gemini** | |
| Headroom | **Never** for Quizzeira workers | Argus-only |

## P0 sources to register first

See `apps/discovery-source-scout/src/catalog/sources.json`. Highlights (verified live 2026-10):

| Priority | Portal | Why |
| --- | --- | --- |
| P0 | `oab.fgv.br` + `examedeordem.oab.org.br` | Recurrent OAB PDFs |
| P0 | `cebraspe.org.br/concursos` | High-volume federal/state; CDN PDFs |
| P0 | `conhecimento.fgv.br/concursos` | Magistratura / MP / Defensoria |
| P0 | `concursosfcc.com.br` | State + residency listings (not full prova archive) |
| P0 | `vunesp.com.br` | TJSP magistratura + SP state |
| P0 | `cesgranrio.org.br` | Caixa / BB / Petrobras family |
| P0 | ENARE (`gov.br/hubrasil/.../enare`) | Residência médica official |
| P0 | ENAMED/INEP provas | Residência / Revalida-adjacent |
| P0 | `planalto.gov.br/ccivil_03` | Knowledge / amendments |

**Do not scrape:** QConcursos, TecConcursos, PCI Concursos, commercial course banks,
Scribd/PasseiDireto mirrors. FCC explicitly refuses wholesale past booklets — use
for open editais/gabaritos only.

## Operator enablement

1. Migrate content (`FreshnessWatch` migration `20261008210000_freshness_watch`
   — idempotent; may already exist from forward apply).
2. Heal Source registry as role `quizzeira`:
   `psql "$DISCOVERY_DATABASE_DIRECT_URL" -f scripts/heal-discovery-sources.sql`
   (Supabase MCP cannot UPDATE `Source`; tunnel or dashboard SQL required).
3. Enable `discovery-portal-monitor` (`DISCOVERY_PORTAL_MONITOR_ENABLED=true`)
   so future blips self-heal via `/internal/sources/:id/health` + force-crawl.
4. Enable `discovery-source-scout` (`DISCOVERY_SOURCE_SCOUT_ENABLED=true`) for
   ongoing P0 catalog → SourceCandidate intake (admin still promotes).
5. Keep one Source with `discoveryMode=topic_query` for knowledge coverage.
6. Flip `CONTENT_FRESHNESS_ENABLED=true` with dry-run first, then
   `CONTENT_FRESHNESS_DRY_RUN=false`.
7. GHCR matrix (quizzeira `.github/workflows/deploy.yml`) builds
   `discoverysourcescout`, `discoveryportalmonitor`, `contentfreshness`,
   `discoverysocial`. Dokploy compose already names them under profiles
   `discovery` / `content` / `social`.

## Local run

```bash
# APIs
docker compose up -d discovery-api content-api postgres redis

# Opt-in workers
docker compose --profile source-scout up discovery-source-scout
docker compose --profile portal-monitor up discovery-portal-monitor
docker compose --profile freshness up content-freshness

# Or npm
DISCOVERY_SOURCE_SCOUT_ENABLED=true npm run dev:discovery-source-scout
```

Tests: `npm run test:discovery` and `npm run test:content` include the new specs.
