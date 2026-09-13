// Concept: Document role Tier 2 — nearest-centroid (§14.3).

import type { DocumentRole, NormalizedDocument } from "@quizzeira/shared";
import type { ClassificationResult } from "./classify.js";
import { cosineSimilarity } from "./knowledge/mapping.js";

const MARGIN = 0.08;

/** Compact golden digests used to seed role centroids when live embed is available. */
export const ROLE_CENTROID_SEEDS: Record<
  Exclude<DocumentRole, "mixed" | "unknown">,
  string[]
> = {
  specification: [
    "Edital de abertura. Conteúdo programático. Das inscrições. Das vagas. Das provas.",
    "Anexo II — Conteúdo Programático. Língua Portuguesa. Direito Administrativo.",
  ],
  evidence: [
    "Caderno de prova objetiva. Questão 1. Questão 2. Gabarito preliminar.",
    "Prova tipo A. Assinale a alternativa correta. Padrão de respostas.",
  ],
  knowledge: [
    "A concordância verbal estabelece que o verbo deve concordar com o sujeito.",
    "Art. 1º Esta Lei estabelece normas gerais de licitação e contratação.",
  ],
  administrative: [
    "Inscrição online. Taxa R$ 80,00. Boleto. Resultado preliminar. Cronograma.",
    "Efetue sua inscrição aqui. Cartão de confirmação. Área do candidato.",
  ],
};

export function documentCentroidDigest(doc: NormalizedDocument): string {
  const title = doc.metadata.title ?? "";
  const headings = doc.sections
    .slice(0, 2)
    .map((s) => s.heading ?? "")
    .filter(Boolean)
    .join(" | ");
  const body = doc.sections
    .map((s) => s.text)
    .join(" ")
    .slice(0, 500);
  return `${title}\n${headings}\n${body}`.trim();
}

export function pickNearestRoleCentroid(
  sample: number[],
  centroids: Partial<Record<DocumentRole, number[]>>,
): { role: DocumentRole; confidence: number; margin: number } | null {
  const scored: Array<{ role: DocumentRole; sim: number }> = [];
  for (const [role, vec] of Object.entries(centroids) as Array<[DocumentRole, number[]]>) {
    if (!vec?.length) continue;
    scored.push({ role, sim: cosineSimilarity(sample, vec) });
  }
  scored.sort((a, b) => b.sim - a.sim);
  const top = scored[0];
  const second = scored[1];
  if (!top) return null;
  const margin = top.sim - (second?.sim ?? 0);
  if (margin < MARGIN) return null;
  return {
    role: top.role,
    confidence: Math.min(0.85, 0.55 + margin),
    margin,
  };
}

/**
 * Apply centroid assignment when tiers 0–1 left the doc unknown or low-confidence.
 * `embed` is injected so tests can stub vectors.
 */
export async function classifyRoleCentroid(
  doc: NormalizedDocument,
  current: ClassificationResult,
  embed: (text: string) => Promise<number[]>,
): Promise<ClassificationResult | null> {
  if (current.role !== "unknown" && current.roleConfidence >= 0.7) return null;

  const digest = documentCentroidDigest(doc);
  if (digest.length < 40) return null;

  try {
    const centroids: Partial<Record<DocumentRole, number[]>> = {};
    for (const [role, seeds] of Object.entries(ROLE_CENTROID_SEEDS) as Array<
      [DocumentRole, string[]]
    >) {
      const vectors = await Promise.all(seeds.map((s) => embed(s)));
      const dim = vectors[0]?.length ?? 0;
      if (!dim) continue;
      const mean = new Array(dim).fill(0);
      for (const v of vectors) {
        for (let i = 0; i < dim; i++) mean[i] += v[i] ?? 0;
      }
      for (let i = 0; i < dim; i++) mean[i] /= vectors.length;
      centroids[role] = mean;
    }

    const sample = await embed(digest);
    const picked = pickNearestRoleCentroid(sample, centroids);
    if (!picked) return null;

    return {
      ...current,
      role: picked.role,
      roleConfidence: picked.confidence,
      roleMethod: "tier2_centroid",
    };
  } catch {
    return null;
  }
}
