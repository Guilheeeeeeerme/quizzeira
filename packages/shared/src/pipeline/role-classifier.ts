// Concept: Document-role classification (§14) — Tier 0 provenance hints and
// Tier 1 lexical rules. Tier 2 (centroid) and Tier 3 (LLM) are wired by the
// worker only when this function returns `unknown` or a low confidence.
import type { Block, NormalizedDocument } from "./normalized-document";
import type { ArtifactKindHint, DocumentRole, RoleHint } from "./roles";
import { countMatches, orderedOptionMarkers, words } from "../curriculum/text-stats";

export interface RoleClassificationInput {
  filename?: string | null;
  anchorLabel?: string | null;
  url?: string | null;
  /** First ~600 chars of the body. */
  titleBlock: string;
  headings: readonly string[];
  blocks: readonly Block[];
  linkDensity: number;
  /** Tier 0 hints carried from the crawler. */
  sourceKind?: string | null;
  discoveryMode?: string | null;
  roleHint?: RoleHint | string | null;
  kindHint?: ArtifactKindHint | string | null;
  adminRole?: DocumentRole | null;
}

export interface RoleClassification {
  role: DocumentRole;
  subtype: string | null;
  confidence: number;
  method: "provenance" | "lexical" | "centroid" | "llm" | "admin" | "none";
  votes: Record<DocumentRole, number>;
  signals: string[];
}

export const ROLE_MARGIN = 0.3;
export const ROLE_CONFIDENCE_MIN = 0.75;
const STRONG = 0.5;
const BODY = 0.3;

const SPEC_STRONG = [
  /\bedital\b.*\b(abertura|n[ºo°.]?\s*\d+)/i,
  /conte[úu]do\s+program[áa]tico/i,
  /\banexo\b.*\b(programa|conte[úu]do)/i,
  /\bretifica[çc][ãa]o\b/i,
  /\bedital\b/i,
];
const SPEC_BODY = [
  /das\s+inscri[çc][õo]es/i,
  /das\s+vagas/i,
  /da\s+remunera[çc][ãa]o/i,
  /das\s+provas/i,
  /dos\s+recursos/i,
  /das\s+disposi[çc][õo]es\s+finais/i,
  /cronograma/i,
];
const EVID_STRONG = [
  /\bcaderno\b/i,
  /\bprova\s+(objetiva|discursiva|tipo|branca|azul|amarela|verde)\b/i,
  /\bgabarito\b/i,
  /padr[ãa]o\s+de\s+respostas?/i,
];
const KNOW_STRONG = [
  /\bapostila\b/i,
  /\bcap[íi]tulo\s+\d+/i,
  /\bexerc[íi]cios?\b/i,
  /\bresumo\b/i,
  /\bdefini[çc][ãa]o\b/i,
  /\blei\s+n[ºo°.]?\s*\d/i,
  /\bdecreto\b/i,
  /\bmanual\b/i,
  /\bgram[áa]tica\b/i,
];
const ADMIN_STRONG = [
  /inscri[çc][ãa]o\s+(online|aqui)/i,
  /\bboleto\b/i,
  /\bcart[ãa]o\s+de\s+confirma[çc][ãa]o/i,
  /\bresultado\s+(final|preliminar)/i,
  /\bconvoca[çc][ãa]o\b/i,
  /\bperguntas\s+frequentes\b/i,
  /\bnot[íi]cias?\b/i,
  /inscri[çc][õo]es\s+abertas/i,
  /\bconcursos\s+(abertos|em\s+andamento|previstos)\b/i,
];

function has(patterns: RegExp[], text: string): number {
  return patterns.filter((re) => re.test(text)).length;
}

