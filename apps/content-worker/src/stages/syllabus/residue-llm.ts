// Concept: LLM syllabus structuring for unparsed residue (§15.3).
// Called only when the deterministic outline parser leaves a thin tree.

import { createHash } from "node:crypto";
import { generateJson, hasLlmProvider } from "@quizzeira/worker-kit";

export interface ResidueTopic {
  title: string;
  subtopics: string[];
}

export interface ResidueStructureResult {
  subject: string;
  topics: ResidueTopic[];
}

const PROMPT_VERSION = "syllabus-residue-v1";

/**
 * Structure free-form conteúdo programático prose into topics/subtopics.
 * Returns empty topics when no LLM provider is configured.
 */
export async function structureSyllabusResidue(
  subject: string,
  body: string,
): Promise<ResidueStructureResult> {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length < 40) return { subject, topics: [] };
  if (!hasLlmProvider()) return { subject, topics: [] };

  const cacheKey = createHash("sha256")
    .update(`${PROMPT_VERSION}|${subject}|${trimmed}`)
    .digest("hex")
    .slice(0, 40);

  try {
    const response = await generateJson<{ topics: unknown }>(
      [
        "Você estrutura conteúdo programático de editais de concurso brasileiro.",
        "Extraia apenas assuntos de estudo (não vagas, taxas, cronograma).",
        "Responda somente JSON.",
      ].join(" "),
      [
        `Disciplina: ${subject}`,
        `promptVersion: ${PROMPT_VERSION}`,
        "Texto do programa (resíduo não parseado):",
        trimmed.slice(0, 6000),
        "",
        'JSON: { "topics": [{ "title": "...", "subtopics": ["..."] }] }',
      ].join("\n"),
      {
        temperature: 0,
        requiredKeys: ["topics"],
        tier: "mid",
        stage: "residue",
        cacheKey,
      },
    );

    const topics: ResidueTopic[] = [];
    if (Array.isArray(response.topics)) {
      for (const entry of response.topics) {
        if (!entry || typeof entry !== "object") continue;
        const row = entry as Record<string, unknown>;
        const title = typeof row.title === "string" ? row.title.trim() : "";
        if (!title) continue;
        const subtopics = Array.isArray(row.subtopics)
          ? row.subtopics.map((s) => String(s).trim()).filter(Boolean).slice(0, 40)
          : [];
        topics.push({ title, subtopics });
      }
    }
    return { subject, topics: topics.slice(0, 30) };
  } catch {
    return { subject, topics: [] };
  }
}
