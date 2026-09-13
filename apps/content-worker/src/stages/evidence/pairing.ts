// Concept: Pair prova + gabarito documents (§18.2).

export interface EvidenceDocumentRef {
  id: string;
  examSlug: string;
  kind: string;
  sourceUrl: string | null;
}

export interface EvidencePairKey {
  examSlug: string;
  year: number | null;
  position: string;
  phase: string;
  bookletType: string | null;
}

export function evidencePairKey(ref: EvidenceDocumentRef, textSample: string): EvidencePairKey {
  const yearMatch = /\b(20\d{2})\b/.exec(
    `${ref.sourceUrl ?? ""} ${textSample.slice(0, 500)}`,
  );
  const phase = /discursiva/i.test(textSample) ? "discursive" : "objective";
  const booklet = /tipo\s*[1-4]|branca|azul|amarela/i.exec(textSample)?.[0] ?? null;
  const positionMatch = /cargo\s*[:\-]?\s*([^\n]+)/i.exec(textSample);
  return {
    examSlug: ref.examSlug,
    year: yearMatch ? Number(yearMatch[1]) : null,
    position: positionMatch?.[1]?.trim() ?? "geral",
    phase,
    bookletType: booklet,
  };
}

/**
 * Prefer gabarito matching (exam, year, position, phase, bookletType) when
 * several candidates exist; fall back to same-exam gabarito (§18.2).
 */
export function findMatchingGabarito(
  prova: EvidenceDocumentRef,
  documents: EvidenceDocumentRef[],
  provaText: string,
): EvidenceDocumentRef | null {
  const key = evidencePairKey(prova, provaText);
  const candidates = documents.filter(
    (d) => d.id !== prova.id && d.kind === "gabarito" && d.examSlug === key.examSlug,
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;

  let best: EvidenceDocumentRef = candidates[0]!;
  let bestScore = -1;
  for (const d of candidates) {
    const dKey = evidencePairKey(d, d.sourceUrl ?? "");
    let score = 0;
    if (key.year != null && dKey.year === key.year) score += 3;
    if (
      key.bookletType &&
      dKey.bookletType &&
      key.bookletType.toLowerCase() === dKey.bookletType.toLowerCase()
    ) {
      score += 2;
    }
    if (key.phase === dKey.phase) score += 1;
    if (key.position !== "geral" && dKey.position === key.position) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}
