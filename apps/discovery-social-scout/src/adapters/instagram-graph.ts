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
 * Instagram Graph API — public media from Instagram Business / Creator accounts
 * the operator is authorized to read (Page-linked IG user).
 * Docs: https://developers.facebook.com/docs/instagram-api/
 *
 * There is no official arbitrary public hashtag crawl without a Business account
 * and Graph permissions. We only fetch media for configured IG user IDs.
 */
export function createInstagramGraphAdapter(opts?: {
  tokenEnv?: string;
  accountIdsEnv?: string;
  fetchFn?: FetchLike;
  limit?: number;
}): SocialSourceAdapter {
  const tokenKey = opts?.tokenEnv ?? "INSTAGRAM_ACCESS_TOKEN";
  const idsKey = opts?.accountIdsEnv ?? "INSTAGRAM_BUSINESS_ACCOUNT_IDS";
  return {
    id: "instagram-graph",
    platform: "instagram",
    async fetchRecent() {
      const token =
        process.env[tokenKey] ?? process.env.META_GRAPH_ACCESS_TOKEN ?? "";
      const idsRaw = process.env[idsKey] ?? "";
      const accountIds = idsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!token.trim() || accountIds.length === 0) {
        logWarn("instagram adapter idle", {
          worker: "discovery-social-scout",
          reason: `${tokenKey} and ${idsKey} required — disabled`,
        });
        return disabledResult(
          `missing credentials: ${tokenKey} and/or ${idsKey} (Business accounts only; no auth-wall bypass)`,
        );
      }

      const limit = Math.min(Math.max(opts?.limit ?? 12, 1), 50);
      const posts: SocialPost[] = [];

      for (const igUserId of accountIds) {
        const url = new URL(`https://graph.facebook.com/v21.0/${igUserId}/media`);
        url.searchParams.set(
          "fields",
          "id,caption,permalink,timestamp,media_type,media_url,children{media_url}",
        );
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("access_token", token);

        const res = await fetchJson<IgMediaResponse>(url.toString(), {
          fetchFn: opts?.fetchFn,
        });
        if (!res.ok) {
          logWarn("instagram adapter error", {
            worker: "discovery-social-scout",
            igUserId,
            status: res.status,
          });
          return errorResult(`Instagram Graph HTTP ${res.status}`);
        }

        for (const media of res.data.data ?? []) {
          const attachments: string[] = [];
          if (media.media_url) attachments.push(media.media_url);
          for (const child of media.children?.data ?? []) {
            if (child.media_url) attachments.push(child.media_url);
          }
          posts.push({
            platform: "instagram",
            externalId: media.id,
            permalink: media.permalink,
            feedLabel: `ig:${igUserId}`,
            text: media.caption ?? "",
            attachmentUrls: attachments,
            observedAt: media.timestamp ?? new Date().toISOString(),
          });
        }
      }

      return okResult(posts);
    },
  };
}

interface IgMediaResponse {
  data?: Array<{
    id: string;
    caption?: string;
    permalink?: string;
    timestamp?: string;
    media_url?: string;
    children?: { data?: Array<{ media_url?: string }> };
  }>;
}
