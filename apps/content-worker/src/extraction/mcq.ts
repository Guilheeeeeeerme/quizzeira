// Concept: Extraction (prova + gabarito → verbatim multiple-choice items)
//
// Past exams already contain the questions, so generating new ones from them
// would be wasteful and less faithful. When a prova ships a readable answer key
// the items are recovered as-is; otherwise this yields nothing and the document
// contributes chunks only, leaving Generation to work from it.
export interface ExtractedMcq {
  number: number;
  prompt: string;
  options: string[];
  correctIndex: number;
}

const OPTION_LABELS = ["a", "b", "c", "d", "e"];
const MIN_OPTIONS = 4;

/**
 * Reads an answer key in the notations Brazilian bancas use: `1 - A`, `01) B`,
 * `12. C`, `3 (D)`. Returns question number → option index.
 */
export function parseAnswerKey(rawText: string): Map<number, number> {
  const key = new Map<number, number>();
  const pattern = /(?:^|[\n;,\s])(\d{1,3})\s*[-.):]?\s*\(?([A-Ea-e])\)?(?=[\s,;]|$)/g;
  for (const match of rawText.replace(/\r\n/g, "\n").matchAll(pattern)) {
    const number = Number(match[1]);
    const index = OPTION_LABELS.indexOf(match[2].toLowerCase());
    if (!Number.isFinite(number) || number < 1 || index < 0) continue;
    if (!key.has(number)) key.set(number, index);
  }
  return key;
}

/**
 * Splits the answer-key section off the body so key lines are never mistaken
 * for question text. `key` is empty when the document has no key section.
 */
export function splitAnswerKeySection(rawText: string): { body: string; key: string } {
  const text = rawText.replace(/\r\n/g, "\n");
  const match = /\n\s*(gabarito|chave\s+de\s+respostas?|respostas?\s+oficiais?)\b[^\n]*\n/i.exec(
    text,
  );
  if (!match || match.index == null) return { body: text, key: "" };
  return { body: text.slice(0, match.index), key: text.slice(match.index + match[0].length) };
}

interface QuestionBlock {
  number: number;
  prompt: string;
  options: string[];
}

/** Splits a prova body into numbered question blocks with lettered options. */
export function parseQuestionBlocks(body: string): QuestionBlock[] {
  const text = body.replace(/\r\n/g, "\n");
  const starts: Array<{ number: number; at: number; headerLength: number }> = [];
  const header = /(?:^|\n)\s*(?:quest(?:ão|ao)\s*)?(\d{1,3})\s*[-.)]\s+/gi;
  for (const match of text.matchAll(header)) {
    if (match.index == null) continue;
    const number = Number(match[1]);
    if (!Number.isFinite(number) || number < 1) continue;
    starts.push({ number, at: match.index, headerLength: match[0].length });
  }

  const blocks: QuestionBlock[] = [];
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1].at : text.length;
    const raw = text.slice(start.at + start.headerLength, end).trim();
    if (!raw) continue;
    const parsed = parseOptions(raw);
    if (!parsed) continue;
    blocks.push({ number: start.number, ...parsed });
  }
  return blocks;
}

function parseOptions(block: string): { prompt: string; options: string[] } | null {
  const marker = /(?:^|\n)\s*\(?([A-Ea-e])\)\s*|(?:^|\n)\s*([A-Ea-e])\s*[-.)]\s+/g;
  const found: Array<{ label: string; at: number; length: number }> = [];
  for (const match of block.matchAll(marker)) {
    if (match.index == null) continue;
    const label = (match[1] ?? match[2] ?? "").toLowerCase();
    if (label) found.push({ label, at: match.index, length: match[0].length });
  }
  // Option markers must run a, b, c, d… in order. Anything else is prose that
  // happens to contain a parenthesised letter.
  const ordered = found.filter((entry, i) => entry.label === OPTION_LABELS[i]);
  if (ordered.length < MIN_OPTIONS) return null;

  const prompt = block.slice(0, ordered[0].at).replace(/\s+/g, " ").trim();
  if (!prompt) return null;

  const options: string[] = [];
  for (let i = 0; i < ordered.length; i += 1) {
    const from = ordered[i].at + ordered[i].length;
    const to = i + 1 < ordered.length ? ordered[i + 1].at : block.length;
    const value = block.slice(from, to).replace(/\s+/g, " ").trim();
    if (!value) return null;
    options.push(value);
  }
  return { prompt, options: options.slice(0, MIN_OPTIONS) };
}

/**
 * Full pass: prova body plus answer key → multiple-choice items. `extraKeyText`
 * carries the key when it arrives as a separate gabarito document. Only
 * questions whose answer is known survive, so callers can draft them directly.
 */
export function extractMcqs(rawText: string, extraKeyText = ""): ExtractedMcq[] {
  if (!rawText.trim()) return [];
  const { body, key } = splitAnswerKeySection(rawText);
  const answers = parseAnswerKey(`${key}\n${extraKeyText}`);
  if (answers.size === 0) return [];

  const questions: ExtractedMcq[] = [];
  for (const block of parseQuestionBlocks(body)) {
    const correctIndex = answers.get(block.number);
    if (correctIndex == null || correctIndex >= block.options.length) continue;
    const distinct = new Set(block.options.map((option) => option.trim().toLowerCase()));
    if (distinct.size !== block.options.length) continue;
    questions.push({ number: block.number, prompt: block.prompt, options: block.options, correctIndex });
  }
  return questions;
}
