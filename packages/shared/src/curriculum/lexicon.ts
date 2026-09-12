/** Subject lexicon + canonical keys for syllabus mapping (§11, §16, §21). */

import { slugifyKey } from "../slug";

export interface CanonicalSubject {
  id: string;
  title: string;
  aliases: string[];
  legal: boolean;
}

export const CANONICAL_SUBJECTS: CanonicalSubject[] = [
  {
    id: "lingua-portuguesa",
    title: "Língua Portuguesa",
    aliases: ["portugues", "português", "lingua portuguesa", "língua portuguesa", "gramatica", "gramática"],
    legal: false,
  },
  {
    id: "matematica",
    title: "Matemática",
    aliases: ["matematica", "matemática", "raciocinio quantitativo", "raciocínio quantitativo"],
    legal: false,
  },
  {
    id: "raciocinio-logico",
    title: "Raciocínio Lógico",
    aliases: ["raciocinio logico", "raciocínio lógico", "raciocinio logico matematico", "rlm"],
    legal: false,
  },
  {
    id: "direito-administrativo",
    title: "Direito Administrativo",
    aliases: ["direito administrativo", "dir. administrativo"],
    legal: true,
  },
  {
    id: "direito-constitucional",
    title: "Direito Constitucional",
    aliases: ["direito constitucional", "dir. constitucional"],
    legal: true,
  },
  {
    id: "direito-civil",
    title: "Direito Civil",
    aliases: ["direito civil", "dir. civil"],
    legal: true,
  },
  {
    id: "direito-penal",
    title: "Direito Penal",
    aliases: ["direito penal", "dir. penal"],
    legal: true,
  },
  {
    id: "informatica",
    title: "Informática",
    aliases: ["informatica", "informática", "noções de informática", "ti"],
    legal: false,
  },
  {
    id: "atualidades",
    title: "Atualidades",
    aliases: ["atualidades", "conhecimentos gerais"],
    legal: false,
  },
  {
    id: "contabilidade",
    title: "Contabilidade",
    aliases: ["contabilidade", "contabilidade geral", "contabilidade pública"],
    legal: false,
  },
  {
    id: "administracao",
    title: "Administração",
    aliases: ["administracao", "administração", "administração geral", "administração pública"],
    legal: false,
  },
  {
    id: "controle-externo",
    title: "Controle Externo",
    aliases: ["controle externo", "tribunais de contas"],
    legal: true,
  },
];

const ALIAS_INDEX = new Map<string, CanonicalSubject>();
for (const subject of CANONICAL_SUBJECTS) {
  ALIAS_INDEX.set(normalizeLexeme(subject.title), subject);
  ALIAS_INDEX.set(subject.id, subject);
  for (const alias of subject.aliases) {
    ALIAS_INDEX.set(normalizeLexeme(alias), subject);
  }
}

export function normalizeLexeme(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveCanonicalSubject(title: string): CanonicalSubject | null {
  const key = normalizeLexeme(title);
  if (ALIAS_INDEX.has(key)) return ALIAS_INDEX.get(key)!;
  for (const [alias, subject] of ALIAS_INDEX) {
    if (key.includes(alias) || alias.includes(key)) return subject;
  }
  return null;
}

export function canonicalKey(subjectId: string | null | undefined, leafTitle: string): string {
  const sid = subjectId?.trim() || "unknown";
  return `${sid}:${slugifyKey(leafTitle)}`;
}

export function tokenizePt(text: string): string[] {
  return normalizeLexeme(text)
    .split(" ")
    .filter((t) => t.length > 2 && !PT_STOPWORDS.has(t));
}

const PT_STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "nos", "nas", "um", "uma", "uns", "umas", "para", "por", "com", "sem", "que",
  "se", "ao", "aos", "ou", "como", "mais", "menos", "sobre", "entre", "ate",
  "até", "pela", "pelo", "pelas", "pelos", "seu", "sua", "seus", "suas",
]);

/** Lexical overlap score for syllabus mapping Tier 1 (§21.1). */
export function lexicalMapScore(leafTerms: string[], chunkText: string): number {
  if (leafTerms.length === 0) return 0;
  const chunkTokens = new Set(tokenizePt(chunkText));
  let hits = 0;
  for (const term of leafTerms) {
    if (chunkTokens.has(term)) hits += 1;
  }
  return hits / leafTerms.length;
}

export function leafTermSet(path: string[]): string[] {
  const terms = new Set<string>();
  for (const part of path) {
    for (const token of tokenizePt(part)) terms.add(token);
  }
  return [...terms];
}
