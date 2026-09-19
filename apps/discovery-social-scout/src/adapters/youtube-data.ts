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
 * YouTube Data API v3 search — public video metadata + descriptions.
 * Docs: https://developers.google.com/youtube/v3/docs/search/list
 *
 * pt-BR shaping: `relevanceLanguage=pt`, `regionCode=BR`.
 */
export function createYoutubeDataAdapter(opts?: {
  apiKeyEnv?: string;
  fetchFn?: FetchLike;
  keywords?: string[];
  maxResults?: number;
}): SocialSourceAdapter {
  const keyEnv = opts?.apiKeyEnv ?? "YOUTUBE_API_KEY";
  return {
    id: "youtube-data",
    platform: "youtube",
    async fetchRecent() {
      const apiKey = process.env[keyEnv] ?? "";
      if (!apiKey.trim()) {
        logWarn("youtube adapter idle", {
          worker: "discovery-social-scout",
          reason: `${keyEnv} unset — disabled`,
        });
        return disabledResult(`missing credentials: ${keyEnv}`);
      }

      const loc = providerLocaleParams(resolveSocialLocale());
      const keywords = opts?.keywords ?? resolveKeywords();
      const maxResults = Math.min(Math.max(opts?.maxResults ?? 8, 1), 25);
      const posts: SocialPost[] = [];

      for (const kw of keywords.slice(0, 4)) {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("q", kw);
        url.searchParams.set("type", "video");
        url.searchParams.set("maxResults", String(maxResults));
        if (loc.youtubeRelevanceLanguage) {
          url.searchParams.set("relevanceLanguage", loc.youtubeRelevanceLanguage);
        }
        if (loc.youtubeRegionCode) {
          url.searchParams.set("regionCode", loc.youtubeRegionCode);
        }
        url.searchParams.set("key", apiKey);

        const res = await fetchJson<YtSearchResponse>(url.toString(), {
          fetchFn: opts?.fetchFn,
        });
        if (!res.ok) {
          logWarn("youtube adapter error", {
            worker: "discovery-social-scout",
            keyword: kw,
            status: res.status,
          });
          return errorResult(`YouTube Data API HTTP ${res.status}`);
        }

        for (const item of res.data.items ?? []) {
          const id = item.id?.videoId;
          if (!id) continue;
          const sn = item.snippet;
          const text = [sn?.title, sn?.description].filter(Boolean).join("\n");
          posts.push({
            platform: "youtube",
            externalId: id,
            permalink: `https://www.youtube.com/watch?v=${id}`,
            feedLabel: `yt:${kw}`,
            text,
            attachmentUrls: [],
            observedAt: sn?.publishedAt ?? new Date().toISOString(),
          });
        }
      }

      return okResult(posts);
    },
  };
}

interface YtSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
    };
  }>;
}
