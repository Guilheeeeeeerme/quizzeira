// Concept: Metadata classifier (§22.2) — a small logistic model over
// deterministic features that says how likely a text is *about the exam*
// (vacancies, dates, fees, organisers, procedures, the programa itself) rather
// than *about the subject*. Weights live in metadata-model.json; this file only
// extracts features and applies them.
import model from "./metadata-model.json";
import {
  CANDIDATE_IMPERATIVE_RE,
  CONTACT_RE,
  CURRENCY_RE,
  DATE_RE,
  EDITAL_REFERENCE_RE,
  EXPLANATORY_RE,
  LEGAL_CITATION_RE,
  METADATA_QUESTION_RE,
  ORG_RE,
  SYLLABUS_META_RE,
  VACANCY_MODERATE_RE,
  VACANCY_STRONG_RE,
  cap,
  countMatches,
  orderedOptionMarkers,
  per500,
  syllabusListShape,
} from "./text-stats";

export interface MetadataFeatures {
  dateDensity: number;
  currencyDensity: number;
  vacancyStrong: number;
  vacancyModerate: number;
  candidateImperative: number;
  orgDensity: number;
  editalReference: number;
  contactDensity: number;
  syllabusListShape: number;
  metadataQuestion: number;
  legalCitationDensity: number;
  explanatoryMarkers: number;
  questionStructure: number;
}

export const METADATA_MODEL_VERSION: string = model.version;

type FeatureName = keyof MetadataFeatures;
const WEIGHTS = model.weights as Record<FeatureName, number>;
const SCALES = model.scales as Partial<Record<FeatureName, number>>;

export function extractMetadataFeatures(text: string): MetadataFeatures {
  const chars = Math.max(1, text.length);
  const scaled = (re: RegExp, name: FeatureName): number =>
    cap(per500(countMatches(re, text), chars), SCALES[name] ?? 1);
  return {
    dateDensity: scaled(DATE_RE, "dateDensity"),
    currencyDensity: scaled(CURRENCY_RE, "currencyDensity"),
    vacancyStrong: scaled(VACANCY_STRONG_RE, "vacancyStrong"),
    vacancyModerate: scaled(VACANCY_MODERATE_RE, "vacancyModerate"),
    candidateImperative: scaled(CANDIDATE_IMPERATIVE_RE, "candidateImperative"),
    orgDensity: scaled(ORG_RE, "orgDensity"),
    editalReference: scaled(EDITAL_REFERENCE_RE, "editalReference"),
    contactDensity: scaled(CONTACT_RE, "contactDensity"),
    syllabusListShape: syllabusListShape(text),
    metadataQuestion: METADATA_QUESTION_RE.test(text) ? 1 : 0,
    legalCitationDensity: scaled(LEGAL_CITATION_RE, "legalCitationDensity"),
    explanatoryMarkers: scaled(EXPLANATORY_RE, "explanatoryMarkers"),
    questionStructure: cap(orderedOptionMarkers(text), SCALES.questionStructure ?? 2),
  };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function metadataProbabilityFromFeatures(features: MetadataFeatures): number {
  let logit = model.bias;
  for (const name of Object.keys(WEIGHTS) as FeatureName[]) {
    logit += WEIGHTS[name] * (features[name] ?? 0);
  }
  return Number(sigmoid(logit).toFixed(4));
}

/** 0–1 probability that `text` is exam/edital/administrative metadata. */
export function metadataProbability(text: string): number {
  if (!text.trim()) return 0;
  return metadataProbabilityFromFeatures(extractMetadataFeatures(text));
}

/** B2: the stem asks which topics are in the programa. */
export function testsSyllabusMeta(text: string): boolean {
  return SYLLABUS_META_RE.test(text);
}

/** Item-level convenience: stem + options + explanation joined. */
export function itemText(input: {
  prompt: string;
  options?: readonly string[] | null;
  explanation?: string | null;
}): string {
  return [input.prompt, ...(input.options ?? []), input.explanation ?? ""].join("\n");
}