function subtypeFor(role: DocumentRole, evidence: string, kindHint: string | null | undefined): string | null {
  const text = evidence.toLowerCase();
  if (role === "specification") {
    if (/retifica/.test(text) || kindHint === "retificacao") return "edital_retificacao";
    // A full edital usually carries the programa as an annex; the annex is a
    // subtype only when the document is *just* the annex.
    if (/\bedital\b/.test(text) && /abertura|n[ºo°.]?\s*\d{1,4}\s*\/\s*20\d{2}/.test(text)) return "edital_abertura";
    if (/anexo/.test(text) && /program/.test(text)) return "conteudo_programatico_anexo";
    if (kindHint === "programa") return "programa_oficial";
    return "edital_abertura";
  }
  if (role === "evidence") {
    if (/padr[ãa]o\s+de\s+resposta/.test(text) || kindHint === "padrao_resposta") return "padrao_resposta";
    if (/gabarito\s+definitivo/.test(text)) return "gabarito_definitivo";
    if (/gabarito/.test(text) || kindHint === "gabarito") return "gabarito_preliminar";
    if (/discursiva/.test(text)) return "prova_discursiva";
    return "prova_objetiva";
  }
  if (role === "knowledge") {
    // planalto.gov.br paths (/lei/l14133.htm, /decreto/d9203.htm) are the
    // most reliable signal; a law's body mentions decretos constantly.
    if (kindHint === "lei" || /\/leis?\/|\blei\s+(?:complementar\s+)?n/.test(text)) return "lei";
    if (/\/decretos?\/|\bdecreto(?:-lei)?\s+n/.test(text)) return "decreto";
    if (/s[úu]mula/.test(text)) return "sumula";
    if (kindHint === "manual" || /manual/.test(text)) return "manual";
    if (kindHint === "apostila" || /apostila/.test(text)) return "apostila";
    if (/cap[íi]tulo/.test(text)) return "livro_capitulo";
    if (/resumo/.test(text)) return "resumo";
    return "artigo_educacional";
  }
  if (role === "administrative") {
    if (kindHint === "listing" || /concursos\s+(abertos|em\s+andamento)/.test(text)) return "listagem";
    if (/inscri/.test(text)) return "inscricao";
    if (/cronograma/.test(text)) return "cronograma";
    if (/resultado/.test(text)) return "resultado";
    if (/convoca/.test(text)) return "convocacao";
    if (/perguntas\s+frequentes|faq/.test(text)) return "faq";
    return "noticia";
  }
  return null;
}

