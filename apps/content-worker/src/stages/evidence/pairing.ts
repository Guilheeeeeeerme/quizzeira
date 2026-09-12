// Concept: Evidence pairing — match prova ↔ gabarito by edition signals (§18.2).
export interface EvidenceDocMeta {
  id: string;
  kind: string;
  examSlug: string;
  year?: number | null;
  position?: string | null;
  phase?: string | null;
  bookletType?: string | null;
  label?: string | null;
  url?: string | null;
}

export interface EvidencePair {
  provaId: string;
  gabaritoId: string;
  score: number;
  reason: string;
}

function scorePair(prova: EvidenceDocMeta, gab: EvidenceDocMeta): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  if (prova.examSlug === gab.examSlug) {
    score += 0.4;
    reasons.push("same_exam");
  }
  if (prova.year && gab.year && prova.year === gab.year) {
    score += 0.25;
    reasons.push("same_year");
  }
  if (prova.position && gab.position && prova.position.toLowerCase() === gab.position.toLowerCase()) {
    score += 0.15;
    reasons.push("same_position");
  }
  if (prova.phase && gab.phase && prova.phase === gab.phase) {
    score += 0.1;
    reasons.push("same_phase");
  }
  if (
    prova.bookletType &&
    gab.bookletType &&
    prova.bookletType.toLowerCase() === gab.bookletType.toLowerCase()
  ) {
    score += 0.1;
    reasons.push("same_booklet");
  }
  return { score, reason: reasons.join("+") || "weak" };
}

/** Pair each prova with the best gabarito above threshold. */
export function pairEvidence(
  docs: EvidenceDocMeta[],
  minScore = 0.55,
): EvidencePair[] {
  const provas = docs.filter((d) => /prova|caderno/i.test(d.kind) || /prova|caderno/i.test(d.label ?? ""));
  const gabaritos = docs.filter((d) => /gabarito/i.test(d.kind) || /gabarito/i.test(d.label ?? ""));
  const usedGab = new Set<string>();
  const pairs: EvidencePair[] = [];

  for (const prova of provas) {
    let best: { gab: EvidenceDocMeta; score: number; reason: string } | null = null;
    for (const gab of gabaritos) {
      if (usedGab.has(gab.id)) continue;
      const { score, reason } = scorePair(prova, gab);
      if (!best || score > best.score) best = { gab, score, reason };
    }
    if (best && best.score >= minScore) {
      usedGab.add(best.gab.id);
      pairs.push({
        provaId: prova.id,
        gabaritoId: best.gab.id,
        score: best.score,
        reason: best.reason,
      });
    }
  }
  return pairs;
}

export function extractEvidenceMetaFromText(
  text: string,
  base: Pick<EvidenceDocMeta, "id" | "kind" | "examSlug">,
): EvidenceDocMeta {
  const year = /\b(20\d{2})\b/.exec(text)?.[1];
  const position = /cargo\s*[:\-]?\s*([^\n.]{3,60})/i.exec(text)?.[1]?.trim();
  const phase = /\b(objetiva|discursiva|1[ªa]\s*fase|2[ªa]\s*fase)\b/i.exec(text)?.[1];
  const booklet = /\b(?:Tipo\s*[1-4]|Branca|Azul|Amarela)\b/i.exec(text)?.[0];
  return {
    ...base,
    year: year ? Number(year) : null,
    position: position ?? null,
    phase: phase?.toLowerCase() ?? null,
    bookletType: booklet ?? null,
  };
}
