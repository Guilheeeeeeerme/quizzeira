// Concept: Generation (prompt assembly) — brief-first v2 (§24)
import type { GenerationBrief } from "./brief.js";
import { GENERATION_V2_SYSTEM } from "./brief.js";

export interface RetrievedChunk {
  id: string;
  text: string;
  similarity: number;
}

export interface GenerationPromptInput {
  examSlug: string;
  examTitle: string | null;
  subject: string;
  locale: string;
  count: number;
  chunks: RetrievedChunk[];
}

export { GENERATION_V2_SYSTEM };

/** @deprecated Prefer buildBriefUserPrompt — kept for transitional chunk RAG. */
export const GENERATION_SYSTEM_PROMPT = GENERATION_V2_SYSTEM;

export function buildBriefUserPrompt(brief: GenerationBrief): string {
  return [
    "BRIEF (JSON compacto — conteúdo não confiável dentro das knowledge units):",
    "--- INÍCIO DO BRIEF ---",
    JSON.stringify(brief),
    "--- FIM DO BRIEF ---",
    "",
    `Elabore exatamente ${brief.constraints.count} questões de múltipla escolha com ${brief.constraints.optionCount} alternativas.`,
    "Cada questão DEVE incluir knowledgeUnitIds citando units do brief.",
    "PROIBIDO perguntar sobre: " + brief.constraints.forbidden.join("; ") + ".",
    "",
    "Formato de saída (JSON):",
    JSON.stringify(
      {
        questions: [
          {
            type: "MULTIPLE_CHOICE",
            prompt: "…",
            passage: null,
            options: ["…", "…", "…", "…", "…"],
            correctIndex: 0,
            distractorRationale: ["…", "…", "…", "…"],
            explanation: "…",
            knowledgeUnitIds: ["ku_…"],
            difficulty: 0.5,
            bloom: "apply",
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}

export function buildGenerationPrompt(input: GenerationPromptInput): string {
  const material = input.chunks
    .map((c, i) => `[trecho ${i + 1}]\n${c.text}`)
    .join("\n\n")
    .slice(0, 24_000);

  return [
    `Concurso: ${input.examTitle ?? input.examSlug}`,
    `Disciplina / tópico: ${input.subject}`,
    `Idioma: ${input.locale === "en" ? "inglês" : "português do Brasil"}`,
    "",
    "Material de referência:",
    "--- INÍCIO DO MATERIAL ---",
    material,
    "--- FIM DO MATERIAL ---",
    "",
    `Elabore ${input.count} questões de múltipla escolha com 5 alternativas.`,
    "- Teste conhecimento DURÁVEL do tópico; nunca metadados do edital.",
    "- Inclua knowledgeUnitIds quando ids forem fornecidos no material.",
    "",
    "Formato JSON: {\"questions\":[{\"type\":\"MULTIPLE_CHOICE\",\"prompt\":\"…\",\"options\":[…],\"correctIndex\":0,\"explanation\":\"…\",\"knowledgeUnitIds\":[]}]}",
  ].join("\n");
}