export function classifyDocumentRole(input: RoleClassificationInput): RoleClassification {
  const votes: Record<DocumentRole, number> = {
    specification: 0,
    evidence: 0,
    knowledge: 0,
    administrative: 0,
    mixed: 0,
    unknown: 0,
  };
  const signals: string[] = [];

  // ── Tier 0: provenance ────────────────────────────────────────────────────
  if (input.adminRole && input.adminRole !== "unknown") {
    return {
      role: input.adminRole,
      subtype: subtypeFor(input.adminRole, input.titleBlock, input.kindHint),
      confidence: 1,
      method: "admin",
      votes,
      signals: ["admin_role"],
    };
  }
  const sourceKind = input.sourceKind ?? null;
  if (sourceKind === "legislation") {
    votes.knowledge += 0.95;
    signals.push("source_legislation");
  } else if (sourceKind === "standards_body" || sourceKind === "open_textbook") {
    votes.knowledge += 0.7;
    signals.push("source_knowledge");
  } else if (sourceKind === "educational_site") {
    votes.knowledge += 0.5;
    signals.push("source_educational");
  } else if (sourceKind === "official_gazette") {
    votes.specification += 0.6;
    signals.push("source_gazette");
  }
  if (input.discoveryMode === "topic_query") {
    votes.knowledge += 0.6;
    signals.push("topic_query_prior");
  }
  switch (input.roleHint) {
    case "specification":
      votes.specification += 0.4;
      break;
    case "evidence":
      votes.evidence += 0.4;
      break;
    case "knowledge":
      votes.knowledge += 0.3;
      break;
    case "administrative":
      votes.administrative += 0.5;
      break;
    default:
      break;
  }

  // ── Tier 1: lexical ───────────────────────────────────────────────────────
  const label = [input.filename ?? "", input.anchorLabel ?? "", decodeURIComponent(input.url ?? "")].join(" ");
  const title = input.titleBlock.slice(0, 600);
  const headings = input.headings.join("\n");
  const labelAndTitle = `${label}\n${title}\n${headings}`;
  const body = input.blocks.map((b) => b.text).join("\n");

  const specStrong = has(SPEC_STRONG, labelAndTitle);
  const specBody = has(SPEC_BODY, `${headings}\n${body.slice(0, 20000)}`);
  const evidStrong = has(EVID_STRONG, labelAndTitle) + (countMatches(/\bquest[ãa]o\s+\d+\b/gi, body) >= 10 ? 1 : 0);
  const evidBody = orderedOptionMarkers(body) >= 2 ? 1 : 0;
  const knowStrong =
    has(KNOW_STRONG, labelAndTitle) +
    (countMatches(/\bart\.\s*\d+/gi, body) >= 5 ? 1 : 0) +
    (countMatches(/\bexemplo\s*:/gi, body) >= 3 ? 1 : 0);
  const adminStrong = has(ADMIN_STRONG, labelAndTitle);

  const paragraphs = input.blocks.filter((b) => b.type === "paragraph");
  const listItems = input.blocks.filter((b) => b.type === "list_item");
  const headingsCount = input.blocks.filter((b) => b.type === "heading").length;
  const total = Math.max(1, input.blocks.length);
  const paragraphShare = paragraphs.length / total;
  const headingShare = headingsCount / total;
  const avgParagraph = paragraphs.length
    ? paragraphs.reduce((s, b) => s + b.text.length, 0) / paragraphs.length
    : 0;
  const shortLinkItems = listItems.filter((b) => b.text.length < 80 && (b.linkChars ?? 0) > 0).length;
  const knowBody =
    paragraphShare >= 0.6 && headingShare >= 0.02 && headingShare <= 0.2 && input.linkDensity < 0.1 && avgParagraph >= 300
      ? 1
      : 0;
  const adminBody =
    input.linkDensity > 0.3 || (avgParagraph > 0 && avgParagraph < 120 && paragraphs.length >= 3) || shortLinkItems / total >= 0.4
      ? 1
      : 0;

  if (specStrong) {
    votes.specification += STRONG * Math.min(2, specStrong) * 0.75;
    signals.push(`spec_strong:${specStrong}`);
  }
  if (specBody >= 3) {
    votes.specification += BODY;
    signals.push(`spec_body:${specBody}`);
  }
  if (evidStrong) {
    votes.evidence += STRONG * Math.min(2, evidStrong) * 0.75;
    signals.push(`evid_strong:${evidStrong}`);
  }
  if (evidBody) {
    votes.evidence += BODY;
    signals.push("evid_body");
  }
  if (knowStrong) {
    votes.knowledge += STRONG * Math.min(2, knowStrong) * 0.75;
    signals.push(`know_strong:${knowStrong}`);
  }
  if (knowBody) {
    votes.knowledge += BODY;
    signals.push("know_body");
  }
  if (adminStrong) {
    votes.administrative += STRONG * Math.min(2, adminStrong) * 0.75;
    signals.push(`admin_strong:${adminStrong}`);
  }
  if (adminBody) {
    votes.administrative += BODY;
    signals.push("admin_body");
  }
  // An edital body that also carries question blocks is mixed.
  if (specStrong && evidStrong && evidBody) {
    votes.mixed += 0.9;
    signals.push("mixed_spec_evidence");
  }
  // Listing pages: tiny body, many links, admin vocabulary.
  if (input.linkDensity > 0.5 && words(body).length < 600) {
    votes.administrative += 0.3;
    signals.push("listing_shape");
  }

  const ranked = (Object.entries(votes) as Array<[DocumentRole, number]>)
    .filter(([role]) => role !== "unknown")
    .sort((a, b) => b[1] - a[1]);
  const [topRole, topScore] = ranked[0];
  const second = ranked[1]?.[1] ?? 0;
  const confidence = Number(Math.min(1, topScore).toFixed(3));
  const margin = topScore - second;
  const method: RoleClassification["method"] =
    signals.some((s) => s.startsWith("source_") || s === "topic_query_prior") && !signals.some((s) => /_strong|_body/.test(s))
      ? "provenance"
      : "lexical";

  if (topScore === 0 || margin < ROLE_MARGIN) {
    return { role: "unknown", subtype: null, confidence, method: "none", votes, signals };
  }
  return {
    role: topRole,
    subtype: subtypeFor(topRole, labelAndTitle, input.kindHint),
    confidence,
    method,
    votes,
    signals,
  };
}

export function roleInputFromNormalized(
  doc: NormalizedDocument,
  hints: Pick<RoleClassificationInput, "filename" | "anchorLabel" | "url" | "sourceKind" | "discoveryMode" | "roleHint" | "kindHint" | "adminRole"> = {},
): RoleClassificationInput {
  const blocks = doc.blocks.filter((b) => !b.flags?.length);
  const titleBlock = [doc.metadata.title ?? "", ...blocks.slice(0, 6).map((b) => b.text)].join("\n").slice(0, 600);
  return {
    ...hints,
    url: hints.url ?? doc.source.url,
    titleBlock,
    headings: doc.sections.map((s) => s.heading ?? "").filter(Boolean).slice(0, 40),
    blocks,
    linkDensity: doc.stats.linkDensity,
  };
}
