import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CrawlerSource } from "@quizzeira/shared";
import { domainFromUrl } from "@quizzeira/shared";
import { chromium, type Browser, type Page } from "playwright";
import { crawlerEnv } from "./env.js";
import {
  filterOpenListings,
  parseListingHtml,
  type DiscoveredListing,
} from "./listing.js";

export type { DiscoveredListing };
export {
  filterOpenListings,
  listingsToOpenRecords,
  parseListingHtml,
} from "./listing.js";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;
  browser = await chromium.launch({ headless: crawlerEnv.headless });
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function crawlSourceListings(source: CrawlerSource): Promise<{
  listings: DiscoveredListing[];
  outboundDomains: string[];
  listingPageHtml: string | null;
  listingPageUrl: string | null;
}> {
  const startUrl = source.startUrls[0] ?? `https://${source.domain}/`;

  if (source.strategy === "fixture" || crawlerEnv.fixtureMode) {
    const fixturePath = resolve(__dirname, "../fixtures/open-listing.html");
    const html = await readFile(fixturePath, "utf8");
    const base = startUrl;
    const listings = filterOpenListings(
      parseListingHtml(html, base, source),
      source.openPatterns,
    );
    return {
      listings,
      outboundDomains: [],
      listingPageHtml: html,
      listingPageUrl: base,
    };
  }

  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "QuizzeiraExamCrawler/0.1 (+https://quizzeira.local; research; polite)",
    locale: "pt-BR",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(crawlerEnv.navigationTimeoutMs);

  const all: DiscoveredListing[] = [];
  const outbound = new Set<string>();
  let listingPageHtml: string | null = null;
  let listingPageUrl: string | null = null;

  try {
    for (const url of source.startUrls.slice(0, 2)) {
      if (/\.pdf(\?|#|$)/i.test(url)) {
        const leaf = decodeURIComponent(
          url.split("/").pop()?.replace(/\.pdf$/i, "") || "edital",
        ).replace(/[-_]+/g, " ");
        all.push({
          title: leaf.length >= 8 ? leaf : `Edital ${source.name || source.domain}`,
          href: url,
          textBlob: `${leaf} ${url}`,
        });
        continue;
      }

      await sleep(source.politenessMs);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const html = await page.content();
      if (!listingPageHtml) {
        listingPageHtml = html;
        listingPageUrl = url;
      }
      const parsed = parseListingHtml(html, url, source);
      for (const item of parsed) all.push(item);

      const hrefs = await collectHrefs(page, source.linkSelector ?? "a[href]");
      for (const href of hrefs) {
        const d = domainFromUrl(href);
        if (d && d !== source.domain) outbound.add(d);
      }
    }
  } finally {
    await context.close();
  }

  const listings = filterOpenListings(all, source.openPatterns).slice(
    0,
    crawlerEnv.maxOpenPerSource,
  );
  return {
    listings,
    outboundDomains: [...outbound].slice(0, 10),
    listingPageHtml,
    listingPageUrl,
  };
}

export async function fetchWithPlaywright(
  url: string,
  politenessMs: number,
): Promise<{ html: string }> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "QuizzeiraExamCrawler/0.1 (+https://quizzeira.local; research; polite)",
    locale: "pt-BR",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(crawlerEnv.navigationTimeoutMs);
  try {
    await sleep(politenessMs);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return { html: await page.content() };
  } finally {
    await context.close();
  }
}

async function collectHrefs(page: Page, selector: string): Promise<string[]> {
  return page.$$eval(selector, (nodes) =>
    nodes
      .map((n) => (n as HTMLAnchorElement).href)
      .filter((h) => typeof h === "string" && h.startsWith("http")),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}
