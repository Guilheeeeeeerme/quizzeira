import { logWarn } from "@quizzeira/worker-kit";
import { fetchJson } from "../http.js";
import { resolveKeywords } from "../keywords.js";
import {
  disabledResult,
  okResult,
  type FetchLike,
  type SocialPost,
  type SocialSourceAdapter,
} from "../types.js";

/**
 * Reddit public JSON search on allow-listed public subreddits.
 * Uses documented `*.reddit.com/.../*.json` endpoints with a descriptive User-Agent.
 * Optional OAuth client credentials are accepted but not required for public reads.
 * Docs: https://www.reddit.com/dev/api/#GET_search
 *
 * pt-BR shaping: default subreddits `concursos,brasil` + pt-BR keywords.
 * Reddit search has **no** official language / region query param — gap documented
 * in README.
 */
export function createRedditPublicAdapter(opts?: {
  clientIdEnv?: string;
  clientSecretEnv?: string;
  subredditsEnv?: string;
  userAgentEnv?: string;
  fetchFn?: FetchLike;
  keywords?: string[];
}): SocialSourceAdapter {
  const idKey = opts?.clientIdEnv ?? "REDDIT_CLIENT_ID";
  const secretKey = opts?.clientSecretEnv ?? "REDDIT_CLIENT_SECRET";
  const subsKey = opts?.subredditsEnv ?? "REDDIT_SUBREDDITS";
  const uaKey = opts?.userAgentEnv ?? "REDDIT_USER_AGENT";

  return {
    id: "reddit-public",
    platform: "reddit",
    async fetchRecent() {
      const clientId = process.env[idKey];
      const clientSecret = process.env[secretKey];
      const ua =
        process.env[uaKey] ??
        "quizzeira-discovery-social-scout/0.1 (public concurso signal scout; contact ops)";
      const subsRaw = process.env[subsKey] ?? "concursos,brasil";
      const subreddits = subsRaw
        .split(",")
        .map((s) => s.trim().replace(/^r\//, ""))
        .filter(Boolean);

      if (subreddits.length === 0) {
        return disabledResult(`missing config: ${subsKey}`);
      }

      // Prefer OAuth token when present; otherwise public .json with User-Agent.
      let authHeader: string | undefined;
      if (clientId && clientSecret) {
        const tokenRes = await fetchJson<{ access_token?: string }>(
          "https://www.reddit.com/api/v1/access_token",
          {
            fetchFn: opts?.fetchFn,
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": ua,
            },
            body: "grant_type=client_credentials",
          },
        );
        if (tokenRes.ok && tokenRes.data.access_token) {
          authHeader = `Bearer ${tokenRes.data.access_token}`;
        } else {
          logWarn("reddit oauth failed; falling back to public JSON", {
            worker: "discovery-social-scout",
          });
        }
      }

      const keywords = opts?.keywords ?? resolveKeywords();
      const query = keywords.slice(0, 3).join(" OR ");
      const posts: SocialPost[] = [];
      const base = authHeader ? "https://oauth.reddit.com" : "https://www.reddit.com";

      for (const sub of subreddits) {
        const url = new URL(`${base}/r/${encodeURIComponent(sub)}/search.json`);
        url.searchParams.set("q", query);
        url.searchParams.set("restrict_sr", "1");
        url.searchParams.set("sort", "new");
        url.searchParams.set("limit", "15");
        url.searchParams.set("t", "week");

        const res = await fetchJson<RedditListing>(url.toString(), {
          fetchFn: opts?.fetchFn,
          headers: {
            "User-Agent": ua,
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        });
        if (!res.ok) {
          logWarn("reddit adapter error", {
            worker: "discovery-social-scout",
            sub,
            status: res.status,
          });
          // One bad sub should not kill the whole adapter if others work.
          continue;
        }

        for (const child of res.data.data?.children ?? []) {
          const d = child.data;
          if (!d?.id) continue;
          const text = [d.title, d.selftext].filter(Boolean).join("\n");
          const attachments: string[] = [];
          if (d.url && /^https?:\/\//i.test(d.url)) attachments.push(d.url);
          posts.push({
            platform: "reddit",
            externalId: d.id,
            permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : undefined,
            feedLabel: `r/${sub}`,
            text,
            attachmentUrls: attachments,
            observedAt: d.created_utc
              ? new Date(d.created_utc * 1000).toISOString()
              : new Date().toISOString(),
          });
        }
      }

      if (posts.length === 0 && !clientId && process.env.DISCOVERY_SOCIAL_REQUIRE_REDDIT_OAUTH === "true") {
        return disabledResult(`missing credentials: ${idKey}/${secretKey}`);
      }

      return okResult(posts);
    },
  };
}

interface RedditListing {
  data?: {
    children?: Array<{
      data?: {
        id?: string;
        title?: string;
        selftext?: string;
        url?: string;
        permalink?: string;
        created_utc?: number;
      };
    }>;
  };
}
