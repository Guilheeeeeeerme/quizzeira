/**
 * Deterministic metadataProbability heuristic (§20, §22.2).
 * Logistic over admin-leaning vs content-leaning features — not a naive keyword filter.
 */

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

export interface MetadataModelWeights {
  version: string;
  bias: number;
  weights: Record<keyof MetadataFeatures, number>;
}

/** Versioned weights — calibrated for listing trivia + edital admin sections. */
export const METADATA_MODEL: MetadataModelWeights = {
  version: "metadata-v1",
  bias: -1.2,
  weights: {
    dateDensity: 1.4,
    currencyDensity: 1.6,
    vacancyLexicon: 2.2,
    candidateImperative: 1.8,
    orgDensity: 1.5,
    editalReference: 1.3,
    contactDensity: 1.1,
    syllabusListShape: 1.0,
    legalCitationDensity: -1.4,
    explanatoryMarkers: -1.6,
    questionStructure: -0.8,
  },
};

const VACANCY_RE =
  /\b(vagas?|cadastro\s+de\s+reserva|remunera[cç][aã]o|sal[aá]rio|taxa\s+de\s+inscri[cç][aã]o|isen[cç][aã]o|boleto|cart[aã]o\s+de\s+confirma[cç][aã]o|local\s+de\s+prova|convoca[cç][aã]o|homologa[cç][aã]o|posse|inscri[cç][oõ]es?\s+abertas?)\b/gi;

const IMPERATIVE_RE =
  /\b(o\s+candidato\s+(dever[aá]|deve|n[aã]o\s+poder[aá])|[eé]\s+vedado|ser[aá]\s+eliminado)\b/gi;

const ORG_RE =
  /\b(tribunal\s+de\s+contas|secretari[ao]|prefeitura|fund[aã][cç][aã]o|instituto|universidade|banco\s+do\s+brasil|caixa|correios|pol[ií]cia|minist[eé]rio|associa[cç][aã]o|cesgranrio|cebraspe|fgv|vunesp|fcc|ibfc)\b/gi;

const EDITAL_RE = /\b(edital\s+n[ºo°]?|retifica[cç][aã]o|anexo\s+[IVXLC\d]+)\b/gi;

const CONTACT_RE =
  /(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})|([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(https?:\/\/\S+)/gi;

const LEGAL_RE = /\b(art\.?\s*\d+|§\s*\d+|inciso|al[ií]nea|lei\s+n|s[uú]mula|decreto)\b/gi;

const EXPLAIN_RE =
  /\b(por\s+exemplo|ex\.?:|ou\s+seja|isto\s+[eé]|define-se|consiste\s+em|regra|exce[cç][aã]o)\b/gi;

const QUESTION_STRUCT_RE = /^\s*[(\[]?[A-Ea-e][)\].:]\s+/m;

const DATE_RE =
  /\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+20\d{2}|20\d{2})\b/gi;

const CURRENCY_RE = /R\$\s*[\d.]+(?:,\d{2})?/gi;

function density(matches: number, chars: number): number {
  if (chars <= 0) return 0;
  return matches / (chars / 500);
}

function countMatches(text: string, re: RegExp): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return [...text.matchAll(new RegExp(re.source, flags))].length;
}

export function extractMetadataFeatures(text: string): MetadataFeatures {
  const chars = text.length || 1;
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const shortLines = lines.filter((l) => l.length > 0 && l.length < 80).length;
  const syllabusListShape = lines.length > 5 ? shortLines / lines.length : 0;

  return {
    dateDensity: density(countMatches(text, DATE_RE), chars),
    currencyDensity: density(countMatches(text, CURRENCY_RE), chars),
    vacancyLexicon: countMatches(text, VACANCY_RE) > 0 ? 1 : 0,
    candidateImperative: countMatches(text, IMPERATIVE_RE) > 0 ? 1 : 0,
    orgDensity: density(countMatches(text, ORG_RE), chars),
    editalReference: countMatches(text, EDITAL_RE) > 0 ? 1 : 0,
    contactDensity: density(countMatches(text, CONTACT_RE), chars),
    syllabusListShape,
    legalCitationDensity: density(countMatches(text, LEGAL_RE), chars),
    explanatoryMarkers: density(countMatches(text, EXPLAIN_RE), chars),
    questionStructure: QUESTION_STRUCT_RE.test(text) ? 1 : 0,
  };
}

function sigmoid(x: number): number {
  if (x > 20) return 1;
  if (x < -20) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function metadataProbability(
  text: string,
  model: MetadataModelWeights = METADATA_MODEL,
): number {
  const features = extractMetadataFeatures(text);
  let z = model.bias;
  for (const key of Object.keys(model.weights) as (keyof MetadataFeatures)[]) {
    z += model.weights[key] * features[key];
  }
  return sigmoid(z);
}

/** Syllabus-meta detector (§25.2). */
export function testsSyllabusMeta(text: string): boolean {
  return (
    /(consta|constam|est[aá]\s+previsto|fazem\s+parte).{0,40}(conte[uú]do\s+program[aá]tico|programa|edital)/i.test(
      text,
    ) || /quais\s+(assuntos|mat[eé]rias|disciplinas)/i.test(text)
  );
}

/** Temporal dependence heuristic (§25.2). */
export function temporallyDependent(text: string, nowYear = new Date().getFullYear()): boolean {
  if (/\b(atual(mente)?|hoje|vigente)\b/i.test(text) && !/\b(art\.?|lei\s+n)/i.test(text)) {
    return true;
  }
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
  return years.some((y) => y >= nowYear - 1);
}
