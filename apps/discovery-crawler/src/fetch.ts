// Concept: HTTP-first fetch with Playwright fallback (§11.6) + SSRF guards.
import { domainFromUrl } from "@quizzeira/shared";
import { getBrowser } from "./browser.js";
import { crawlerEnv } from "./env.js";
import { waitForDomain } from "./politeness.js";

const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.1 (+https://quizzeira.local; research; polite)";

const BLOCKED_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|\[::1\])/i;

export function assertSafeUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("invalid_url");
  }
  if (!/^https?:$/i.test(parsed.protocol)) throw new Error("unsupported_scheme");
  if (BLOCKED_HOST_RE.test(parsed.hostname) || parsed.hostname.endsWith(".local")) {
    throw new Error("ssrf_blocked_host");
  }
  return parsed;
}

export interface FetchResult {
  url: string;
  status: number;
  contentType: string | null;
  body: Buffer;
  etag: string | null;
  lastModified: string | null;
  via: "http" | "playwright";
}

function textDensity(html: string): number {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length;
}

export async function fetchUrl(
  url: string,
  opts: { politenessMs?: number; allowPlaywright?: boolean } = {},
): Promise<FetchResult> {
  const parsed = assertSafeUrl(url);
  const domain = domainFromUrl(url) || parsed.hostname;
  await waitForDomain(domain, opts.politenessMs ?? 1500);

  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(crawlerEnv.navigationTimeoutMs),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > crawlerEnv.maxArtifactBytes) {
    throw new Error("artifact_too_large");
  }
  const contentType = res.headers.get("content-type");
  const isHtml = /html/i.test(contentType ?? "") || buf.slice(0, 64).toString("utf8").includes("<html");
  if (
    opts.allowPlaywright !== false &&
    isHtml &&
    res.ok &&
    textDensity(buf.toString("utf8")) < 2000
  ) {
    const browserBuf = await fetchWithPlaywright(url);
    return {
      url,
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: browserBuf,
      etag: null,
      lastModified: null,
      via: "playwright",
    };
  }
  return {
    url: res.url || url,
    status: res.status,
    contentType,
    body: buf,
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    via: "http",
  };
}

async function fetchWithPlaywright(url: string): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT, locale: "pt-BR" });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(crawlerEnv.navigationTimeoutMs);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const html = await page.content();
    return Buffer.from(html, "utf8");
  } finally {
    await context.close();
  }
}
