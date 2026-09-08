import type { CrawlerSource } from "@quizzeira/shared";

/**
 * Starter Brazilian public-exam sources — official listing portals only.
 *
 * Hard technical exception: `linkPatterns` / startUrls may include the Portuguese
 * word "concurso(s)" because those hosts and hrefs literally use it. Identifiers
 * and product labels stay English (`exam*`).
 */
export const STARTER_CRAWLER_SOURCES: Array<
  Pick<CrawlerSource, "domain" | "name" | "startUrls" | "strategy" | "trust"> &
    Partial<CrawlerSource>
> = [
  {
    domain: "pciconcursos.com.br",
    name: "PCI Concursos — past exams & listings",
    startUrls: [
      "https://www.pciconcursos.com.br/provas/",
      "https://www.pciconcursos.com.br/",
    ],
    strategy: "listing-links",
    trust: "high",
    linkPatterns: [
      "prova",
      "provas",
      "concurso",
      "edital",
      "download",
      "gabarito",
      "organizadora",
      "cargo",
    ],
    openPatterns: [
      "inscri",
      "aberto",
      "edital",
      "vagas",
      "prova",
      "download",
    ],
    politenessMs: 2000,
    notes:
      "Major Brazilian hub for past exam PDFs + open-exam news (https://www.pciconcursos.com.br/provas/). Primary feeder for question bank enrichment.",
  },
  {
    domain: "cesgranrio.org.br",
    name: "Cesgranrio listings",
    startUrls: ["https://www.cesgranrio.org.br/concursos/"],
    strategy: "banca-portal",
    trust: "high",
    linkPatterns: ["concurso", "edital", "evento", "inscri"],
    openPatterns: ["inscri", "aberto", "em andamento", "edital"],
    politenessMs: 2000,
    notes: "Official banca portal — public exam listings",
  },
  {
    domain: "fcc.org.br",
    name: "FCC listings",
    startUrls: ["https://www.fcc.org.br/concursos/"],
    strategy: "banca-portal",
    trust: "high",
    linkPatterns: ["concurso", "edital", "inscri"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2000,
    notes: "Official banca portal",
  },
  {
    domain: "cebraspe.org.br",
    name: "Cebraspe listings",
    startUrls: ["https://www.cebraspe.org.br/concursos/"],
    strategy: "banca-portal",
    trust: "high",
    linkPatterns: ["concurso", "edital", "inscri"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2000,
  },
  {
    domain: "fgv.br",
    name: "FGV listings",
    startUrls: ["https://conhecimento.fgv.br/concursos"],
    strategy: "banca-portal",
    trust: "high",
    linkPatterns: ["concurso", "edital", "selecao"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2000,
  },
  {
    domain: "ibamsp-concursos.org.br",
    name: "IBAMSP listings",
    startUrls: ["https://www.ibamsp-concursos.org.br/informacoes/179/"],
    strategy: "listing-links",
    trust: "high",
    linkPatterns: ["concurso", "edital", "inscri", "informacoes", "processo"],
    openPatterns: ["inscri", "aberto", "edital", "em andamento"],
    politenessMs: 2000,
    notes: "IBAMSP public exam information hub",
  },
  {
    domain: "petrobras.com.br",
    name: "Petrobras selections",
    startUrls: ["https://transparencia.petrobras.com.br/licitacoes-contratos"],
    strategy: "listing-links",
    trust: "high",
    linkPatterns: ["concurso", "processo seletivo", "psp", "edital"],
    openPatterns: ["inscri", "edital", "aberto", "psp"],
    politenessMs: 2500,
    notes: "Corporate transparency / selection pages — verify URL drift over time",
  },
  {
    domain: "transpetro.com.br",
    name: "Transpetro selections",
    startUrls: ["https://transpetro.com.br/"],
    strategy: "listing-links",
    trust: "high",
    linkPatterns: ["concurso", "processo seletivo", "psp", "edital", "selecao"],
    openPatterns: ["inscri", "edital", "aberto", "psp"],
    politenessMs: 2500,
  },
  {
    domain: "correios.com.br",
    name: "Correios careers / selections",
    startUrls: ["https://www.correios.com.br/"],
    strategy: "listing-links",
    trust: "medium",
    linkPatterns: ["concurso", "processo seletivo", "edital", "carreira", "vaga"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2500,
    notes: "Org site — listings often linked from news/careers; URL drift expected",
  },
  {
    domain: "marinha.mil.br",
    name: "Marinha selections",
    startUrls: ["https://www.marinha.mil.br/"],
    strategy: "listing-links",
    trust: "medium",
    linkPatterns: ["concurso", "processo seletivo", "edital", "oficial", "temporario", "ot"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2500,
    notes: "Includes oficial temporário (OT) and related selection notices",
  },
  {
    domain: "bb.com.br",
    name: "Banco do Brasil careers",
    startUrls: ["https://www.bb.com.br/"],
    strategy: "listing-links",
    trust: "medium",
    linkPatterns: ["concurso", "processo seletivo", "edital", "carreira", "escritur"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2500,
  },
  {
    domain: "caixa.gov.br",
    name: "Caixa Econômica careers",
    startUrls: ["https://www.caixa.gov.br/"],
    strategy: "listing-links",
    trust: "medium",
    linkPatterns: ["concurso", "processo seletivo", "edital", "carreira", "tecnico"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2500,
  },
  {
    domain: "gov.br",
    name: "Gov.br public exams hub",
    startUrls: ["https://www.gov.br/pt-br/categorias/trabalho-e-previdencia/trabalho/concursos"],
    strategy: "listing-links",
    trust: "medium",
    linkPatterns: ["concurso", "edital", "selecao", "processo-seletivo"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2000,
    notes: "Hub that often links to org-specific pages; outbound domains may be proposed",
  },
];

/** Org / search seeds for discovery + past-exam enrichment (English keys, PT query text). */
export interface DiscoveryOrgSeed {
  examSlug: string;
  org: string;
  title: string;
  emphasis: string[];
  /** Portuguese search phrases — Firecrawl / listing discovery use these literally. */
  searchQueries: string[];
}

export const STARTER_DISCOVERY_ORGS: DiscoveryOrgSeed[] = [
  {
    examSlug: "banco-do-brasil",
    org: "Banco do Brasil",
    title: "Banco do Brasil — open exam",
    emphasis: ["Conhecimentos bancários", "Português", "Raciocínio lógico"],
    searchQueries: [
      "Banco do Brasil concurso edital aberto",
      "BB escriturário prova anterior PDF",
    ],
  },
  {
    examSlug: "caixa-economica",
    org: "Caixa Econômica Federal",
    title: "Caixa Econômica Federal — open exam",
    emphasis: ["Atendimento", "Conhecimentos bancários"],
    searchQueries: [
      "Caixa Econômica concurso edital aberto",
      "Caixa técnico bancário prova anterior PDF",
    ],
  },
  {
    examSlug: "correios",
    org: "Correios",
    title: "Correios — open exam",
    emphasis: ["Conhecimentos gerais", "Português"],
    searchQueries: ["Correios concurso edital aberto", "Correios prova anterior PDF"],
  },
  {
    examSlug: "marinha-oficial-temporario",
    org: "Marinha do Brasil",
    title: "Marinha — Oficial Temporário (OT)",
    emphasis: ["Conhecimentos navais", "Português"],
    searchQueries: [
      "Marinha oficial temporário edital aberto",
      "Marinha OT concurso prova anterior PDF",
    ],
  },
  {
    examSlug: "transpetro",
    org: "Transpetro",
    title: "Transpetro — public selection",
    emphasis: ["Administração", "Engenharia"],
    searchQueries: ["Transpetro concurso edital aberto", "Transpetro Cesgranrio prova anterior"],
  },
  {
    examSlug: "inss",
    org: "INSS",
    title: "INSS — open exam",
    emphasis: ["Direito previdenciário", "Português"],
    searchQueries: ["INSS concurso edital aberto", "INSS prova anterior PDF"],
  },
  {
    examSlug: "receita-federal",
    org: "Receita Federal",
    title: "Receita Federal — open exam",
    emphasis: ["Direito tributário", "Contabilidade"],
    searchQueries: [
      "Receita Federal concurso edital aberto",
      "Auditor Fiscal prova anterior PDF",
    ],
  },
  {
    examSlug: "policia-federal",
    org: "Polícia Federal",
    title: "Polícia Federal — open exam",
    emphasis: ["Direito", "Raciocínio lógico"],
    searchQueries: [
      "Polícia Federal concurso edital aberto",
      "PF agente prova anterior PDF",
    ],
  },
  {
    examSlug: "prefeituras",
    org: "Prefeituras",
    title: "Municipal exams (prefeituras) — generic seed",
    emphasis: ["Português", "Informática", "Legislação municipal"],
    searchQueries: [
      "prefeitura concurso edital aberto",
      "concurso municipal prova anterior PDF",
      "site:pciconcursos.com.br prefeitura prova",
    ],
  },
];

/** Prefer this aggregator when enriching past exams into the bank. */
export const PAST_EXAM_HUB_URL = "https://www.pciconcursos.com.br/provas/";
