// Concept: metadataProbability logistic classifier (§20 / §22.2).
// Deterministic features over section text — not a keyword ban-list.

import model from "./metadata-model.json";

export interface MetadataFeatures {
  dateDensity: number;
  currencyDensity: number;
  vacancyLexicon: number;
  candidateImperative: number;
  orgDensity: number;
  editalReference: number;
  contactDensity: number;
  syllabusListShape: number;
  legalCitationDensity: number;
  explanatoryMarkers: number;
  questionStructure: number;
}

const VACANCY_RE =
  /\b(vagas?|cadastro de reserva|remunera[cç][aã]o|sal[aá]rio|taxa de inscri[cç][aã]o|isen[cç][aã]o|boleto|cart[aã]o de confirma[cç][aã]o|local de prova|convoca[cç][aã]o|homologa[cç][aã]o|posse)\b/gi;

const IMPERATIVE_RE =
  /\bo candidato (dever[aá]|deve|n[aã]o poder[aá])\b|\b[eé] vedado\b|\bser[aá] eliminado\b/gi;

const ORG_RE =
  /\b(tribunal|secretaria|prefeitura|minist[eé]rio|instituto|fundação|autarquia|empresa p[uú]blica|cesgranrio|cebraspe|fgv|vunesp|fcc|cespe)\b/gi;

const EDITAL_RE = /\bedital n[ºo°]?\b|\bretifica[cç][aã]o\b|\banexo\s+[IVXLC]+\b/gi;

const CONTACT_RE =
  /\b\d{2}\s*\d{4,5}-?\d{4}\b|\b[\w.+-]+@[\w.-]+\.\w+\b|https?:\/\/\S+/gi;

const LEGAL_RE = /\bart\.?\s*\d|\b§\s*\d|\binciso\b|\blei n[ºo°]?\b/gi;

const EXPLAIN_RE =
  /\bpor exemplo\b|\bou seja\b|\bisto [eé]\b|\bdefine-se\b|\bconsiste (em|na|no)\b/gi;

const DATE_RE = /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b|\b\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\b/gi;

const CURRENCY_RE = /R\$\s*\d/gi;

const QUESTION_OPT_RE = /^\s*[A-E]\)|\(\s*[A-E]\s*\)/gim;

function countMatches(text: string, re: RegExp): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const copy = new RegExp(re.source, flags);
  return (text.match(copy) ?? []).length;
}

function density(count: number, chars: number, per = 500): number {
  if (chars <= 0) return 0;
  return (count * per) / chars;
}

export function extractMetadataFeatures(text: string): MetadataFeatures {
  const chars = text.length;
  const lines = text.split(/\n+/).filter((l) => l.trim());
  const shortLines = lines.filter((l) => l.trim().length > 0 && l.trim().length < 80);
  const longLines = lines.filter((l) => l.trim().length >= 80);
  const questionStructure = countMatches(text, QUESTION_OPT_RE) >= 3 ? 1 : 0;
  // Tip-list shape for edital anexos — not MCQ stems (long prompt + short options).
  const syllabusListShape =
    questionStructure === 0 &&
    longLines.length === 0 &&
    lines.length >= 5 &&
    shortLines.length / Math.max(lines.length, 1) >= 0.6
      ? 1
      : 0;

  const vacancyLexicon = countMatches(text, VACANCY_RE) > 0 ? 1 : 0;
  const currencyHits = countMatches(text, CURRENCY_RE);
  // Currency alone is common in math/finance stems; only treat as admin when
  // vacancy/registration lexicon is also present.
  const currencyDensity =
    currencyHits > 0 && (vacancyLexicon === 1 || /\btaxa\b|\binscri/i.test(text))
      ? density(currencyHits, chars)
      : 0;

  return {
    dateDensity: density(countMatches(text, DATE_RE), chars),
    currencyDensity,
    vacancyLexicon,
    candidateImperative: countMatches(text, IMPERATIVE_RE) > 0 ? 1 : 0,
    orgDensity: density(countMatches(text, ORG_RE), chars),
    editalReference: countMatches(text, EDITAL_RE) > 0 ? 1 : 0,
    contactDensity: density(countMatches(text, CONTACT_RE), chars),
    syllabusListShape,
    legalCitationDensity: density(countMatches(text, LEGAL_RE), chars),
    explanatoryMarkers: density(countMatches(text, EXPLAIN_RE), chars),
    questionStructure,
  };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function metadataProbability(text: string): number {
  const features = extractMetadataFeatures(text);
  const weights = model.weights as Record<keyof MetadataFeatures, number>;
  let z = model.bias;
  for (const key of Object.keys(weights) as (keyof MetadataFeatures)[]) {
    z += weights[key] * features[key];
  }
  return sigmoid(z);
}

export function isMetadataHeavy(text: string, threshold = model.threshold): boolean {
  return metadataProbability(text) > threshold;
}

/** Alias used by chunk eligibility and metadata.spec.ts. */
export const isQuestionMetadataRejected = isMetadataHeavy;

/** Prompt / stem classifier used by validation rung 2. */
const METADATA_QUESTION_RE =
  /\b(inscri[cç][oõ]es|cargo|vagas?|remunera[cç][aã]o|sal[aá]rio|taxa de inscri|edital(?:\s+n|\s+de\s+abertura)|banca|institui[cç][aã]o|associa[cç][aã]o|certifica[cç][aã]o|cronograma|local(?:\s+de)?\s+prova|(?:em\s+que\s+)?cidade|aplicad[ao]s?\s+a\s+prova|prova objetiva|homologa[cç][aã]o|escolaridade exigida|documento deve ser apresentado|quantas quest[oõ]es|oferecid[oa]|promovendo|concurso p[uú]blico aberto|exame para certifica)\b/i;

const SYLLABUS_META_RE =
  /\b(constam? no conte[uú]do program[aá]tico|quais assuntos|quais disciplinas|programa do concurso|anexo.*(portugu[eê]s|matem[aá]tica))\b/i;

export function questionTestsExamMetadata(prompt: string): boolean {
  return METADATA_QUESTION_RE.test(prompt);
}

export function questionTestsSyllabusMeta(prompt: string): boolean {
  return SYLLABUS_META_RE.test(prompt);
}
