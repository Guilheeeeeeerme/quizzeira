import { logWarn } from "@quizzeira/worker-kit";
import { fetchJson } from "../http.js";
import {
  disabledResult,
  errorResult,
  okResult,
  type FetchLike,
  type SocialPost,
  type SocialSourceAdapter,
} from "../types.js";

/**
 * Facebook Graph API — public Page feed posts the token is allowed to read.
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/feed
 * No private groups / auth-wall bypass.
 */
export function createFacebookGraphAdapter(opts?: {
  tokenEnv?: string;
  pageIdsEnv?: string;
  fetchFn?: FetchLike;
  limit?: number;
}): SocialSourceAdapter {
  const tokenKey = opts?.tokenEnv ?? "FACEBOOK_ACCESS_TOKEN";
  const pagesKey = opts?.pageIdsEnv ?? "FACEBOOK_PAGE_IDS";
  return {
    id: "facebook-graph",
    platform: "facebook",
    async fetchRecent() {
      const token =
        process.env[tokenKey] ?? process.env.META_GRAPH_ACCESS_TOKEN ?? "";
      const pagesRaw = process.env[pagesKey] ?? "";
      const pageIds = pagesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!token.trim() || pageIds.length === 0) {
        logWarn("facebook adapter idle", {
          worker: "discovery-social-scout",
          reason: `${tokenKey} and ${pagesKey} required — disabled`,
        });
        return disabledResult(`missing credentials: ${tokenKey} and/or ${pagesKey}`);
      }

      const limit = Math.min(Math.max(opts?.limit ?? 15, 1), 50);
      const posts: SocialPost[] = [];

      for (const pageId of pageIds) {
        const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/feed`);
        url.searchParams.set(
          "fields",
          "id,message,created_time,permalink_url,attachments{unshimmed_url,url,title,description}",
        );
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("access_token", token);

        const res = await fetchJson<FbFeedResponse>(url.toString(), {
          fetchFn: opts?.fetchFn,
        });
        if (!res.ok) {
          logWarn("facebook adapter error", {
            worker: "discovery-social-scout",
            pageId,
            status: res.status,
          });
          return errorResult(`Facebook Graph HTTP ${res.status}`);
        }

        for (const item of res.data.data ?? []) {
          const attachments: string[] = [];
          for (const att of item.attachments?.data ?? []) {
            const u = att.unshimmed_url ?? att.url;
            if (u) attachments.push(u);
          }
          const text = [item.message, ...(item.attachments?.data ?? []).map((a) => a.title ?? a.description ?? "")]
            .filter(Boolean)
            .join("\n");
          posts.push({
            platform: "facebook",
            externalId: item.id,
            permalink: item.permalink_url,
            feedLabel: `fb:${pageId}`,
            text,
            attachmentUrls: attachments,
            observedAt: item.created_time ?? new Date().toISOString(),
          });
        }
      }

      return okResult(posts);
    },
  };
}

interface FbFeedResponse {
  data?: Array<{
    id: string;
    message?: string;
    created_time?: string;
    permalink_url?: string;
    attachments?: {
      data?: Array<{
        unshimmed_url?: string;
        url?: string;
        title?: string;
        description?: string;
      }>;
    };
  }>;
}
