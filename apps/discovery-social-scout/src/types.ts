/**
 * Contracts for social → Discovery handoff.
 * Social platforms are never Discovery Sources; only outbound file hosts are.
 */

import type { ArtifactKindHint, RoleHint } from "@quizzeira/shared";

export type SocialPlatform =
  | "fixture"
  | "telegram"
  | "reddit"
  | "x"
  | "facebook"
  | "unknown";

/** One public post / message from an adapter. */
export interface SocialPost {
  platform: SocialPlatform;
  /** Stable id within the platform (message id, submission id, …). */
  externalId: string;
  /** Permalink when available (public URL only). */
  permalink?: string;
  /** Channel / subreddit / feed label for provenance. */
  feedLabel?: string;
  text: string;
  /** Explicit attachment / media URLs the adapter already resolved. */
  attachmentUrls?: string[];
  observedAt: string;
}

export interface SocialFileCandidate {
  url: string;
  label: string;
  kindHint: ArtifactKindHint;
  roleHint: RoleHint;
}

export interface SocialSignal {
  post: SocialPost;
  examRelevant: boolean;
  reason: string;
  files: SocialFileCandidate[];
}

export interface ScoutHandoffResult {
  url: string;
  domain: string;
  action: "scout_candidate" | "skipped_social_host" | "skipped_no_domain" | "error";
  detail?: string;
}

export interface SocialSourceAdapter {
  readonly id: string;
  readonly platform: SocialPlatform;
  /**
   * Fetch recent public/consented posts. Must not attempt auth-wall bypass.
   * Fixture / stubs return canned data; live clients wire official APIs later.
   */
  fetchRecent(): Promise<SocialPost[]>;
}
