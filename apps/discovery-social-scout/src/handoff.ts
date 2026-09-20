import { domainFromUrl, kindHintToArtifactKind } from "@quizzeira/shared";
import { dmzPost, logWarn } from "@quizzeira/worker-kit";
import { isSocialHost } from "./detect.js";
import type { ScoutHandoffResult, SocialFileCandidate, SocialSignal } from "./types.js";

const NAME = "discovery-social-scout";

export interface HandoffOptions {
  /** POST URL-only artifacts in addition to scout candidates. */
  storeUrlArtifacts: boolean;
}

function provenanceNotes(signal: SocialSignal, file: SocialFileCandidate): string {
  const p = signal.post;
  return [
    `social-scout:${p.platform}`,
    p.feedLabel ? `feed=${p.feedLabel}` : null,
    `externalId=${p.externalId}`,
    p.permalink ? `permalink=${p.permalink}` : null,
    `kindHint=${file.kindHint}`,
    `reason=${signal.reason}`,
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Hand an outbound file URL into Discovery:
 * 1. Propose the file *host* as a SourceCandidate (never the social platform).
 * 2. Optionally record a URL-only Artifact with social provenance.
 */
export async function handoffFile(
  signal: SocialSignal,
  file: SocialFileCandidate,
  opts: HandoffOptions,
): Promise<ScoutHandoffResult> {
  const domain = domainFromUrl(file.url);
  if (!domain) {
    return { url: file.url, domain: "", action: "skipped_no_domain" };
  }
  if (isSocialHost(domain)) {
    return { url: file.url, domain, action: "skipped_social_host" };
  }

  try {
    await dmzPost("/internal/scout/candidates", {
      url: file.url,
      domain,
      name: domain,
      notes: provenanceNotes(signal, file),
    });
  } catch (err) {
    logWarn("scout candidate failed", {
      worker: NAME,
      url: file.url,
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    });
    return {
      url: file.url,
      domain,
      action: "error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (opts.storeUrlArtifacts) {
    try {
      await dmzPost("/internal/artifacts", {
        examId: null,
        sourceId: null,
        kind: kindHintToArtifactKind(file.kindHint),
        kindHint: file.kindHint,
        roleHint: file.roleHint,
        anchorLabel: file.label.slice(0, 240),
        url: file.url,
        contentType: "application/octet-stream",
        fetchSignals: {
          origin: "discovery-social-scout",
          platform: signal.post.platform,
          externalId: signal.post.externalId,
          feedLabel: signal.post.feedLabel ?? null,
          permalink: signal.post.permalink ?? null,
          reason: signal.reason,
        },
      });
    } catch (err) {
      logWarn("url artifact store failed", {
        worker: NAME,
        url: file.url,
        error: err instanceof Error ? err.message.slice(0, 200) : String(err),
      });
    }
  }

  return { url: file.url, domain, action: "scout_candidate" };
}
