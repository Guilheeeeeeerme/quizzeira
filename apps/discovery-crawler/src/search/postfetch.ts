// Concept: Post-fetch rejects for topic-query knowledge pages (§17.3).

const CTA = /inscreva-se|assine|compre|cupom|desconto|plano\s+premium/i;
const PT_HINT =
  /\b(de|da|do|que|para|com|uma|não|são|artigo|lei|concordância|verbo)\b/i;

export type PostFetchRejectReason =
  | "too_short"
  | "link_density"
  | "cta_ratio"
  | "language"
  | null;

/** Deterministic checks on fetched HTML/text before storing as knowledge. */
export function rejectAfterFetch(input: {
  text: string;
  html?: string | null;
}): PostFetchRejectReason {
  const text = input.text.replace(/\s+/g, " ").trim();
  if (text.length < 1200) return "too_short";

  const html = input.html ?? "";
  const linkChars = (html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []).join("").length;
  const linkDensity = html.length > 0 ? linkChars / html.length : 0;
  if (linkDensity > 0.25) return "link_density";

  const blocks = text.split(/(?<=[.!?])\s+/).filter((b) => b.trim().length > 20);
  const ctaBlocks = blocks.filter((b) => CTA.test(b)).length;
  const ctaRatio = ctaBlocks / Math.max(blocks.length, 1);
  if (ctaRatio > 0.2) return "cta_ratio";

  if (!PT_HINT.test(text.slice(0, 2000))) return "language";

  return null;
}

export function htmlToRoughText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
