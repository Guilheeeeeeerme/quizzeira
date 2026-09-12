// Concept: Relevance rung (deterministic, pre-judge) — spec §25.2.
//
// Structural checks say "is this a well-formed item"; this rung says "is it
// about *subject knowledge* rather than about the exam". It is the check that
// would have rejected all six screenshot questions without any model call.
//
// Implemented here: metadata classifier, syllabus-meta detector, temporal
// dependence. Not yet implemented (need syllabus / previous-question tables):
// off_syllabus, copied_previous_question, duplicate_question.
import {
  QUALITY_THRESHOLDS,
  itemText,
  metadataProbability,
  testsSyllabusMeta,
  LEGAL_CITATION_RE,
} from "@quizzeira/shared";

export type RelevanceReason = "tests_exam_metadata" | "tests_syllabus_meta" | "temporally_dependent";

export interface RelevanceInput {
  prompt: string;
  options?: string[] | null;
  explanation?: string | null;
  correctIndex?: number | null;
  origin?: "extraction" | "generation" | string | null;
}

export interface RelevanceResult {
  /** False when a hard reason is present; the item fails before the judge. */
  ok: boolean;
  /** Hard reasons (fail). */
  reasons: RelevanceReason[];
  /** Soft reasons (park for a human instead of publishing). */
  reviewReasons: RelevanceReason[];
  notes: string;
  metadataProbability: number;
}

const TEMPORAL_RE = /\batual(?:mente|is)?\b|\bhoje\b|\bvigente\b|\bneste\s+ano\b|\bno\s+momento\b/i;

function mentionsRecentYear(text: string, now: Date): boolean {
  const floor = now.getFullYear() - 1;
  for (const m of text.matchAll(/\b(20\d{2})\b/g)) {
    if (Number(m[1]) >= floor) return true;
  }
  return false;
}

export function validateRelevance(input: RelevanceInput, now: Date = new Date()): RelevanceResult {
  const text = itemText({ prompt: input.prompt, options: input.options, explanation: input.explanation });
  const probability = metadataProbability(text);
  const hard: RelevanceReason[] = [];
  const soft: RelevanceReason[] = [];
  const notes: string[] = [];

  // Verbatim past-exam items are real banca questions: a metadata-looking one
  // is far more likely a classifier false positive than a bad item, so those
  // park for review instead of failing. Generated items get no such benefit.
  const transcription = input.origin === "extraction" || input.origin === "transcription";
  const bucket = transcription ? soft : hard;

  if (probability > QUALITY_THRESHOLDS.itemMetadataMax) {
    bucket.push("tests_exam_metadata");
    notes.push(`metadata probability ${probability}`);
  }
  if (testsSyllabusMeta(input.prompt)) {
    bucket.push("tests_syllabus_meta");
    notes.push("stem asks which topics are in the programa");
  }

  const answer =
    input.options && input.correctIndex != null ? (input.options[input.correctIndex] ?? "") : "";
  const stemAndAnswer = `${input.prompt}\n${answer}`;
  const legal = new RegExp(LEGAL_CITATION_RE.source, "i").test(stemAndAnswer);
  if (!legal && (TEMPORAL_RE.test(stemAndAnswer) || mentionsRecentYear(stemAndAnswer, now))) {
    soft.push("temporally_dependent");
    notes.push("answer may depend on a current year/officeholder/value");
  }

  return {
    ok: hard.length === 0,
    reasons: hard,
    reviewReasons: soft,
    notes: notes.length ? notes.join("; ") : "relevance checks passed",
    metadataProbability: probability,
  };
}
