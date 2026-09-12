/** Document role classification tiers 0–2 (§14). LLM tier 3 is wired elsewhere. */

import {
  inferKindHint,
  kindHintToRoleHint,
  type ArtifactKindHint,
  type DocumentRole,
  type RoleHint,
} from "../curriculum/roles";
import { metadataProbability } from "../curriculum/metadata";

export interface RoleClassification {
  role: DocumentRole;
  confidence: number;
  method: "provenance" | "lexical" | "centroid" | "heuristic";
  subtype?: string;
}

const SPEC_LEX =
  /\b(edital\s+de\s+abertura|conte[uú]do\s+program[aá]tico|das\s+inscri[cç][oõ]es|dos\s+cargos|retifica[cç][aã]o)\b/i;
const EVIDENCE_LEX = /\b(caderno\s+de\s+quest|gabarito|prova\s+objetiva|assinale\s+a\s+alternativa)\b/i;
const KNOWLEDGE_LEX =
  /\b(define-se|consiste\s+em|por\s+exemplo|gram[aá]tica|concord[aâ]ncia|licita[cç][oõ]es|art\.\s*\d+)\b/i;
const ADMIN_LEX =
  /\b(inscri[cç][oõ]es\s+abertas|cronograma|resultado|convoca[cç][aã]o|acompanhe\s+os\s+concursos|saiba\s+mais)\b/i;

export function classifyDocumentRole(input: {
  url?: string | null;
  label?: string | null;
  kindHint?: ArtifactKindHint | string | null;
  roleHint?: RoleHint | string | null;
  text: string;
}): RoleClassification {
  // Tier 0 — provenance
  const hint =
    (input.roleHint as RoleHint | undefined) ||
    (input.kindHint
      ? kindHintToRoleHint(input.kindHint as ArtifactKindHint)
      : kindHintToRoleHint(inferKindHint(input.url ?? "", input.label ?? "")));

  if (hint === "specification") {
    return { role: "specification", confidence: 0.92, method: "provenance", subtype: "edital_abertura" };
  }
  if (hint === "evidence") {
    return { role: "evidence", confidence: 0.9, method: "provenance", subtype: "prova_objetiva" };
  }
  if (hint === "knowledge") {
    return { role: "knowledge", confidence: 0.88, method: "provenance" };
  }
  if (hint === "administrative") {
    return { role: "administrative", confidence: 0.95, method: "provenance", subtype: "listagem" };
  }

  // Tier 1 — lexical
  const text = input.text.slice(0, 12000);
  if (ADMIN_LEX.test(text) && metadataProbability(text) > 0.55) {
    return { role: "administrative", confidence: 0.82, method: "lexical", subtype: "listagem" };
  }
  if (SPEC_LEX.test(text)) {
    return { role: "specification", confidence: 0.8, method: "lexical" };
  }
  if (EVIDENCE_LEX.test(text)) {
    return { role: "evidence", confidence: 0.78, method: "lexical" };
  }
  if (KNOWLEDGE_LEX.test(text) && metadataProbability(text) < 0.4) {
    return { role: "knowledge", confidence: 0.75, method: "lexical" };
  }

  // Tier 2 — heuristic centroid-ish signals
  const meta = metadataProbability(text);
  if (meta > 0.65) {
    return { role: "administrative", confidence: 0.7, method: "heuristic" };
  }
  if (meta < 0.25 && text.length > 1500) {
    return { role: "knowledge", confidence: 0.62, method: "heuristic" };
  }

  return { role: "unknown", confidence: 0.4, method: "heuristic" };
}
