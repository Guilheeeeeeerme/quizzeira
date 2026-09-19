import { logWarn } from "@quizzeira/worker-kit";
import { fetchJson } from "../http.js";
import { resolveKeywords } from "../keywords.js";
import {
  disabledResult,
  errorResult,
  okResult,
  type FetchLike,
  type SocialPost,
  type SocialSourceAdapter,
} from "../types.js";

/**
 * Google Custom Search JSON API — documented public search results.
 * Docs: https://developers.google.com/custom-search/v1/overview
 * Requires API key + Programmable Search Engine (cx).
 */
export function createGoogleCseAdapter(opts?: {
  apiKeyEnv?: string;
  cxEnv?: string;
  fetchFn?: FetchLike;
  keywords?: string[];
  resultsPerKeyword?: number;
}): SocialSourceAdapter {
  const keyEnv = opts?.apiKeyEnv ?? "GOOGLE_CSE_API_KEY";
  const cxEnv = opts?.cxEnv ?? "GOOGLE_CSE_CX";
  return {
    id: "google-cse",
    platform: "google",
    async fetchRecent() {
      const apiKey = process.env[keyEnv] ?? "";
      const cx = process.env[cxEnv] ?? "";
      if (!apiKey.trim() || !cx.trim()) {
        logWarn("google-cse adapter idle", {
          worker: "discovery-social-scout",
          reason: `${keyEnv}/${cxEnv} unset — disabled`,
        });
        return disabledResult(`missing credentials: ${keyEnv} and/or ${cxEnv}`);
      }

      const keywords = opts?.keywords ?? resolveKeywords();
      const per = Math.min(Math.max(opts?.resultsPerKeyword ?? 5, 1), 10);
      const posts: SocialPost[] = [];

      for (const kw of keywords.slice(0, 5)) {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("cx", cx);
        url.searchParams.set("q", `${kw} (filetype:pdf OR edital OR gabarito OR prova)`);
        url.searchParams.set("num", String(per));
        url.searchParams.set("lr", "lang_pt");

        const res = await fetchJson<GoogleCseResponse>(url.toString(), {
          fetchFn: opts?.fetchFn,
        });
        if (!res.ok) {
          logWarn("google-cse adapter error", {
            worker: "discovery-social-scout",
            keyword: kw,
            status: res.status,
          });
          return errorResult(`Google CSE HTTP ${res.status}`);
        }

        for (const item of res.data.items ?? []) {
          const link = item.link ?? "";
          const snippet = [item.title, item.snippet].filter(Boolean).join(" — ");
          posts.push({
            platform: "google",
            externalId: item.cacheId ?? link,
            permalink: link || undefined,
            feedLabel: `google-cse:${kw}`,
            text: `${snippet} ${link}`.trim(),
            attachmentUrls: link ? [link] : [],
            observedAt: new Date().toISOString(),
          });
        }
      }

      return okResult(posts);
    },
  };
}

interface GoogleCseResponse {
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    cacheId?: string;
  }>;
}
