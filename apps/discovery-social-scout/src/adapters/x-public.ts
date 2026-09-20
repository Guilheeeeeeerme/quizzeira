import { logWarn } from "@quizzeira/worker-kit";
import { fetchJson } from "../http.js";
import { resolveKeywords } from "../keywords.js";
import { providerLocaleParams, resolveSocialLocale } from "../locale.js";
import {
  disabledResult,
  errorResult,
  okResult,
  type FetchLike,
  type SocialPost,
  type SocialSourceAdapter,
} from "../types.js";

/**
 * X (Twitter) API v2 recent search — official Bearer token auth only.
 * Docs: https://developer.x.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent
 *
 * pt-BR shaping: `lang:pt` on the query (default). No country filter on recent
 * search without elevated geo operators.
 */
export function createXPublicAdapter(opts?: {
  bearerEnv?: string;
  fetchFn?: FetchLike;
  keywords?: string[];
  maxResults?: number;
}): SocialSourceAdapter {
  const bearerKey = opts?.bearerEnv ?? "X_BEARER_TOKEN";
  return {
    id: "x-public",
    platform: "x",
    async fetchRecent() {
      const bearer =
        process.env[bearerKey] ?? process.env.TWITTER_BEARER_TOKEN ?? "";
      if (!bearer.trim()) {
        logWarn("x adapter idle", {
          worker: "discovery-social-scout",
          reason: `${bearerKey} (or TWITTER_BEARER_TOKEN) unset — disabled`,
        });
        return disabledResult(`missing credentials: ${bearerKey}`);
      }

      const keywords = opts?.keywords ?? resolveKeywords();
      const langOp = providerLocaleParams(resolveSocialLocale()).xLangOperator;
      const langClause = langOp ? ` ${langOp}` : "";
      const query = `(${keywords.slice(0, 4).map((k) => `"${k}"`).join(" OR ")}) has:links -is:retweet${langClause}`;
      const maxResults = Math.min(Math.max(opts?.maxResults ?? 20, 10), 100);
      const url = new URL("https://api.twitter.com/2/tweets/search/recent");
      url.searchParams.set("query", query);
      url.searchParams.set("max_results", String(maxResults));
      url.searchParams.set("tweet.fields", "created_at,entities,author_id");
      url.searchParams.set("expansions", "author_id");

      const res = await fetchJson<XSearchResponse>(url.toString(), {
        fetchFn: opts?.fetchFn,
        headers: { Authorization: `Bearer ${bearer}` },
      });
      if (!res.ok) {
        logWarn("x adapter error", {
          worker: "discovery-social-scout",
          status: res.status,
          body: res.body.slice(0, 160),
        });
        return errorResult(`X API HTTP ${res.status}`);
      }

      const posts: SocialPost[] = (res.data.data ?? []).map((tweet) => {
        const urls = (tweet.entities?.urls ?? [])
          .map((u) => u.expanded_url ?? u.url)
          .filter(Boolean) as string[];
        return {
          platform: "x" as const,
          externalId: tweet.id,
          permalink: `https://x.com/i/web/status/${tweet.id}`,
          feedLabel: "x-recent-search",
          text: tweet.text,
          attachmentUrls: urls,
          observedAt: tweet.created_at ?? new Date().toISOString(),
        };
      });
      return okResult(posts);
    },
  };
}

interface XSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    entities?: { urls?: Array<{ url?: string; expanded_url?: string }> };
  }>;
}
