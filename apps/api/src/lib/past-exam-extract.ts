import type { GeneratedQuestionInput } from "@quizzeira/shared";

/**
 * Best-effort MCQ extraction from scraped past-exam / resolved-test text.
 * Only keeps items with A–E options; correctIndex from "Gabarito: X" when present.
 */
export function extractMcqCandidates(
  text: string,
  limit = 8,
): GeneratedQuestionInput[] {
  const cleaned = text.replace(/\r/g, "\n");
  const blocks = cleaned.split(/\n(?=\s*\d{1,3}[\).])/);
  const out: GeneratedQuestionInput[] = [];

  for (const block of blocks) {
    if (out.length >= limit) break;
    const optionMatches = [
      ...block.matchAll(/(?:^|\n)\s*([A-E])[\).]\s*([^\n]+)/gi),
    ];
    if (optionMatches.length < 4) continue;

    const promptLine = block
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /^\d{1,3}[\).]/.test(l) || l.length > 40);
    if (!promptLine) continue;

    const prompt = promptLine.replace(/^\d{1,3}[\).]\s*/, "").trim();
    if (prompt.length < 20) continue;

    const options = optionMatches.slice(0, 5).map((m) => m[2].trim());
    const gabarito = block.match(/gabarito\s*[:\-]?\s*([A-E])/i)?.[1];
    if (!gabarito) continue;
    const correctIndex = gabarito.toUpperCase().charCodeAt(0) - 65;
    if (correctIndex < 0 || correctIndex >= options.length) continue;

    out.push({
      type: "MULTIPLE_CHOICE",
      prompt,
      options,
      correctIndex,
      referenceAnswer: null,
      explanation: "Extracted from a public past-exam / solved-test source.",
    });
  }

  return out;
}
