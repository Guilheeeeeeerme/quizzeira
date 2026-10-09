-- Heal / promote Discovery Sources for self-sustaining P0 coverage.
-- Run as role `quizzeira` (owns quizzeira_discovery), e.g. via Supabase tunnel:
--   bash ../infra/scripts/supabase_dev_tunnel.sh -f
--   psql "$DISCOVERY_DATABASE_DIRECT_URL" -f scripts/heal-discovery-sources.sql
-- Do NOT invent OAB 48º fgvKey here.

BEGIN;

-- 1) Heal core P0 portals (DB blips / stale broken flags) + fix kinds
UPDATE quizzeira_discovery."Source"
SET status = 'active',
    enabled = true,
    "failCount" = 0,
    "lastError" = NULL,
    kind = CASE id
      WHEN '60998d7a5171e5aa523bf2a9' THEN 'banca_portal'::quizzeira_discovery."SourceKind"
      WHEN 'f8aa1aaf099a61d8cf1ac50f' THEN 'banca_portal'::quizzeira_discovery."SourceKind"
      WHEN 'b7fcbf32e44d651900b208c1' THEN 'banca_portal'::quizzeira_discovery."SourceKind"
      WHEN 'oab-fgv' THEN 'exam_specific'::quizzeira_discovery."SourceKind"
      ELSE kind
    END,
    "updatedAt" = NOW()
WHERE id IN (
  '60998d7a5171e5aa523bf2a9',
  'f8aa1aaf099a61d8cf1ac50f',
  'b7fcbf32e44d651900b208c1',
  'oab-fgv'
);

-- 2) Retarget FCC to official concursosfcc.com.br
UPDATE quizzeira_discovery."Source"
SET domain = 'concursosfcc.com.br',
    name = 'FCC Concursos',
    "startUrls" = '["https://www.concursosfcc.com.br/"]'::jsonb,
    kind = 'banca_portal'::quizzeira_discovery."SourceKind",
    status = 'active',
    enabled = true,
    "failCount" = 0,
    "lastError" = NULL,
    notes = 'Official FCC portal. Open editais/gabaritos only.',
    "updatedAt" = NOW()
WHERE id = '56bdcf29a57e83feba1033f4';

-- 3) Disable commercial / flaky non-P0 listing shells
UPDATE quizzeira_discovery."Source"
SET enabled = false,
    status = 'broken',
    notes = COALESCE(notes || ' | ', '') || 'disabled 2026-10: commercial or flaky non-P0',
    "updatedAt" = NOW()
WHERE id IN (
  '8fe97287c2c7e9faf12dc815',  -- PCI Concursos (do-not-scrape)
  'a1ff0dfe428964fcfdbb0383',  -- Correios flaky
  '97aa39f5aa65585d075e4f15',  -- Transpetro flaky
  'bff29a2d84187c034a29c977',  -- IBAMSP flaky
  '7b90a6ef37af2ee42d174e60'   -- generic gov.br concursos (bad URL)
);

-- 4) Knowledge topic shell: drop Firecrawl domain label
UPDATE quizzeira_discovery."Source"
SET domain = 'knowledge.allowlist',
    name = 'Knowledge allowlist search',
    kind = 'educational_site'::quizzeira_discovery."SourceKind",
    "discoveryMode" = 'topic_query'::quizzeira_discovery."DiscoveryMode",
    status = 'active',
    enabled = true,
    notes = 'topic_query shell — allowlist / SEARCH_API_* / fixture only; Firecrawl not in product stack',
    "updatedAt" = NOW()
WHERE id = 'knowledge-topic-search';

-- 5) Insert missing P0 Sources (idempotent)
INSERT INTO quizzeira_discovery."Source" (
  id, domain, name, "startUrls", strategy, kind, "discoveryMode",
  "allowedRoles", "linkPatterns", "openPatterns", trust, status, enabled,
  "intervalSec", "politenessMs", "failCount", notes, "createdAt", "updatedAt"
) VALUES
(
  '7e95d4f2e48733a730d9a6c2', 'vunesp.com.br', 'Vunesp',
  '["https://www.vunesp.com.br/"]'::jsonb, 'listing_links', 'banca_portal', 'listing',
  '[]'::jsonb, '["concurso|edital|prova|gabarito"]'::jsonb, '[]'::jsonb,
  'medium', 'active', true, 1800, 1000, 0,
  'source-scout:vunesp; P0 banca', NOW(), NOW()
),
(
  'af789e187b86faf6b2f21c99', 'planalto.gov.br', 'Planalto Legislação',
  '["https://www.planalto.gov.br/ccivil_03/"]'::jsonb, 'listing_links', 'legislation', 'direct',
  '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
  'high', 'active', true, 3600, 1000, 0,
  'source-scout:planalto-legislacao; P0 knowledge', NOW(), NOW()
),
(
  'c32a8b73166dd69d657d1927', 'gov.br', 'ENARE Residência',
  '["https://www.gov.br/hubrasil/pt-br/ensino-e-pesquisa/exame-nacional-de-residencia-enare/edicoes-anteriores"]'::jsonb,
  'listing_links', 'org_portal', 'listing',
  '[]'::jsonb, '["edital|prova|gabarito|residencia|enare"]'::jsonb, '[]'::jsonb,
  'high', 'active', true, 1800, 1000, 0,
  'source-scout:enare-hubrasil; P0 residencia', NOW(), NOW()
),
(
  '871853bc1760cd6b6afb4412', 'gov.br', 'ENAMED INEP',
  '["https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos"]'::jsonb,
  'listing_links', 'org_portal', 'listing',
  '[]'::jsonb, '["prova|gabarito|enamed|revalida"]'::jsonb, '[]'::jsonb,
  'high', 'active', true, 1800, 1000, 0,
  'source-scout:enamed-inep; P0 residencia', NOW(), NOW()
),
(
  'dbf5b1e8cf27b18cbb85d6cd', 'examedeordem.oab.org.br', 'OAB CFOAB Editais',
  '["https://examedeordem.oab.org.br/EditaisProvas?NumeroExame=0"]'::jsonb,
  'listing_links', 'exam_specific', 'listing',
  '[]'::jsonb, '["edital|prova|gabarito|oab"]'::jsonb, '[]'::jsonb,
  'high', 'active', true, 1800, 1000, 0,
  'source-scout:oab-cfoab-editais; P0 oab mirror', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  domain = EXCLUDED.domain,
  name = EXCLUDED.name,
  "startUrls" = EXCLUDED."startUrls",
  kind = EXCLUDED.kind,
  "discoveryMode" = EXCLUDED."discoveryMode",
  status = 'active',
  enabled = true,
  "failCount" = 0,
  "lastError" = NULL,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

COMMIT;

SELECT status, enabled, kind, count(*)::int AS n
FROM quizzeira_discovery."Source"
GROUP BY 1, 2, 3
ORDER BY n DESC;
