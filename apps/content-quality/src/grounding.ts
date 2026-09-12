// Concept: Grounding check (§25.3) — answer must be supported by cited knowledge.
export interface GroundingInput {
  prompt: string;
  options?: string[] | null;
  correctIndex?: number | null;
  explanation?: string | null;
  evidenceTexts: string[];
}

export interface GroundingResult {
  ok: boolean;
  reasons: string[];
  overlap: number;
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3),
  );
}

export function validateGrounding(input: GroundingInput): GroundingResult {
  if (!input.evidenceTexts.length) {
    return { ok: false, reasons: ["missing_knowledge_evidence"], overlap: 0 };
  }
  const answer =
    input.options && input.correctIndex != null ? (input.options[input.correctIndex] ?? "") : "";
  const claim = tokens(`${input.prompt}\n${answer}\n${input.explanation ?? ""}`);
  const evidence = tokens(input.evidenceTexts.join("\n"));
  if (claim.size === 0) return { ok: false, reasons: ["empty_claim"], overlap: 0 };
  let hit = 0;
  for (const t of claim) if (evidence.has(t)) hit += 1;
  const overlap = hit / claim.size;
  if (overlap < 0.12) {
    return { ok: false, reasons: ["ungrounded_answer"], overlap };
  }
  return { ok: true, reasons: [], overlap };
}
