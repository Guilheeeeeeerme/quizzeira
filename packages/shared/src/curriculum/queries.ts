// Concept: Deterministic query construction for topic-driven discovery (§17.2).
import { isLegalSubject, subjectById } from "./lexicon";
import { DEFAULT_QUERY_TEMPLATES, QUERY_TEMPLATES_BY_FAMILY } from "./query-templates";

export interface QueryLeaf {
  title: string;
  rawText: string;
}

export interface QueryContext {
  subject: { id: string | null; canonical: string };
  topic: { title: string } | null;
  leaf: QueryLeaf;
}

const NORM_RE =
  /\b(lei\s+complementar|lei|decreto(?:-lei)?|s[úu]mula(?:\s+vinculante)?|resolu[çc][ãa]o|portaria|instru[çc][ãa]o\s+normativa|medida\s+provis[óo]ria|emenda\s+constitucional)\s*(?:federal|estadual|municipal)?\s*(?:n[ºo°.]?\s*)?([\d.]+(?:\/\d{2,4})?)/i;

/** "Lei nº 14.133/2021" → "Lei 14.133/2021"; null when no norm is referenced. */
export function extractNormReference(text: string): string | null {
  const match = NORM_RE.exec(text);
  if (!match) return null;
  const kind = match[1].replace(/\s+/g, " ").trim();
  const number = match[2].replace(/\.$/, "");
  if (!/\d/.test(number)) return null;
  const normalizedKind = kind.replace(/^lei\b/i, "Lei").replace(/^decreto/i, "Decreto");
  return `${normalizedKind.charAt(0).toUpperCase()}${normalizedKind.slice(1)} ${number}`;
}

export function mentionsNorm(text: string): boolean {
  return /\b(lei|decreto|art\.|c[óo]digo|s[úu]mula|constitui[çc][ãa]o)\b/i.test(text);
}

function fill(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** ≤ 3 queries per leaf. Legal leaves that cite a norm get a direct reference first. */
export function buildTopicQueries(ctx: QueryContext): string[] {
  const subject = ctx.subject.id ? subjectById(ctx.subject.id) : null;
  const family = subject?.family ?? "general";
  const set = QUERY_TEMPLATES_BY_FAMILY[family] ?? DEFAULT_QUERY_TEMPLATES;
  const vars = {
    leaf: ctx.leaf.title,
    topic: ctx.topic?.title ?? "",
    subject: ctx.subject.canonical,
  };
  const queries = set.templates.map((t) => fill(t, vars)).filter(Boolean);
  if (isLegalSubject(ctx.subject.id) && mentionsNorm(ctx.leaf.rawText)) {
    const norm = extractNormReference(ctx.leaf.rawText);
    if (norm) queries[0] = norm;
  }
  const seen = new Set<string>();
  return queries
    .filter((q) => {
      const key = q.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}
