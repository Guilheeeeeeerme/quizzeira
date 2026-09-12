// Concept: Section-role classification (§14.5). Heuristic per section; the
// document role decides what the section may feed, the section role decides
// whether it is content at all.
import type { Block, Section } from "./normalized-document";
import type { SectionRole } from "./roles";
import {
  CANDIDATE_IMPERATIVE_RE,
  DATE_RE,
  OUTLINE_MARKER_RE,
  countMatches,
  orderedOptionMarkers,
  per500,
  syllabusListShape,
  words,
} from "../curriculum/text-stats";

const SYLLABUS_HEADING_RE =
  /conte[úu]do\s+program[áa]tico|\bprograma\b|\bdisciplinas\b|conhecimentos\s+(b[áa]sicos|gerais|espec[íi]ficos|complementares)|\bmat[ée]rias\b|\bementa\b/i;
const VACANCY_TABLE_RE = /\bcargo\b.*\bvagas\b|\bvagas\b.*\bcargo\b|\bremunera[çc][ãa]o\b|\bcarga\s+hor[áa]ria\b|\bcadastro\s+de\s+reserva\b|\brequisitos?\b.*\bvagas\b/i;
const SCHEDULE_HEADING_RE = /cronograma|calend[áa]rio|datas\s+previstas/i;
const REGISTRATION_HEADING_RE = /inscri[çc]/i;
const REGISTRATION_BODY_RE = /\btaxa\b|\bboleto\b|\bisen[çc][ãa]o\b|\bcpf\b|\bformul[áa]rio\b/i;
const EXAM_STRUCTURE_HEADING_RE = /\bdas?\s+provas?\b|\betapas\b|\bfases\b|\bavalia[çc][ãa]o\b/i;
const EXAM_STRUCTURE_BODY_RE = /\bquest[õo]es\b|\bpeso\b|\bpontua[çc][ãa]o\b|\bnota\s+m[íi]nima\b|\beliminat[óo]ri|\bclassificat[óo]ri/i;
const LEGAL_DISPOSITION_RE = /disposi[çc][õo]es\s+(finais|gerais|preliminares|transit[óo]rias)/i;
const ANSWER_KEY_HEADING_RE = /gabarito|chave\s+de\s+respostas?|respostas?\s+oficiais?/i;
const ANSWER_KEY_BODY_RE = /\b\d{1,3}\s*[-–.)]\s*[A-E]\b/g;
const NAV_RE = /^(in[íi]cio|home|voltar|menu|contato|fale\s+conosco|mapa\s+do\s+site|acessibilidade)$/i;

export interface SectionClassification {
  role: SectionRole;
  confidence: number;
  signals: string[];
}

export function classifySection(
  section: Pick<Section, "heading" | "text" | "path" | "flags">,
  blocks: readonly Block[] = [],
): SectionClassification {
  const heading = [section.heading ?? "", ...section.path].join(" ");
  const text = section.text;
  const chars = Math.max(1, text.length);
  const signals: string[] = [];
  const own = blocks.filter((b) => b.text.trim());
  const linkChars = own.reduce((s, b) => s + (b.linkChars ?? 0), 0);
  const nonWs = own.reduce((s, b) => s + b.text.replace(/\s+/g, "").length, 0);
  const linkDensity = nonWs > 0 ? linkChars / nonWs : section.flags.includes("boilerplate") ? 1 : 0;

  if (linkDensity > 0.5 || (own.length > 0 && own.every((b) => NAV_RE.test(b.text)))) {
    return { role: "nav", confidence: 0.9, signals: ["link_density"] };
  }
  if (section.flags.includes("legal_article")) {
    return { role: "legal_article", confidence: 0.95, signals: ["legal_article_flag"] };
  }
  if (ANSWER_KEY_HEADING_RE.test(heading) || countMatches(ANSWER_KEY_BODY_RE, text.slice(0, 300)) >= 10) {
    return { role: "answer_key", confidence: 0.9, signals: ["answer_key"] };
  }
  if (orderedOptionMarkers(text) >= 1 && countMatches(/(?:^|\n)\s*(?:quest(?:ão|ao)\s*)?\d{1,3}\s*[-.)]\s+/gi, text) >= 1) {
    return { role: "question_block", confidence: 0.85, signals: ["option_markers"] };
  }
  const listShape = syllabusListShape(text);
  if (SYLLABUS_HEADING_RE.test(heading) && (listShape >= 0.4 || countMatches(OUTLINE_MARKER_RE, text) >= 2)) {
    signals.push("syllabus_heading", "list_shape");
    return { role: "syllabus", confidence: 0.9, signals };
  }
  if (VACANCY_TABLE_RE.test(text.slice(0, 600)) && /\|/.test(text)) {
    return { role: "vacancies", confidence: 0.85, signals: ["vacancy_table"] };
  }
  const dateDensity = per500(countMatches(DATE_RE, text), chars);
  if (SCHEDULE_HEADING_RE.test(heading) || dateDensity >= 3) {
    return { role: "schedule", confidence: 0.8, signals: ["dates"] };
  }
  if (REGISTRATION_HEADING_RE.test(heading) && REGISTRATION_BODY_RE.test(text)) {
    return { role: "registration", confidence: 0.85, signals: ["registration"] };
  }
  if (EXAM_STRUCTURE_HEADING_RE.test(heading) && EXAM_STRUCTURE_BODY_RE.test(text)) {
    return { role: "exam_structure", confidence: 0.8, signals: ["exam_structure"] };
  }
  if (LEGAL_DISPOSITION_RE.test(heading)) {
    return { role: "legal_disposition", confidence: 0.8, signals: ["disposicoes"] };
  }
  const wordCount = Math.max(1, words(text).length);
  const imperatives = countMatches(CANDIDATE_IMPERATIVE_RE, text);
  const imperativeRatio = imperatives / Math.max(1, wordCount / 40);
  if (imperativeRatio > 0.15 && imperatives >= 2) {
    return { role: "instructional", confidence: 0.75, signals: ["candidate_imperative"] };
  }
  if (listShape >= 0.6 && countMatches(OUTLINE_MARKER_RE, text) >= 3) {
    // A programa without its heading is still a programa.
    return { role: "syllabus", confidence: 0.6, signals: ["list_shape"] };
  }
  const paragraphs = own.filter((b) => b.type === "paragraph").length;
  const paragraphShare = own.length ? paragraphs / own.length : text.length >= 200 ? 1 : 0;
  if (paragraphShare >= 0.6 || (own.length === 0 && text.length >= 200)) {
    return { role: "content", confidence: 0.7, signals: ["paragraph_share"] };
  }
  return { role: "other", confidence: 0.5, signals: [] };
}
