import type {
  LocaleCode,
  PastExamSearchHit,
  PastExamSearchRequest,
} from "@quizzeira/shared";
import { bankSearchCooldownKey, hashSourceUrl, slugifyKey } from "@quizzeira/shared";
import { env } from "../lib/env";
import { extractMcqCandidates } from "../lib/past-exam-extract";
import { redis } from "../lib/redis";
import { STARTER_DISCOVERY_ORGS } from "../lib/crawler-seed";
import { proposeBankDeposit } from "./bank-proposal.store";
import { storeBankSource } from "./question-bank.store";

const FIRECRAWL_SEARCH = "https://api.firecrawl.dev/v1/search";
const FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v1/scrape";

interface FirecrawlSearchItem {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

function buildSearchQueries(input: PastExamSearchRequest & { examSlug: string }): string[] {
  const label = input.examSlug.replace(/-/g, " ");
  const emphasis = input.emphasis?.trim();
  const subject = input.subjects[0] ?? "";
  const base = [
    // Portuguese search phrases (Firecrawl / web search — external query language).
    `${label} prova anterior concurso PDF site:pciconcursos.com.br`,
    `${label} prova anterior concurso PDF`,
    `${label} Cesgranrio questões resolvidas ${emphasis ?? subject}`.trim(),
    `${label} gabarito prova objetiva ${subject || emphasis || ""}`.trim(),
  ];

  const seed = STARTER_DISCOVERY_ORGS.find(
    (o) => o.examSlug === input.examSlug || input.examSlug.startsWith(o.examSlug),
  );
  if (seed) base.unshift(...seed.searchQueries);

  return [...new Set(base.map((q) => q.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(
    0,
    4,
  );
}

export { extractMcqCandidates };
async function firecrawlSearch(query: string): Promise<FirecrawlSearchItem[]> {
  if (!env.firecrawlApiKey) return [];

  const res = await fetch(FIRECRAWL_SEARCH, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.firecrawlApiKey}`,
    },
    body: JSON.stringify({
      query,
      limit: 5,
      lang: "pt",
      country: "br",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl search ${res.status}: ${body.slice(0, 180)}`);
  }
  const json = (await res.json()) as {
    data?: FirecrawlSearchItem[] | { web?: FirecrawlSearchItem[] };
  };
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.web)) return json.data.web;
  return [];
}

async function firecrawlScrapeMarkdown(url: string): Promise<string | null> {
  if (!env.firecrawlApiKey) return null;
  const res = await fetch(FIRECRAWL_SCRAPE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.firecrawlApiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { markdown?: string } };
  return json.data?.markdown?.trim() || null;
}

export async function searchPastExams(input: PastExamSearchRequest): Promise<{
  provider: "firecrawl" | "none";
  skipped: boolean;
  reason?: string;
  hits: PastExamSearchHit[];
  extracted: number;
  upserted: number;
}> {
  if (!input.examSlug?.trim()) {
    return {
      provider: "none",
      skipped: true,
      reason: "examSlug required",
      hits: [],
      extracted: 0,
      upserted: 0,
    };
  }
  const examSlug = slugifyKey(input.examSlug);
  if (!env.pastExamSearchEnabled) {
    return {
      provider: "none",
      skipped: true,
      reason: "PAST_EXAM_SEARCH_ENABLED=false",
      hits: [],
      extracted: 0,
      upserted: 0,
    };
  }
  if (!env.firecrawlApiKey) {
    return {
      provider: "none",
      skipped: true,
      reason: "FIRECRAWL_API_KEY unset — configure to enable live past-exam search",
      hits: [],
      extracted: 0,
      upserted: 0,
    };
  }

  const cooldownKey = bankSearchCooldownKey(examSlug);
  const cooling = await redis.get(cooldownKey);
  if (cooling) {
    return {
      provider: "firecrawl",
      skipped: true,
      reason: "search cooldown active for this examSlug",
      hits: [],
      extracted: 0,
      upserted: 0,
    };
  }

  const queries = buildSearchQueries({ ...input, examSlug });
  const hits: PastExamSearchHit[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();

  for (const query of queries) {
    const results = await firecrawlSearch(query);
    for (const item of results) {
      const url = item.url?.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      const urlHash = hashSourceUrl(url);
      const hit: PastExamSearchHit = {
        url,
        urlHash,
        title: item.title?.trim() || url,
        snippet: item.description?.trim() || "",
        queriedAt: now,
      };
      hits.push(hit);
      await storeBankSource({
        kind: "past_exam",
        url,
        urlHash,
        title: hit.title,
        fetchedAt: now,
        snippet: hit.snippet,
      });
      if (hits.length >= 8) break;
    }
    if (hits.length >= 8) break;
  }

  let extracted = 0;
  let upserted = 0;
  const locale: LocaleCode = input.locale === "en" ? "en" : "pt";
  const subject = input.subjects[0] ?? input.emphasis ?? "geral";

  for (const hit of hits.slice(0, 2)) {
    const markdown = await firecrawlScrapeMarkdown(hit.url);
    if (!markdown) continue;
    const candidates = extractMcqCandidates(markdown, 6);
    extracted += candidates.length;
    if (candidates.length === 0) continue;
    // HITL: stage past-exam scrape deposits; admin approve applies to bank.
    await proposeBankDeposit({
      examSlug,
      emphasis: input.emphasis ?? null,
      subject,
      locale,
      source: {
        kind: "past_exam",
        url: hit.url,
        urlHash: hit.urlHash,
        title: hit.title,
        fetchedAt: now,
      },
      questions: candidates,
    });
    upserted += candidates.length;
  }

  await redis.set(cooldownKey, "1", "EX", env.pastExamSearchCooldownSec);

  return {
    provider: "firecrawl",
    skipped: false,
    hits,
    extracted,
    upserted,
  };
}
