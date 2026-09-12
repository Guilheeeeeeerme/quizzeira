/** Document and section roles for the role-typed content pipeline (§6). */

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

/** Eligibility matrix: which roles may feed which pipelines (§6.5). */
export function roleAllowsKnowledgeIndex(role: DocumentRole | SectionRole): boolean {
  if (role === "knowledge" || role === "content" || role === "legal_article") return true;
  return false;
}

export function roleAllowsGeneration(role: DocumentRole): boolean {
  return role === "knowledge" || role === "evidence";
}

export function roleAllowsSyllabusExtraction(role: DocumentRole): boolean {
  return role === "specification" || role === "mixed";
}

export function kindHintToRoleHint(kind: ArtifactKindHint): RoleHint {
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

/** Infer kind/role hints from URL + anchor label (Tier 0 provenance). */
export function inferKindHint(url: string, label = ""): ArtifactKindHint {
  const blob = `${url} ${label}`.toLowerCase();
  if (/retifica/i.test(blob)) return "retificacao";
  if (/gabarito/i.test(blob)) return "gabarito";
  if (/padr[aã]o\s+de\s+resposta|padrao\s+de\s+resposta/i.test(blob)) return "padrao_resposta";
  if (/\bprova\b|caderno\s+de\s+quest/i.test(blob)) return "prova";
  if (/conte[uú]do\s+program[aá]tico|programa\b|anexo/i.test(blob) && /edital|programa/i.test(blob)) {
    return "programa";
  }
  if (/edital/i.test(blob)) return "edital";
  if (/apostila|resumo|manual/i.test(blob)) return /manual/i.test(blob) ? "manual" : "apostila";
  if (/\blei\b|decreto|constitui/i.test(blob)) return "lei";
  if (/artigo|gram[aá]tica|portugu[eê]s|matem[aá]tica/i.test(blob)) return "artigo";
  if (/listagem|inscri|concurso\/?$|\/concursos\/?$/i.test(blob)) return "listing";
  return "unknown";
}
