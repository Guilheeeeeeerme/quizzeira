/**
 * Pure set-difference for the canonical-bank dual-read parity check (§7,
 * Next item 3): which legacy-reachable published questions are *not* also
 * reachable through the canonical `QuestionApplicability` mapping. A
 * non-empty result means `/published/sample` cannot yet drop its legacy
 * `examSlug`/`syllabusNodeId` query path for that exam without losing
 * coverage.
 */
export function findParityGaps(legacyIds: string[], canonicalIds: string[]): string[] {
  const canonicalSet = new Set(canonicalIds);
  return legacyIds.filter((id) => !canonicalSet.has(id));
}
