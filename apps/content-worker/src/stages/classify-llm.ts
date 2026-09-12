// Concept: Document role classification Tier 3 — LLM residue (§14.4).

import { createHash } from "node:crypto";
import { generateJson, hasLlmProvider } from "@quizzeira/worker-kit";
import type { DocumentRole, NormalizedDocument } from "@quizzeira/shared";
import type { ClassificationResult } from "./classify.js";

const PROMPT_VERSION = "role-t3-v1";
const DOCUMENT_ROLES: DocumentRole[] = [
  "specification",
  "evidence",
  "knowledge",
  "administrative",
  "mixed",
  "unknown",
];

function digest(doc: NormalizedDocument): string {
  const title = doc.metadata.title ?? "";
  const headings = doc.sections
    .slice(0, 8)
    .map((s) => s.heading ?? "")
    .filter(Boolean)
    .join(" | ");
  const body = doc.sections
    .slice(0, 3)
    .map((s) => s.text.slice(0, 400))
    .join("\n");
  return `${title}\n${headings}\n${body}`.slice(0, 1500);
}

/**
 * LLM residue for documents still `unknown` or low-confidence after tiers 0–1.
 * Returns null when provider unavailable or classification is already decisive.
 */
export async function classifyRoleLlmResidue(
  doc: NormalizedDocument,
  current: ClassificationResult,
): Promise<ClassificationResult | null> {
  if (!hasLlmProvider()) return null;
  if (current.role !== "unknown" && current.roleConfidence >= 0.55) return null;

  const text = digest(doc);
  if (text.trim().length < 40) return null;

  const cacheKey = createHash("sha256")
    .update([PROMPT_VERSION, doc.contentHash, text].join("|"))
    .digest("hex")
    .slice(0, 40);

  try {
    const response = await generateJson<{
      role: string;
      subtype: string | null;
      confidence: number;
      reason: string;
    }>(
      "Classifique o papel do documento em um pipeline de concursos brasileiros. JSON apenas.",
      [
        "Papéis: specification | evidence | knowledge | administrative | mixed | unknown",
        "Digest:",
        text,
        "",
        'JSON: { "role": "knowledge", "subtype": null, "confidence": 0.7, "reason": "…" }',
      ].join("\n"),
      {
        temperature: 0,
        requiredKeys: ["role", "confidence"],
        tier: "cheap",
        stage: "classify",
        cacheKey,
      },
    );

    const role = String(response.role || "unknown") as DocumentRole;
    if (!DOCUMENT_ROLES.includes(role)) return null;
    const confidence = Number(response.confidence);
    if (!Number.isFinite(confidence) || confidence < 0.55) return null;

    return {
      ...current,
      role,
      roleConfidence: Math.min(1, Math.max(0, confidence)),
      roleMethod: "llm",
      subtype: response.subtype ? String(response.subtype) : current.subtype,
    };
  } catch {
    return null;
  }
}
