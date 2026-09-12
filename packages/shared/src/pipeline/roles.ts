// Concept: Document roles (the semantic purpose of a document, decided before
// any of its text can reach chunking, embedding or generation).
//
// `DocumentRole` answers "what is this document *for*"; `SectionRole` refines
// that per section because editais and apostilas are routinely mixed. The
// eligibility matrix below is the single place the pipeline consults to decide
// which stage may consume which role — see docs/crawler-redesign-spec.md §6.

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

export const ROLE_HINTS = [
  "specification",
  "evidence",
  "knowledge",
  "administrative",
  "unknown",
] as const;
export type RoleHint = (typeof ROLE_HINTS)[number];

export const ARTIFACT_KIND_HINTS = [
  "edital",
  "retificacao",
  "programa",
  "prova",
  "gabarito",
  "padrao_resposta",
  "apostila",
  "lei",
  "artigo",
  "manual",
  "listing",
  "unknown",
] as const;
export type ArtifactKindHint = (typeof ARTIFACT_KIND_HINTS)[number];

export const DOCUMENT_SUBTYPES: Record<Exclude<DocumentRole, "mixed" | "unknown">, readonly string[]> = {
  specification: [
    "edital_abertura",
    "edital_retificacao",
    "conteudo_programatico_anexo",
    "programa_oficial",
  ],
  evidence: [
    "prova_objetiva",
    "prova_discursiva",
    "gabarito_preliminar",
    "gabarito_definitivo",
    "padrao_resposta",
    "questoes_comentadas",
  ],
  knowledge: [
    "apostila",
    "livro_capitulo",
    "artigo_educacional",
    "lei",
    "decreto",
    "sumula",
    "manual",
    "documentacao_tecnica",
    "resumo",
  ],
  administrative: [
    "listagem",
    "inscricao",
    "cronograma",
    "resultado",
    "convocacao",
    "faq",
    "noticia",
  ],
};

export type PipelineCapability =
  | "syllabus_extraction"
  | "previous_question_parse"
  | "knowledge_index"
  | "generation_retrieval"
  | "style_profile"
  | "catalog_metadata";

/** §6.5 as data. `mixed` documents are decided per section, never as a whole. */
export const ELIGIBILITY_MATRIX: Record<PipelineCapability, readonly DocumentRole[]> = {
  syllabus_extraction: ["specification", "mixed"],
  previous_question_parse: ["evidence", "mixed"],
  knowledge_index: ["knowledge"],
  generation_retrieval: ["knowledge"],
  style_profile: ["evidence"],
  catalog_metadata: ["specification", "administrative"],
};

export function roleAllows(capability: PipelineCapability, role: DocumentRole): boolean {
  return ELIGIBILITY_MATRIX[capability].includes(role);
}

/** Only these section roles of a `knowledge` document may feed generation. */
export const GENERATION_ELIGIBLE_SECTION_ROLES: readonly SectionRole[] = [
  "content",
  "legal_article",
];

export function isGenerationEligibleSection(role: SectionRole): boolean {
  return GENERATION_ELIGIBLE_SECTION_ROLES.includes(role);
}

/** Invariant 4 (§9.4): never citable as grounding evidence. */
export function isCitableRole(role: DocumentRole): boolean {
  return role === "knowledge" || role === "evidence";
}

export const ELIGIBILITY_STATUSES = ["eligible", "ineligible", "parked"] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const INELIGIBILITY_REASONS = [
  "role",
  "section_role",
  "language",
  "noise",
  "metadata",
  "low_quality",
  "size",
  "duplicate",
  "unmapped",
  "guardrail_block",
  "legacy",
] as const;
export type IneligibilityReason = (typeof INELIGIBILITY_REASONS)[number];

export function roleHintToRole(hint: RoleHint | string | null | undefined): DocumentRole {
  switch (hint) {
    case "specification":
    case "evidence":
    case "knowledge":
    case "administrative":
      return hint;
    default:
      return "unknown";
  }
}

/** Legacy `ArtifactKind`/`DocumentKind` values mapped onto the new hints. */
export function kindToHints(kind: string | null | undefined): {
  kindHint: ArtifactKindHint;
  roleHint: RoleHint;
} {
  switch ((kind ?? "").toLowerCase()) {
    case "edital":
      return { kindHint: "edital", roleHint: "specification" };
    case "programa":
      return { kindHint: "programa", roleHint: "specification" };
    case "retificacao":
      return { kindHint: "retificacao", roleHint: "specification" };
    case "prova":
      return { kindHint: "prova", roleHint: "evidence" };
    case "gabarito":
      return { kindHint: "gabarito", roleHint: "evidence" };
    case "padrao_resposta":
      return { kindHint: "padrao_resposta", roleHint: "evidence" };
    case "apostila":
      return { kindHint: "apostila", roleHint: "knowledge" };
    case "lei":
      return { kindHint: "lei", roleHint: "knowledge" };
    case "artigo":
      return { kindHint: "artigo", roleHint: "knowledge" };
    case "manual":
      return { kindHint: "manual", roleHint: "knowledge" };
    case "listing":
      return { kindHint: "listing", roleHint: "administrative" };
    default:
      return { kindHint: "unknown", roleHint: "unknown" };
  }
}
