// Concept: Document role classification Tier 3 — residue decision (§14.4).
//
// Owner (JEV audit plan §4): JEV Choice over the closed DocumentRole set,
// staged by JEV_CLASSIFY_MODE. `off` keeps the Gemini JSON path; `shadow`
// decides with Gemini and logs JEV's answer beside it; `active` decides with
// JEV only — a JEV failure is a typed error for the stage to defer, never a
// silent Gemini substitute.

import { createHash } from "node:crypto";
import {
  generateJson,
  hasLlmProvider,
  jevDecide,
  jevModeFor,
  jevShadow,
  topChoice,
  type JevChoiceQuestion,
  type JevMode,
} from "@quizzeira/worker-kit";
import type { DocumentRole, NormalizedDocument } from "@quizzeira/shared";
import type { ClassificationResult } from "./classify.js";

const PROMPT_VERSION = "role-t3-v1";
export const ROLE_RUBRIC_VERSION = "role-t3-jev-v1";
/** Below this the residue is "undecided" and the prior tier result stands. */
const DECISIVE_CONFIDENCE = 0.55;

const DOCUMENT_ROLES: DocumentRole[] = [
  "specification",
  "evidence",
  "knowledge",
  "administrative",
  "mixed",
  "unknown",
];

/** Closed criteria — the only roles JEV may answer with. */
export const ROLE_CRITERIA: Record<DocumentRole, string> = {
  specification:
    "Edital, programa, conteúdo programático ou regulamento que define o que será cobrado no concurso.",
  evidence: "Prova aplicada, caderno de questões, gabarito ou padrão de resposta de concurso anterior.",
  knowledge:
    "Material didático, apostila, resumo, legislação comentada ou texto que ensina a disciplina.",
  administrative:
    "Convocação, resultado, cronograma, homologação, recurso ou comunicado processual sem conteúdo de estudo.",
  mixed: "Combina de forma relevante dois ou mais papéis acima no mesmo documento.",
  unknown: "Não é possível determinar o papel a partir do resumo.",
};

export function digest(doc: NormalizedDocument): string {
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

export function buildRoleQuestion(): { role: JevChoiceQuestion } {
  return {
    role: {
      type: "choice",
      instructions:
        "Qual é o papel deste documento em um pipeline de estudo para concursos públicos brasileiros? Escolha exatamente um papel.",
      criteria: { ...ROLE_CRITERIA },
    },
  };
}

export interface ClassifyDecision {
  role: DocumentRole;
  confidence: number;
  probabilities: Record<string, number> | null;
  subtype?: string | null;
  source: "gemini" | "jev";
}

export interface ShadowLog {
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
}

export interface ClassifyResidueDeps {
  generate?: typeof generateJson;
  jev?: typeof jevDecide;
  mode?: JevMode;
  hasProvider?: () => boolean;
  log?: ShadowLog;
}

async function decideWithGemini(
  text: string,
  cacheKey: string,
  generate: typeof generateJson,
): Promise<ClassifyDecision | null> {
  const response = await generate<{
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
  if (!Number.isFinite(confidence)) return null;
  return {
    role,
    confidence: Math.min(1, Math.max(0, confidence)),
    probabilities: null,
    subtype: response.subtype ? String(response.subtype) : null,
    source: "gemini",
  };
}

/** Pure mapping from a validated JEV Choice answer to a decision (allowlist enforced by the criteria). */
export function decisionFromJev(answer: {
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}): ClassifyDecision | null {
  const role = answer.choice as DocumentRole;
  if (!DOCUMENT_ROLES.includes(role)) return null;
  const top = topChoice(answer.probabilities);
  const confidence = top != null ? answer.probabilities[top]! : answer.confidence;
  return { role, confidence, probabilities: answer.probabilities, source: "jev" };
}

function applyDecision(
  current: ClassificationResult,
  decision: ClassifyDecision | null,
  method: string,
  subtype?: string | null,
): ClassificationResult | null {
  if (!decision || decision.confidence < DECISIVE_CONFIDENCE) return null;
  return {
    ...current,
    role: decision.role,
    roleConfidence: Math.min(1, Math.max(0, decision.confidence)),
    roleMethod: method,
    subtype: subtype ?? current.subtype,
  };
}

/**
 * Residue for documents still `unknown` or low-confidence after tiers 0–2.
 * Returns null when no owner is available or the residue is undecided.
 */
export async function classifyRoleLlmResidue(
  doc: NormalizedDocument,
  current: ClassificationResult,
  deps: ClassifyResidueDeps = {},
): Promise<ClassificationResult | null> {
  const mode = deps.mode ?? jevModeFor("classify");
  const hasProvider = deps.hasProvider ?? hasLlmProvider;
  if (mode !== "active" && !hasProvider()) return null;
  if (current.role !== "unknown" && current.roleConfidence >= DECISIVE_CONFIDENCE) return null;

  const text = digest(doc);
  if (text.trim().length < 40) return null;

  const cacheKey = createHash("sha256")
    .update([PROMPT_VERSION, doc.contentHash, text].join("|"))
    .digest("hex")
    .slice(0, 40);
  const state = { rubric: ROLE_RUBRIC_VERSION, digest: text };
  const questions = buildRoleQuestion();
  const generate = deps.generate ?? generateJson;
  const jev = deps.jev ?? jevDecide;

  if (mode === "active") {
    // JEV owns the decision. Errors propagate (typed, deferrable when transient).
    const decision = await jev({ task: "classify", state, questions, mode: "active" }, {});
    return applyDecision(current, decisionFromJev(decision.answers.role), "jev_t3");
  }

  const box: { gemini: ClassifyDecision | null } = { gemini: null };
  const production = decideWithGemini(text, cacheKey, generate)
    .then((d) => {
      box.gemini = d;
      return d;
    })
    .catch(() => null);

  if (mode === "shadow") {
    await Promise.all([
      production,
      jevShadow(
        { task: "classify", state, questions },
        (decision) => {
          const jevDecision = decisionFromJev(decision.answers.role);
          return {
            rubric: ROLE_RUBRIC_VERSION,
            priorRole: current.role,
            geminiRole: box.gemini?.role ?? null,
            geminiConfidence: box.gemini?.confidence ?? null,
            jevRole: jevDecision?.role ?? null,
            jevConfidence: jevDecision?.confidence ?? null,
            agree: box.gemini != null && jevDecision != null && box.gemini.role === jevDecision.role,
          };
        },
        { decide: jev, ...(deps.log ? { log: deps.log } : {}) },
      ),
    ]);
  } else {
    await production;
  }
  return applyDecision(current, box.gemini, "llm", box.gemini?.subtype);
}
