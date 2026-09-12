/** Rung 3 — grounding checks (§25.3 / §24.5). */

export type GroundingReason =
  | "ungrounded_citation"
  | "unsupported_specific"
  | "empty_evidence";

export interface GroundingInput {
  knowledgeUnitIds: string[];
  allowedKnowledgeUnitIds: string[];
  correctOption?: string | null;
  explanation?: string | null;
  citedStatements?: string[];
}

export interface GroundingResult {
  ok: boolean;
  reasons: GroundingReason[];
  notes: string;
}

const SPECIFIC_RE =
  /\b(lei\s+n?[ºo°]?\s*[\d./]+|art\.?\s*\d+|R\$\s*[\d.]+|20\d{2})\b/gi;

export function validateGrounding(input: GroundingInput): GroundingResult {
  const reasons: GroundingReason[] = [];
  const allowed = new Set(input.allowedKnowledgeUnitIds);

  if (input.knowledgeUnitIds.length === 0) {
    reasons.push("empty_evidence");
  }

  for (const id of input.knowledgeUnitIds) {
    if (!allowed.has(id)) {
      reasons.push("ungrounded_citation");
      break;
    }
  }

  const itemText = `${input.correctOption ?? ""} ${input.explanation ?? ""}`;
  const specifics = [...itemText.matchAll(SPECIFIC_RE)].map((m) => m[0].toLowerCase());
  if (specifics.length > 0 && (input.citedStatements?.length ?? 0) > 0) {
    const corpus = (input.citedStatements ?? []).join("\n").toLowerCase();
    for (const s of specifics) {
      if (!corpus.includes(s.replace(/\s+/g, " ").trim())) {
        reasons.push("unsupported_specific");
        break;
      }
    }
  }

  return {
    ok: reasons.length === 0,
    reasons,
    notes: reasons.length ? reasons.join(",") : "grounding_ok",
  };
}
