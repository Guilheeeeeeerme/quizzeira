// Concept: Domain authority + pageRank (§19).

import type { DocumentRole } from "@quizzeira/shared";

const KIND_BASE: Record<string, number> = {
  legislation: 0.95,
  standards_body: 0.9,
  banca_portal: 0.9,
  official_gazette: 0.85,
  gov: 0.85,
  edu: 0.75,
  educational_site: 0.5,
  aggregator: 0.3,
  unknown: 0.2,
};

export function bonusesFromDomainStats(stats: {
  fetched: number;
  becameKnowledge: number;
  rejectedLowValue: number;
  avgDensity?: number | null;
}): { historyBonus: number; spamPenalty: number } {
  let historyBonus = 0;
  let spamPenalty = 0;
  if (stats.becameKnowledge >= 20 && (stats.avgDensity ?? 0) >= 0.6) {
    historyBonus = 0.1;
  }
  if (stats.fetched > 0 && stats.rejectedLowValue / stats.fetched >= 0.3) {
    spamPenalty = 0.3;
  }
  return { historyBonus, spamPenalty };
}

export function domainAuthority(input: {
  kind?: string | null;
  domain?: string | null;
  authorityScore?: number | null;
  historyBonus?: number;
  spamPenalty?: number;
}): number {
  if (input.authorityScore != null && Number.isFinite(input.authorityScore)) {
    return clamp01(input.authorityScore);
  }
  let authority = KIND_BASE[String(input.kind || "unknown")] ?? KIND_BASE.unknown!;
  const domain = (input.domain ?? "").toLowerCase();
  if (domain.endsWith(".gov.br") || domain.includes(".gov.br")) authority += 0.15;
  else if (domain.endsWith(".leg.br")) authority += 0.15;
  else if (domain.endsWith(".edu.br")) authority += 0.1;
  else if (domain.endsWith(".org.br")) authority += 0.05;
  authority += input.historyBonus ?? 0;
  authority -= input.spamPenalty ?? 0;
  return clamp01(authority);
}

export function computePageRank(input: {
  authority: number;
  contentDensity: number;
  syllabusRelevance: number;
  structureScore: number;
  freshnessOrStability: number;
}): number {
  return clamp01(
    0.35 * input.authority +
      0.25 * input.contentDensity +
      0.2 * input.syllabusRelevance +
      0.1 * input.structureScore +
      0.1 * input.freshnessOrStability,
  );
}

export function structureScoreFromText(text: string): number {
  let score = 0;
  if (/^#{1,3}\s|^\d+(\.\d+)*\s/m.test(text)) score += 0.35;
  if (/\b(por exemplo|ex\.|exemplo:)\b/i.test(text)) score += 0.25;
  if (/(^|\n)\s*[-*•]\s/m.test(text) || /(^|\n)\s*\d+[.)]\s/m.test(text)) score += 0.2;
  if (/\bart\.\s*\d+/i.test(text)) score += 0.2;
  return clamp01(score);
}

export function freshnessOrStability(role: DocumentRole, lastModified?: Date | null): number {
  if (role === "specification" || role === "administrative") return 0.5;
  // Legislation / knowledge: treat as stable unless very old educational page.
  if (!lastModified) return 1;
  const ageYears = (Date.now() - lastModified.getTime()) / (365.25 * 24 * 3600 * 1000);
  return ageYears <= 5 ? 1 : 0.5;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
