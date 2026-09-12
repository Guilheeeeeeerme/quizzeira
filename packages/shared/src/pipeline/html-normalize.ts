/** Deterministic HTML/text normalization for NormalizedDocument (§13). */

import { htmlToRoughText, normalizeWhitespace } from "./html-decode";

export interface CleaningEvent {
  rule: string;
  removedChars: number;
}

export interface NormalizeResult {
  text: string;
  events: CleaningEvent[];
}

const BOILERPLATE_LINE_RE =
  /^(voltar|home|cookie|aceitar|privacidade|todos\s+os\s+direitos|copyright|menu|login|cadastre-se|assine)\b/i;

export function cleanPlainText(raw: string): NormalizeResult {
  const events: CleaningEvent[] = [];
  let text = normalizeWhitespace(raw);

  const beforeBoiler = text.length;
  text = text
    .split("\n")
    .filter((line) => !BOILERPLATE_LINE_RE.test(line.trim()))
    .join("\n");
  if (text.length < beforeBoiler) {
    events.push({ rule: "boilerplate_lines", removedChars: beforeBoiler - text.length });
  }

  const beforePage = text.length;
  text = text.replace(/^\s*\d+\s*$/gm, "");
  text = text.replace(/p[aá]gina\s+\d+\s+de\s+\d+/gi, "");
  if (text.length < beforePage) {
    events.push({ rule: "page_artifacts", removedChars: beforePage - text.length });
  }

  text = normalizeWhitespace(text);
  return { text, events };
}

export function normalizeHtmlDocument(html: string): NormalizeResult {
  const rough = htmlToRoughText(html);
  return cleanPlainText(rough);
}

/** Idempotent: clean(clean(x)) ≈ clean(x). */
export function cleanIdempotent(text: string): string {
  return cleanPlainText(cleanPlainText(text).text).text;
}
