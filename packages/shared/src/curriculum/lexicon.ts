// Concept: Canonical concurso subjects + aliases for syllabus canonicalize().

export interface CanonicalSubject {
  id: string;
  title: string;
  aliases: string[];
  conventionalTopics: string[];
}

/** Lexicon row shape (title exposed as `canonical` for specs and admin UI). */
export interface LexiconSubject extends CanonicalSubject {
  canonical: string;
}

function toLexiconSubject(subject: CanonicalSubject): LexiconSubject {
  return { ...subject, canonical: subject.title };
}

export const CANONICAL_SUBJECTS: CanonicalSubject[] = [
  {
    id: "lingua-portuguesa",
    title: "Língua Portuguesa",
    aliases: ["português", "lingua portuguesa", "portugues", "lp", "língua portuguesa"],
    conventionalTopics: [
      "Interpretação de texto",
      "Ortografia",
      "Concordância verbal",
      "Concordância nominal",
      "Regência verbal",
      "Regência nominal",
      "Pontuação",
      "Crase",
      "Sintaxe",
      "Morfologia",
    ],
  },
  {
    id: "matematica",
    title: "Matemática",
    aliases: ["matemática", "matematica", "raciocínio matemático", "matematica basica"],
    conventionalTopics: [
      "Porcentagem",
      "Razão e proporção",
      "Equações",
      "Funções",
      "Geometria",
      "Estatística básica",
      "Juros",
    ],
  },
  {
    id: "raciocinio-logico",
    title: "Raciocínio Lógico",
    aliases: [
      "raciocínio lógico",
      "raciocinio logico",
      "raciocínio lógico-matemático",
      "raciocinio logico-matematico",
      "rlm",
      "lógica",
    ],
    conventionalTopics: [
      "Proposições",
      "Negação",
      "Condicionais",
      "Diagramas de Venn",
      "Sequências",
      "Análise combinatória",
    ],
  },
  {
    id: "direito-administrativo",
    title: "Direito Administrativo",
    aliases: ["dir. administrativo", "administrativo", "d. administrativo"],
    conventionalTopics: [
      "Atos administrativos",
      "Licitações",
      "Contratos administrativos",
      "Servidores públicos",
      "Improbidade",
      "Controle da administração",
    ],
  },
  {
    id: "direito-constitucional",
    title: "Direito Constitucional",
    aliases: ["dir. constitucional", "constitucional", "d. constitucional"],
    conventionalTopics: [
      "Direitos fundamentais",
      "Organização do Estado",
      "Poderes",
      "Controle de constitucionalidade",
      "Administração pública na CF",
    ],
  },
  {
    id: "direito-civil",
    title: "Direito Civil",
    aliases: ["civil", "dir. civil"],
    conventionalTopics: ["Obrigações", "Contratos", "Coisas", "Família", "Sucessões"],
  },
  {
    id: "direito-penal",
    title: "Direito Penal",
    aliases: ["penal", "dir. penal", "código penal"],
    conventionalTopics: ["Tipicidade", "Culpa", "Penas", "Crimes contra a administração"],
  },
  {
    id: "direito-tributario",
    title: "Direito Tributário",
    aliases: ["tributário", "tributario", "dir. tributário"],
    conventionalTopics: ["CTN", "Impostos", "Taxas", "Contribuições", "Obrigação tributária"],
  },
  {
    id: "informatica",
    title: "Informática",
    aliases: ["noções de informática", "ti", "tecnologia da informação"],
    conventionalTopics: ["Sistemas operacionais", "Internet", "Segurança", "Pacote Office", "Redes"],
  },
  {
    id: "atualidades",
    title: "Atualidades",
    aliases: ["conhecimentos gerais", "atualidades e conhecimentos gerais"],
    conventionalTopics: ["Política", "Economia", "Meio ambiente", "Relações internacionais"],
  },
  {
    id: "contabilidade",
    title: "Contabilidade",
    aliases: ["contabilidade geral", "contabilidade pública"],
    conventionalTopics: ["Balanço", "Demonstrações", "NBC", "Patrimônio"],
  },
  {
    id: "administracao-geral",
    title: "Administração Geral",
    aliases: ["administração", "administracao", "gestão pública"],
    conventionalTopics: ["Planejamento", "Organização", "Direção", "Controle", "Processos"],
  },
];

export const SUBJECT_LEXICON: LexiconSubject[] = CANONICAL_SUBJECTS.map(toLexiconSubject);

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_INDEX = new Map<string, CanonicalSubject>();
for (const subject of CANONICAL_SUBJECTS) {
  ALIAS_INDEX.set(normalizeKey(subject.title), subject);
  ALIAS_INDEX.set(normalizeKey(subject.id.replace(/-/g, " ")), subject);
  for (const alias of subject.aliases) {
    ALIAS_INDEX.set(normalizeKey(alias), subject);
  }
}

/** Map a free-text subject heading to a canonical subject, or null. */
export function canonicalizeSubject(raw: string): CanonicalSubject | null {
  const key = normalizeKey(raw);
  if (!key) return null;
  const direct = ALIAS_INDEX.get(key);
  if (direct) return direct;
  for (const [alias, subject] of ALIAS_INDEX) {
    if (key.includes(alias) || alias.includes(key)) return subject;
  }
  return null;
}

/** Map a free-text label to a lexicon row, or null. */
export function canonicalize(raw: string): LexiconSubject | null {
  const subject = canonicalizeSubject(raw);
  return subject ? toLexiconSubject(subject) : null;
}

export function getSubjectById(id: string): LexiconSubject | null {
  const subject = CANONICAL_SUBJECTS.find((s) => s.id === id);
  return subject ? toLexiconSubject(subject) : null;
}

export function isLegalSubject(subject: LexiconSubject | string): boolean {
  const id = typeof subject === "string" ? subject : subject.id;
  return id.startsWith("direito-");
}

export function canonicalSubjectId(raw: string): string | null {
  return canonicalizeSubject(raw)?.id ?? null;
}
