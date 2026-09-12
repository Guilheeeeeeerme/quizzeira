// Concept: pt-BR stemming for lexical syllabus mapping (§21.1).
//
// A compact suffix-stripping stemmer in the RSLP/Snowball family. It is not a
// linguistic stemmer; it only needs to make "concordância"/"concordâncias",
// "verbal"/"verbais" and "licitação"/"licitações" collide, deterministically.
import { foldAccents } from "../dedup/text-normalize";

const STOPWORDS_PT = new Set([
  "a", "o", "e", "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "um", "uma",
  "uns", "umas", "para", "por", "com", "sem", "sobre", "entre", "ao", "aos", "as", "os", "que",
  "se", "ou", "mas", "como", "mais", "menos", "muito", "seu", "sua", "seus", "suas", "ser", "ter",
  "sao", "são", "é", "e", "foi", "era", "são", "pelo", "pela", "pelos", "pelas", "este", "esta",
  "esse", "essa", "isso", "isto", "aquele", "aquela", "ele", "ela", "eles", "elas", "nao", "não",
  "ja", "já", "também", "tambem", "ate", "até", "quando", "onde", "qual", "quais", "cada", "todo",
  "toda", "todos", "todas", "outro", "outra", "outros", "outras", "mesmo", "mesma", "assim", "ainda",
  "geral", "gerais", "nocoes", "noções", "conceito", "conceitos", "aspectos", "principais",
  "the", "of", "and", "in", "to", "for", "with", "on", "at", "by", "an", "is", "are",
]);

export function isStopword(token: string): boolean {
  return STOPWORDS_PT.has(token) || STOPWORDS_PT.has(foldAccents(token));
}

const PLURAL_RULES: Array<[RegExp, string, number]> = [
  [/ões$/, "ão", 3],
  [/ães$/, "ão", 3],
  [/ais$/, "al", 3],
  [/éis$/, "el", 3],
  [/eis$/, "el", 3],
  [/óis$/, "ol", 3],
  [/is$/, "il", 3],
  [/les$/, "l", 3],
  [/res$/, "r", 3],
  [/ns$/, "m", 2],
  [/s$/, "", 3],
];

const FEMININE_RULES: Array<[RegExp, string, number]> = [
  [/ona$/, "ão", 3],
  [/ora$/, "or", 3],
  [/esa$/, "ês", 3],
  [/na$/, "no", 4],
  [/inha$/, "inho", 3],
  [/osa$/, "oso", 3],
  [/iva$/, "ivo", 3],
  [/eira$/, "eiro", 3],
];

const NOUN_SUFFIXES = [
  "amentos", "imentos", "amento", "imento", "adoras", "adores", "adora", "ador", "ância",
  "ência", "idades", "idade", "ismos", "ismo", "istas", "ista", "ários", "ário", "ável",
  "ível", "mente", "ções", "ção", "ções", "ança", "ença", "eza", "ezas", "ura", "uras",
  "oso", "osa", "osos", "osas", "ico", "ica", "icos", "icas", "al", "ais",
];

const VERB_SUFFIXES = [
  "aríamos", "eríamos", "iríamos", "ássemos", "êssemos", "íssemos", "aremos", "eremos",
  "iremos", "ávamos", "íamos", "ariam", "eriam", "iriam", "assem", "essem", "issem", "ando",
  "endo", "indo", "aram", "eram", "iram", "arão", "erão", "irão", "aria", "eria", "iria",
  "asse", "esse", "isse", "ados", "idos", "amos", "emos", "imos", "ado", "ido", "ava", "ia",
  "ar", "er", "ir", "ou", "am", "em",
];

function stripAccentsKeepingTilde(word: string): string {
  return word;
}

export function stemPt(rawToken: string): string {
  let word = rawToken.toLowerCase().normalize("NFC");
  if (word.length <= 3) return foldAccents(word);
  word = stripAccentsKeepingTilde(word);

  for (const [re, rep, min] of PLURAL_RULES) {
    if (re.test(word) && word.replace(re, rep).length >= min) {
      word = word.replace(re, rep);
      break;
    }
  }
  for (const [re, rep, min] of FEMININE_RULES) {
    if (re.test(word) && word.replace(re, rep).length >= min) {
      word = word.replace(re, rep);
      break;
    }
  }
  const folded = foldAccents(word);
  for (const suffix of NOUN_SUFFIXES) {
    const f = foldAccents(suffix);
    if (folded.endsWith(f) && folded.length - f.length >= 3) {
      return folded.slice(0, folded.length - f.length);
    }
  }
  for (const suffix of VERB_SUFFIXES) {
    const f = foldAccents(suffix);
    if (folded.endsWith(f) && folded.length - f.length >= 3) {
      return folded.slice(0, folded.length - f.length);
    }
  }
  return folded.replace(/[aeo]$/, "");
}

/** Stemmed, stopword-free term set for lexical scoring. */
export function termSet(text: string): Set<string> {
  const out = new Set<string>();
  for (const token of text.toLowerCase().normalize("NFC").match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (token.length < 2 || isStopword(token)) continue;
    out.add(stemPt(token));
  }
  return out;
}

export function stemTokens(text: string): string[] {
  const out: string[] = [];
  for (const token of text.toLowerCase().normalize("NFC").match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (token.length < 2 || isStopword(token)) continue;
    out.push(stemPt(token));
  }
  return out;
}
