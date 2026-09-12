import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import type { CrawlerSource } from "@quizzeira/shared";
import { crawlerEnv } from "./env.js";
import { fetchWithPlaywright } from "./browser.js";
import { isAllowedByRobots } from "./robots.js";
import { waitForDomain } from "./politeness.js";

export interface FetchResult {
  url: string;
  html: string;
  contentType: string;
  etag: string | null;
  lastModified: Date | null;
  contentHash: string | null;
  via: "http" | "playwright" | "fixture";
}

const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.1 (+https://quizzeira.local; research; polite)";

const FIXTURE_DETAIL = resolve(__dirname, "../fixtures/detail-page.html");
const FIXTURE_LISTING = resolve(__dirname, "../fixtures/open-listing.html");
const FIXTURE_TRIVIA = resolve(__dirname, "../fixtures/listing-trivia.html");

function hashBody(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function isSpaShell(html: string): boolean {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length < 2000;
}

async function readFixture(url: string): Promise<FetchResult | null> {
  if (!crawlerEnv.fixtureMode) return null;
  const lower = url.toLowerCase();
  let path = FIXTURE_DETAIL;
  if (/listing-trivia|trivia/.test(lower)) path = FIXTURE_TRIVIA;
  else if (/open-listing|\/concursos\/?$/.test(lower)) path = FIXTURE_LISTING;
  else if (/\.pdf(\?|#|$)/i.test(lower)) return null;
  const html = await readFile(path, "utf8");
  const buf = Buffer.from(html, "utf8");
  return {
    url,
    html,
    contentType: "text/html",
    etag: null,
    lastModified: null,
    contentHash: hashBody(buf),
    via: "fixture",
  };
}

/** HTTP-first fetch with Playwright fallback for JS-heavy portals (§11.6). */
export async function fetchPage(
  url: string,
  source: Pick<CrawlerSource, "domain" | "politenessMs">,
): Promise<FetchResult> {
  const fixture = await readFixture(url);
  if (fixture) return fixture;

  const allowed = await isAllowedByRobots(url, source.domain);
  if (!allowed) {
    throw new Error(`robots.txt disallows ${url}`);
  }

  await waitForDomain(source.domain, source.politenessMs);

  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(crawlerEnv.navigationTimeoutMs),
    });
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const etag = res.headers.get("etag");
    const lastModRaw = res.headers.get("last-modified");
    const lastModified = lastModRaw ? new Date(lastModRaw) : null;

    if (res.ok && /html/i.test(contentType)) {
      const html = await res.text();
      const buf = Buffer.from(html, "utf8");
      if (!isSpaShell(html)) {
        return {
          url,
          html,
          contentType,
          etag,
          lastModified: lastModified && !Number.isNaN(lastModified.getTime()) ? lastModified : null,
          contentHash: hashBody(buf),
          via: "http",
        };
      }
    }
  } catch {
    // Fall through to Playwright.
  }

  const pw = await fetchWithPlaywright(url, source.politenessMs);
  const buf = Buffer.from(pw.html, "utf8");
  return {
    url,
    html: pw.html,
    contentType: "text/html",
    etag: null,
    lastModified: null,
    contentHash: hashBody(buf),
    via: "playwright",
  };
}

export async function fetchBytes(
  url: string,
  source: Pick<CrawlerSource, "domain" | "politenessMs">,
): Promise<{
  buf: Buffer;
  contentType: string;
  etag: string | null;
  lastModified: Date | null;
  contentHash: string;
}> {
  const allowed = await isAllowedByRobots(url, source.domain);
  if (!allowed) {
    throw new Error(`robots.txt disallows ${url}`);
  }

  await waitForDomain(source.domain, source.politenessMs);
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(crawlerEnv.navigationTimeoutMs),
  });
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    buf,
    contentType,
    etag: res.headers.get("etag"),
    lastModified: (() => {
      const raw = res.headers.get("last-modified");
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    })(),
    contentHash: hashBody(buf),
  };
}

export { USER_AGENT };
