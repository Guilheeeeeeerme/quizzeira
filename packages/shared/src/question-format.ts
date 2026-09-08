import type { QuestionMediaRef } from "./types";

const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EMBEDDED_CHOICES_RE =
  /\n?\s*(?:alternativas?\s*:?\s*)?(?:\(?[A-Ea-e]\)?[.)]\s+.+(?:\n|$)){2,}\s*$/u;
const LEADING_CHOICE_RE = /^\s*(?:\(?[A-Ea-e]\)?[.)]|[A-Ea-e]\s*[-–—:])\s+/u;

/** Pull markdown images out of text; return cleaned text + media refs. */
export function extractMarkdownImages(raw: string): {
  text: string;
  media: QuestionMediaRef[];
} {
  const media: QuestionMediaRef[] = [];
  const text = raw
    .replace(MD_IMAGE_RE, (_full, alt: string, url: string) => {
      const href = url.trim();
      if (/^https?:\/\//i.test(href) || href.startsWith("/") || href.startsWith("data:")) {
        media.push({ url: href, alt: String(alt || "").trim() || undefined });
      }
      return "\n";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, media };
}

/**
 * When MCQ options are already structured, strip trailing A)/B)/C) blocks
 * duplicated inside the stem (common LLM failure).
 */
export function stripEmbeddedChoicesFromPrompt(
  prompt: string,
  options: string[] | null | undefined,
): string {
  if (!options || options.length < 2) return prompt.trim();
  let cleaned = prompt.trim();
  // Cut from first line that looks like "A)" / "A." if a dense choice block follows.
  const match = cleaned.match(EMBEDDED_CHOICES_RE);
  if (match && match.index !== undefined && match.index > 20) {
    cleaned = cleaned.slice(0, match.index).trim();
  }
  // Also drop an inline "A) … B) …" run on the same paragraph when options exist.
  const inline = cleaned.match(
    /\s+[A-Ea-e][.)]\s+\S[\s\S]*?[A-Ea-e][.)]\s+\S[\s\S]*$/,
  );
  if (inline && inline.index !== undefined && inline.index > 40) {
    const head = cleaned.slice(0, inline.index).trim();
    if (head.length >= 20) cleaned = head;
  }
  return cleaned.replace(/\s+$/u, "").trim();
}

/** Remove redundant "A)" / "A." prefixes from option text (UI adds the letter). */
export function stripLeadingChoiceLabel(option: string): string {
  return option.replace(LEADING_CHOICE_RE, "").trim();
}

export function mergeMedia(
  explicit: QuestionMediaRef[] | null | undefined,
  fromText: QuestionMediaRef[],
): QuestionMediaRef[] {
  const seen = new Set<string>();
  const out: QuestionMediaRef[] = [];
  for (const item of [...(explicit ?? []), ...fromText]) {
    const key = item.url.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ url: key, alt: item.alt?.trim() || undefined });
  }
  return out;
}

export function normalizeQuestionPresentation(input: {
  prompt: string;
  options?: string[] | null;
  promptMedia?: QuestionMediaRef[] | null;
  optionMedia?: Array<QuestionMediaRef[] | null> | null;
}): {
  prompt: string;
  options: string[] | null;
  promptMedia: QuestionMediaRef[];
  optionMedia: Array<QuestionMediaRef[] | null> | null;
} {
  const options = input.options?.map(stripLeadingChoiceLabel) ?? null;
  const stem = stripEmbeddedChoicesFromPrompt(input.prompt, options);
  const promptParsed = extractMarkdownImages(stem);
  const promptMedia = mergeMedia(input.promptMedia, promptParsed.media);

  let optionMedia: Array<QuestionMediaRef[] | null> | null = null;
  let cleanedOptions: string[] | null = options;
  if (options) {
    cleanedOptions = [];
    optionMedia = [];
    for (let i = 0; i < options.length; i += 1) {
      const parsed = extractMarkdownImages(options[i] ?? "");
      cleanedOptions.push(parsed.text || options[i] || "");
      const merged = mergeMedia(input.optionMedia?.[i] ?? null, parsed.media);
      optionMedia.push(merged.length ? merged : null);
    }
  }

  return {
    prompt: promptParsed.text,
    options: cleanedOptions,
    promptMedia,
    optionMedia,
  };
}

export function choiceLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
