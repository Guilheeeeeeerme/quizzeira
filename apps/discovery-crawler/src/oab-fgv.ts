// Concept: Ingestion (oab.fgv.br, the one source that gets its own crawl)
//
// Every other source is a listing of open editais that the generic crawler can
// read off the page. FGV's OAB portal is neither: the exam is permanent rather
// than "open", and its edition pages render nothing until an ASP.NET postback
// fires on the seccional <select>. A plain fetch returns an empty document.
//
// So this strategy walks the known edition catalog instead of following links,
// forces the postback, and classifies the resulting anchors with the label
// taxonomy in @quizzeira/shared. See docs/oab-exam.md for the research.
import {
  classifyOabDocument,
  oabEditionPageUrl,
  oabExamSlug,
  oabExamTitle,
  preferDefinitiveOabDocuments,
  OAB_DOMAIN,
  OAB_EDITIONS,
  type CrawlerSource,
  type OabClassifiedDocument,
  type OabEdition,
  type OabPhase,
} from "@quizzeira/shared";
import type { Page } from "playwright";
import { getBrowser } from "./browser.js";
import { crawlerEnv } from "./env.js";

/** One exam row (edition + phase) with the documents that belong to it. */
export interface OabExamGroup {
  examSlug: string;
  title: string;
  edition: OabEdition;
  phase: OabPhase;
  documents: OabClassifiedDocument[];
}

const ANCHOR_RE = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pure parse of a rendered edition page: anchors → the documents worth storing.
 *
 * Only artifacts on FGV's own host are kept. The page also links to the
 * Conselho Federal, to social media and to the seccional sites, and none of
 * those are the banca's published documents.
 */
export function parseEditionDocuments(html: string, baseUrl: string): OabClassifiedDocument[] {
  const docs: OabClassifiedDocument[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(ANCHOR_RE)) {
    let url: string;
    try {
      // FGV serves the artifacts over plain http://; the upgrade is safe and
      // keeps the Document store free of mixed-content URLs.
      url = new URL(match[1].trim(), baseUrl).toString().replace(/^http:\/\//i, "https://");
    } catch {
      continue;
    }
    if (!url.toLowerCase().includes(OAB_DOMAIN)) continue;
    if (!/\.pdf(\?|#|$)/i.test(url)) continue;
    if (seen.has(url)) continue;

    const label = textOf(match[2]);
    const doc = classifyOabDocument(label, url);
    if (!doc) continue;

    seen.add(url);
    docs.push({ ...doc, label, url });
  }

  return preferDefinitiveOabDocuments(docs);
}

/**
 * Files an edition's documents under the exam each belongs to. The two papers
 * are separate exams — a 2ª fase item would be unanswerable in a 1ª fase quiz —
 * and the edital, which covers both, is filed with the 1ª fase.
 */
export function groupByExam(
  edition: OabEdition,
  documents: readonly OabClassifiedDocument[],
): OabExamGroup[] {
  const groups = new Map<OabPhase, OabExamGroup>();

  for (const doc of documents) {
    const phase: OabPhase = doc.phase ?? "objective";
    const group = groups.get(phase) ?? {
      examSlug: oabExamSlug(edition, phase),
      title: oabExamTitle(edition, phase),
      edition,
      phase,
      documents: [],
    };
    group.documents.push(doc);
    groups.set(phase, group);
  }

  return [...groups.values()];
}

/**
 * Renders one edition page. The document list is behind `__doPostBack` on the
 * seccional select, so the select has to be driven; the exam documents are
 * national, so any seccional yields the same list.
 */
export async function renderEditionPage(page: Page, edition: OabEdition): Promise<string> {
  await page.goto(oabEditionPageUrl(edition.fgvKey), { waitUntil: "domcontentloaded" });

  const select = page.locator("select").first();
  if ((await select.count()) > 0) {
    const values = await select
      .locator("option")
      .evaluateAll((options) =>
        options.map((o) => (o as HTMLOptionElement).value).filter((v) => v && v !== "0"),
      );
    if (values.length > 0) {
      await Promise.all([
        page.waitForLoadState("domcontentloaded"),
        select.selectOption(values[0]),
      ]).catch(() => undefined);
      // The postback replaces the document, so give the new anchors a moment.
      await page.waitForSelector("a[href$='.pdf'], a[href*='/arq/']", { timeout: 15_000 })
        .catch(() => undefined);
    }
  }

  return page.content();
}

/**
 * One crawl pass over the newest editions. Older editions are not re-read every
 * pass: their documents never change once the definitive gabarito is out, and
 * the budget is better spent on the edition candidates are actually sitting.
 */
export async function crawlOabSource(source: CrawlerSource): Promise<OabExamGroup[]> {
  const editions = [...OAB_EDITIONS]
    .sort((a, b) => b.number - a.number)
    .slice(0, crawlerEnv.maxOabEditionsPerRun);

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      "QuizzeiraExamCrawler/0.1 (+https://quizzeira.local; research; polite)",
    locale: "pt-BR",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(crawlerEnv.navigationTimeoutMs);

  const groups: OabExamGroup[] = [];
  try {
    for (const edition of editions) {
      await sleep(source.politenessMs);
      const html = await renderEditionPage(page, edition);
      const documents = parseEditionDocuments(html, oabEditionPageUrl(edition.fgvKey));
      for (const group of groupByExam(edition, documents)) groups.push(group);
    }
  } finally {
    await context.close();
  }

  return groups;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}
