/** Evidence pairing: prova ↔ gabarito by exam/year/position/phase (§18.2). */

export interface EvidenceDoc {
  id: string;
  kind: string;
  examSlug: string;
  sourceUrl?: string | null;
  title?: string | null;
  text?: string | null;
}

export interface EvidencePair {
  provaId: string;
  gabaritoId: string;
  year: number | null;
  position: string | null;
  phase: string;
  bookletType: string | null;
  confidence: number;
}

const YEAR_RE = /\b(20\d{2})\b/;
const POSITION_RE = /cargo\s*[:\-]?\s*([^\n,]{5,60})/i;
const PHASE_RE = /\b(objetiva|discursiva|1[ªa]\s*fase|2[ªa]\s*fase)\b/i;
const BOOKLET_RE = /\b(tipo\s*[1-4]|branca|azul|amarela|verde)\b/i;

export function extractEvidenceMeta(doc: EvidenceDoc): {
  year: number | null;
  position: string | null;
  phase: string;
  bookletType: string | null;
} {
  const blob = `${doc.title ?? ""} ${doc.sourceUrl ?? ""} ${doc.text?.slice(0, 2000) ?? ""}`;
  const yearMatch = blob.match(YEAR_RE);
  const posMatch = blob.match(POSITION_RE);
  const phaseMatch = blob.match(PHASE_RE);
  const bookletMatch = blob.match(BOOKLET_RE);
  return {
    year: yearMatch ? Number(yearMatch[1]) : null,
    position: posMatch?.[1]?.trim() ?? null,
    phase: phaseMatch?.[1]?.toLowerCase().includes("discurs") ? "discursive" : "objective",
    bookletType: bookletMatch?.[1]?.toLowerCase() ?? null,
  };
}

export function pairEvidence(docs: EvidenceDoc[]): EvidencePair[] {
  const provas = docs.filter((d) => /prova|caderno/i.test(d.kind) || /prova/i.test(d.title ?? ""));
  const gabaritos = docs.filter(
    (d) => /gabarito|padrao|padrão/i.test(d.kind) || /gabarito/i.test(d.title ?? ""),
  );
  const pairs: EvidencePair[] = [];

  for (const prova of provas) {
    const pm = extractEvidenceMeta(prova);
    let best: { gab: EvidenceDoc; score: number } | null = null;
    for (const gab of gabaritos) {
      if (gab.examSlug !== prova.examSlug) continue;
      const gm = extractEvidenceMeta(gab);
      let score = 0.4;
      if (pm.year && gm.year && pm.year === gm.year) score += 0.35;
      if (pm.phase === gm.phase) score += 0.1;
      if (pm.position && gm.position && pm.position === gm.position) score += 0.1;
      if (pm.bookletType && gm.bookletType && pm.bookletType === gm.bookletType) score += 0.05;
      if (!best || score > best.score) best = { gab, score };
    }
    if (best && best.score >= 0.5) {
      const gm = extractEvidenceMeta(best.gab);
      pairs.push({
        provaId: prova.id,
        gabaritoId: best.gab.id,
        year: pm.year ?? gm.year,
        position: pm.position ?? gm.position,
        phase: pm.phase,
        bookletType: pm.bookletType ?? gm.bookletType,
        confidence: best.score,
      });
    }
  }
  return pairs;
}
