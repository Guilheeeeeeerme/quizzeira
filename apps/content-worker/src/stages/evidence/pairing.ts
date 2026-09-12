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

export function findMatchingGabarito(
  prova: EvidenceDocumentRef,
  documents: EvidenceDocumentRef[],
  provaText: string,
): EvidenceDocumentRef | null {
  const key = evidencePairKey(prova, provaText);
  return (
    documents.find((d) => {
      if (d.id === prova.id || d.kind !== "gabarito") return false;
      if (d.examSlug !== key.examSlug) return false;
      return true;
    }) ?? null
  );
}
