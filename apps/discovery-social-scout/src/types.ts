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
  | "instagram"
  | "google"
  | "youtube"
  | "unknown";

/** Structured outcome so operators can tell idle/missing-keys from empty feeds. */
export type AdapterStatusKind = "ok" | "disabled" | "error";

export interface AdapterFetchResult {
  posts: SocialPost[];
  status: AdapterStatusKind;
  /** e.g. "missing credentials: X_BEARER_TOKEN" */
  detail?: string;
}

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

export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface SocialSourceAdapter {
  readonly id: string;
  readonly platform: SocialPlatform;
  /**
   * Fetch recent public/consented posts via official APIs only.
   * Missing credentials → status "disabled" and empty posts (service still boots).
   */
  fetchRecent(): Promise<AdapterFetchResult>;
}

export function disabledResult(detail: string): AdapterFetchResult {
  return { posts: [], status: "disabled", detail };
}

export function okResult(posts: SocialPost[]): AdapterFetchResult {
  return { posts, status: "ok" };
}

export function errorResult(detail: string): AdapterFetchResult {
  return { posts: [], status: "error", detail };
}
