// Concept: Direct-mode discovery — fetch startUrls as documents (§11.4).
import type { CrawlerSource } from "@quizzeira/shared";
import { kindToHints } from "@quizzeira/shared";
import { getRobotsForDomain, isPathAllowed } from "./robots.js";
import { storeArtifact } from "./store.js";

export async function crawlDirectSource(
  source: CrawlerSource,
  budget: number,
): Promise<{ stored: number; remainingBudget: number }> {
  let remaining = budget;
  let stored = 0;
  const robots = await getRobotsForDomain(source.domain, source.id, source.robotsCache as never);
  const roleHint = source.allowedRoles[0] ?? "knowledge";
  const hints = kindToHints(
    roleHint === "knowledge" ? "lei" : roleHint === "specification" ? "edital" : "unknown",
  );

  for (const url of source.startUrls) {
    if (remaining <= 0) break;
    if (!isPathAllowed(url, robots.disallow)) continue;
    const result = await storeArtifact({
      sourceId: source.id,
      url,
      kind: hints.kindHint === "lei" ? "other" : hints.kindHint === "edital" ? "edital" : "other",
      kindHint: hints.kindHint,
      roleHint: (source.allowedRoles[0] as never) ?? hints.roleHint,
      withBytes: true,
      politenessMs: source.politenessMs,
      fetchSignals: { provider: "direct", rank: 1 },
    });
    if (result) {
      stored += 1;
      if (result.downloaded) remaining -= 1;
    }
  }
  return { stored, remainingBudget: remaining };
}
