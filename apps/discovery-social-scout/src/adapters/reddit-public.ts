import { logWarn } from "@quizzeira/worker-kit";
import type { SocialPost, SocialSourceAdapter } from "../types.js";

/**
 * Skeleton for Reddit public JSON / OAuth read-only clients.
 * Intended for public subreddits with user-agent + rate limits.
 * Does not bypass login walls or scrape old.reddit HTML as a primary path.
 */
export function createRedditPublicAdapter(opts?: {
  clientIdEnv?: string;
  clientSecretEnv?: string;
}): SocialSourceAdapter {
  const idKey = opts?.clientIdEnv ?? "REDDIT_CLIENT_ID";
  const secretKey = opts?.clientSecretEnv ?? "REDDIT_CLIENT_SECRET";
  return {
    id: "reddit-public",
    platform: "reddit",
    async fetchRecent(): Promise<SocialPost[]> {
      const clientId = process.env[idKey];
      const clientSecret = process.env[secretKey];
      if (!clientId || !clientSecret) {
        logWarn("reddit adapter idle", {
          worker: "discovery-social-scout",
          reason: `${idKey}/${secretKey} unset — stub returns []`,
        });
        return [];
      }
      logWarn("reddit adapter stub", {
        worker: "discovery-social-scout",
        reason: "live Reddit API client not implemented; returning []",
      });
      return [];
    },
  };
}
