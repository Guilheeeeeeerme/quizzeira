import type { CrawlerRunSummary, CrawlerSource, RoleHint } from "@quizzeira/shared";
import { logInfo } from "@quizzeira/worker-kit";
import { storeArtifactFromFetch } from "./store.js";

const NAME = "discovery-crawler";

function roleHintForDirect(source: CrawlerSource): RoleHint {
  const allowed = (source.allowedRoles ?? []).filter(
    (r): r is RoleHint =>
      r === "specification" ||
      r === "evidence" ||
      r === "knowledge" ||
      r === "administrative" ||
      r === "unknown",
  );
  if (allowed.includes("knowledge")) return "knowledge";
  if (allowed[0]) return allowed[0];
  if (source.kind === "legislation" || source.kind === "standards_body" || source.kind === "open_textbook") {
    return "knowledge";
  }
  return "knowledge";
}

function kindHintForUrl(url: string): "edital" | "prova" | "gabarito" | "unknown" {
  const u = url.toLowerCase();
  if (/edital|programa/.test(u)) return "edital";
  if (/gabarito|resposta/.test(u)) return "gabarito";
  if (/prova|caderno|quest/.test(u)) return "prova";
  return "unknown";
}

/** §11.4 direct mode — fetch startUrls as documents with admin role hints. */
export async function crawlDirectSource(
  source: CrawlerSource,
  summary: CrawlerRunSummary,
  budget: number,
): Promise<number> {
  let remaining = budget;
  const roleHint = roleHintForDirect(source);
  for (const url of source.startUrls) {
    if (remaining <= 0) break;
    const stored = await storeArtifactFromFetch({
      sourceId: source.id,
      url,
      withBytes: true,
      kindHint: kindHintForUrl(url),
      roleHint,
      domain: source.domain,
      politenessMs: source.politenessMs,
    });
    if (stored) {
      summary.artifactsStored += 1;
      if (stored.downloaded) remaining -= 1;
    }
  }
  logInfo("direct mode complete", {
    worker: NAME,
    sourceId: source.id,
    roleHint,
    urls: source.startUrls.length,
  });
  return remaining;
}
