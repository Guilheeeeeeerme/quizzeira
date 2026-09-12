/**
 * Fixture LLM for generation (§41 / local verification without provider keys).
 * Produces real MCQ text grounded only in the brief's knowledge units.
 */

import type { GeneratedQuestionInput } from "@quizzeira/shared";
import type { GenerationBrief } from "./brief.js";
import { GENERATION_V2_SYSTEM, buildBriefUserPrompt } from "./prompt.js";

export interface FixtureGenerationResult {
  system: string;
  user: string;
  questions: Array<GeneratedQuestionInput & { knowledgeUnitIds: string[]; distractorRationale: string[] }>;
}

/** Deterministic item writer used when CONTENT_GENERATION_MODE=fixture. */
export function fixtureGenerateFromBrief(
  brief: GenerationBrief,
): FixtureGenerationResult {
  const user = buildBriefUserPrompt(brief);
  const questions: FixtureGenerationResult["questions"] = [];
  const count = Math.min(brief.constraints.count, brief.knowledge.length, 5);

  for (let i = 0; i < count; i++) {
    const ku = brief.knowledge[i];
    const correct = truncate(ku.statement, 140);
    const distractors: string[] = [];
    for (const other of brief.knowledge) {
      if (other.id === ku.id) continue;
      const d = truncate(other.statement, 140);
      if (d !== correct && !distractors.includes(d)) distractors.push(d);
      if (distractors.length >= brief.constraints.optionCount - 1) break;
    }
    let salt = 0;
    while (distractors.length < brief.constraints.optionCount - 1) {
      const d = plausibleMisconception(ku.statement, salt++);
      if (d !== correct && !distractors.includes(d)) distractors.push(d);
      if (salt > 20) break;
    }

    const options = shuffleDeterministic([correct, ...distractors], ku.id).slice(
      0,
      brief.constraints.optionCount,
    );
    // Deduplicate while preserving order, then pad if needed.
    const unique: string[] = [];
    for (const o of options) {
      if (!unique.includes(o)) unique.push(o);
    }
    while (unique.length < brief.constraints.optionCount) {
      const d = plausibleMisconception(ku.statement, unique.length + 10);
      if (!unique.includes(d) && d !== correct) unique.push(d);
      else unique.push(`Formulação distratora ${unique.length + 1} para ${brief.syllabus.subtopic}.`);
    }
    const correctIndex = Math.max(0, unique.findIndex((o) => o === correct));
    const opener = "Assinale a alternativa correta a respeito de";
    const subtopic = brief.syllabus.subtopic;

    questions.push({
      type: "MULTIPLE_CHOICE",
      prompt: `${opener} ${subtopic}: segundo o material de estudo, qual enunciado expressa a regra/definição aplicável?`,
      options: unique,
      correctIndex,
      referenceAnswer: null,
      explanation: `A resposta segue a knowledge unit ${ku.id}: ${truncate(ku.statement, 200)}`,
      knowledgeUnitIds: [ku.id],
      distractorRationale: unique.map((o, idx) =>
        idx === correctIndex
          ? "alternativa correta"
          : "confunde regra correlata ou inverte o enunciado",
      ),
    });
  }

  return { system: GENERATION_V2_SYSTEM, user, questions };
}

function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function plausibleMisconception(statement: string, salt: number): string {
  if (/plural/i.test(statement)) {
    return salt % 2 === 0
      ? "Com sujeito composto anteposto, o verbo permanece no singular."
      : "O verbo concorda apenas com o núcleo mais próximo, nunca com o conjunto.";
  }
  if (/define-se|consiste/i.test(statement)) {
    return "Trata-se apenas de recomendação estilística, sem efeito normativo.";
  }
  return `Não se aplica a regra descrita; prevalece a formulação inversa (${salt + 1}).`;
}

function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Sample "bad" metadata question for contrast in harness reports. */
export function fixtureMetadataTriviaQuestion(): GeneratedQuestionInput & {
  knowledgeUnitIds: string[];
} {
  return {
    type: "MULTIPLE_CHOICE",
    prompt: "Quantas vagas são oferecidas para o cargo de Técnico no edital de abertura?",
    options: ["5", "10", "15", "20", "25"],
    correctIndex: 1,
    referenceAnswer: null,
    explanation: "Conforme o edital, há 10 vagas.",
    knowledgeUnitIds: [],
  };
}
