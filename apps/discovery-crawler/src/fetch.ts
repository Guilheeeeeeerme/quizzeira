/** HTTP-first fetch with content-type sniffing (§11). */

import { crawlerEnv } from "./env.js";
import { isPublicHttpUrl } from "./robots.js";

const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.2 (+https://quizzeira.local; research; polite)";

export interface FetchResult {
  ok: boolean;
  status: number;
  contentType: string;
  buffer: Buffer | null;
  etag: string | null;
  lastModified: string | null;
  error?: string;
}

export async function fetchBytes(url: string, maxBytes = crawlerEnv.maxArtifactBytes): Promise<FetchResult> {
  if (!isPublicHttpUrl(url)) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      buffer: null,
      etag: null,
      lastModified: null,
      error: "ssrf_blocked",
    };
  }

  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(crawlerEnv.navigationTimeoutMs),
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        contentType,
        buffer: null,
        etag,
        lastModified,
        error: `http_${res.status}`,
      };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      return {
        ok: false,
        status: res.status,
        contentType,
        buffer: null,
        etag,
        lastModified,
        error: "too_large",
      };
    }
    return {
      ok: true,
      status: res.status,
      contentType,
      buffer: buf,
      etag,
      lastModified,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      buffer: null,
      etag: null,
      lastModified: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export { USER_AGENT };
