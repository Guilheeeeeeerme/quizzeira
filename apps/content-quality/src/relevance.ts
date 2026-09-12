// Concept: Validation rung 2 — syllabus link and metadata/durability (§25.2).

import {
  isMetadataHeavy,
  isQuestionNearDuplicateStem,
  metadataProbability,
  questionTestsExamMetadata,
  questionTestsSyllabusMeta,
  type ReasonCode,
} from "@quizzeira/shared";

export type RelevanceReason = Extract<
  ReasonCode,
  | "knowledge_unit_ids_missing"
  | "tests_exam_metadata"
  | "tests_syllabus_meta"
  | "off_syllabus"
  | "temporally_dependent"
  | "copied_previous_question"
  | "duplicate_question"
>;

export interface RelevanceInput {
  origin?: "extraction" | "generation" | "transcription" | string | null;
  prompt: string;
  options?: string[] | null;
  explanation?: string | null;
  knowledgeUnitIds?: string[] | null;
  /** Leaf id on the active syllabus; required for generation. */
  syllabusNodeId?: string | null;
  /** When false, the leaf is missing or not a leaf of the active syllabus. */
  syllabusLeafValid?: boolean | null;
  /** Stems of PreviousQuestion rows for copy detection (§25.2). */
  previousQuestionStems?: string[] | null;
  /** Existing bank stems on the same leaf for near-dup (§25.2). */
  leafStems?: string[] | null;
}

export interface RelevanceResult {
  ok: boolean;
  reasons: RelevanceReason[];
  /** Soft reasons that should park (needs_review) rather than hard-fail. */
  reviewReasons: RelevanceReason[];
  notes: string;
  metadataProbability?: number;
}

function hasKnowledgeUnits(ids: string[] | null | undefined): boolean {
  return Array.isArray(ids) && ids.some((id) => typeof id === "string" && id.trim().length > 0);
}

const TEMPORAL_RE =
  /\b(atual(mente)?|hoje|vigente|neste ano|este ano|\d{4})\b/i;
const LEGAL_CITE_RE = /\b(lei\s+n|art\.?\s*\d|§\s*\d)/i;

export function validateRelevance(input: RelevanceInput): RelevanceResult {
  const reasons: RelevanceReason[] = [];
  const reviewReasons: RelevanceReason[] = [];
  const prompt = (input.prompt ?? "").trim();
  const options = (input.options ?? []).map(String).join("\n");
  const explanation = String(input.explanation ?? "");
  const blob = `${prompt}\n${options}\n${explanation}`.trim();

  if (input.origin === "generation" && !hasKnowledgeUnits(input.knowledgeUnitIds)) {
    reasons.push("knowledge_unit_ids_missing");
  }

  if (input.origin === "generation") {
    const leaf = String(input.syllabusNodeId ?? "").trim();
    if (!leaf || input.syllabusLeafValid === false) {
      reasons.push("off_syllabus");
    }
  }

  // Score the stem only — options (prices, org names as distractors) must not
  // inflate section-oriented syllabusListShape / currency features.
  const metaP = prompt ? metadataProbability(prompt) : 0;
  if (metaP > 0.5 || questionTestsExamMetadata(prompt) || isMetadataHeavy(prompt, 0.5)) {
    reasons.push("tests_exam_metadata");
  }

  if (questionTestsSyllabusMeta(prompt)) {
    reasons.push("tests_syllabus_meta");
  }

  if (TEMPORAL_RE.test(prompt) && !LEGAL_CITE_RE.test(blob)) {
    reviewReasons.push("temporally_dependent");
  }

  for (const stem of input.previousQuestionStems ?? []) {
    if (stem && isQuestionNearDuplicateStem(prompt, stem)) {
      reasons.push("copied_previous_question");
      break;
    }
  }

  for (const stem of input.leafStems ?? []) {
    if (stem && isQuestionNearDuplicateStem(prompt, stem)) {
      reasons.push("duplicate_question");
      break;
    }
  }

  const unique = [...new Set(reasons)];
  return {
    ok: unique.length === 0,
    reasons: unique,
    reviewReasons: [...new Set(reviewReasons)],
    notes:
      unique.length === 0 && reviewReasons.length === 0
        ? "relevance checks passed"
        : describeRelevance([...unique, ...reviewReasons]),
    metadataProbability: metaP,
  };
}

const REASON_TEXT: Record<RelevanceReason, string> = {
  knowledge_unit_ids_missing: "item gerado sem unidades de conhecimento citadas",
  tests_exam_metadata:
    "item testa metadados do concurso (vagas, inscrições, banca) em vez de conhecimento",
  tests_syllabus_meta:
    "item pergunta sobre o conteúdo programático ou matérias do edital",
  off_syllabus: "nó de currículo inválido ou não folha do edital ativo",
  temporally_dependent: "item depende de data ou vigência atual sem citação legal estável",
  copied_previous_question: "cópia ou paráfrase próxima de questão de prova anterior",
  duplicate_question: "duplicata exata ou quase duplicata de item já publicado na folha",
};

function describeRelevance(reasons: RelevanceReason[]): string {
  return reasons.map((r) => REASON_TEXT[r]).join("; ");
}
