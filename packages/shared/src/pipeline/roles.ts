// Concept: Document / section roles and the generation eligibility matrix.
//
// Roles separate "what a document is for" from "where it came from". Only
// knowledge (and evidence, indirectly) may feed question generation.
// Discovery-plane hints (RoleHint, ArtifactKindHint, ExamKind) live in crawler.ts.

import type { ArtifactKindHint, RoleHint } from "../crawler";

export const DOCUMENT_ROLES = [
  "specification",
  "evidence",
  "knowledge",
  "administrative",
  "mixed",
  "unknown",
] as const;

export type DocumentRole = (typeof DOCUMENT_ROLES)[number];

export const SECTION_ROLES = [
  "syllabus",
  "vacancies",
  "schedule",
  "registration",
  "exam_structure",
  "legal_disposition",
  "instructional",
  "content",
  "legal_article",
  "question_block",
  "answer_key",
  "nav",
  "other",
] as const;

export type SectionRole = (typeof SECTION_ROLES)[number];

export const ELIGIBILITY_STATUSES = ["eligible", "ineligible", "parked"] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

/** Capability matrix from crawler-redesign-spec §6.5 */
export type RoleCapability =
  | "syllabus_extraction"
  | "previous_question_parse"
  | "knowledge_index_embed"
  | "generation_retrieval"
  | "style_profile"
  | "catalog_metadata";

const YES = true;
const NO = false;

/** Boolean matrix keyed by capability then role (matches roles.spec.ts). */
export const ROLE_ELIGIBILITY: Record<RoleCapability, Record<DocumentRole, boolean>> = {
  syllabus_extraction: {
    specification: YES,
    evidence: NO,
    knowledge: NO,
    administrative: NO,
    mixed: YES,
    unknown: NO,
  },
  previous_question_parse: {
    specification: NO,
    evidence: YES,
    knowledge: NO,
    administrative: NO,
    mixed: YES,
    unknown: NO,
  },
  knowledge_index_embed: {
    specification: NO,
    evidence: NO,
    knowledge: YES,
    administrative: NO,
    mixed: YES,
    unknown: NO,
  },
  generation_retrieval: {
    specification: NO,
    evidence: NO,
    knowledge: YES,
    administrative: NO,
    mixed: YES,
    unknown: NO,
  },
  style_profile: {
    specification: NO,
    evidence: YES,
    knowledge: NO,
    administrative: NO,
    mixed: YES,
    unknown: NO,
  },
  catalog_metadata: {
    specification: YES,
    evidence: NO,
    knowledge: NO,
    administrative: YES,
    mixed: YES,
    unknown: NO,
  },
};

export function roleAllows(role: DocumentRole, capability: RoleCapability): boolean {
  return ROLE_ELIGIBILITY[capability][role];
}

export function isSyllabusExtractionEligible(role: DocumentRole): boolean {
  return roleAllows(role, "syllabus_extraction");
}

export function isPreviousQuestionParseEligible(role: DocumentRole): boolean {
  return roleAllows(role, "previous_question_parse");
}

export function isEmbedEligible(role: DocumentRole): boolean {
  return roleAllows(role, "knowledge_index_embed");
}

export function isGenerationEligible(role: DocumentRole): boolean {
  return roleAllows(role, "generation_retrieval");
}

export function isCatalogMetadataEligible(role: DocumentRole): boolean {
  return roleAllows(role, "catalog_metadata");
}

/** Aliases used by content-worker stages. */
export const isEmbedEligibleRole = isEmbedEligible;
export const isGenerationEligibleRole = isGenerationEligible;
export const isSyllabusSourceRole = isSyllabusExtractionEligible;

/** Section roles that may produce embeddable knowledge chunks. */
export const KNOWLEDGE_SECTION_ROLES: ReadonlySet<SectionRole> = new Set([
  "content",
  "legal_article",
]);

export function isKnowledgeSectionRole(role: SectionRole): boolean {
  return KNOWLEDGE_SECTION_ROLES.has(role);
}

export function isGenerationEligibleSection(role: SectionRole): boolean {
  return isKnowledgeSectionRole(role);
}

/** Map artifact kind hints → document role hints (Tier 0 provenance). */
export function roleHintFromKindHint(kind: ArtifactKindHint): RoleHint {
  switch (kind) {
    case "edital":
    case "retificacao":
    case "programa":
      return "specification";
    case "prova":
    case "gabarito":
    case "padrao_resposta":
      return "evidence";
    case "apostila":
    case "lei":
    case "artigo":
    case "manual":
      return "knowledge";
    case "listing":
      return "administrative";
    default:
      return "unknown";
  }
}
