// Concept: Listing-trivia stem denylist shared by generation + Eval (§43.2.3).

/**
 * Stem/option patterns that indicate exam-metadata / portal listing questions
 * (the historical failure mode from screenshots REG-001..006).
 */
export const LISTING_TRIVIA_STEM_RE =
  /\b(?:inscri[cç][oõ]es?\s+abertas|taxa\s+de\s+inscri|cargo\s+(?:de|est[aá]|oferecido|sendo\s+oferecido)|(?:est[aá]\s+sendo\s+oferecido)|vagas?\s+(?:dispon|oferec|s[aã]o\s+oferec)|sal[aá]rio(?:\s+base)?|banca\s+organizadora|associa[cç][aã]o\s+(?:oferece|brasileira|que\s+realiza)|exame\s+para\s+certifica|certifica[cç][aã]o\s+[—\-]|portal\s+do\s+candidato|est[aá]\s+promovendo|oferecido\s+por\s+qual\s+institui)\b/i;

export function looksLikeListingTriviaStem(text: string): boolean {
  return LISTING_TRIVIA_STEM_RE.test(String(text ?? ""));
}
