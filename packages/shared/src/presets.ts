import type { LocaleCode, TopicPresetDefinition, TopicPresetSlug } from "./types";

export const TOPIC_PRESETS: TopicPresetDefinition[] = [
  {
    slug: "open_exam",
    label: {
      en: "Public exam",
      "pt": "Concurso público",
    },
    guidelinesTemplate: {
      "pt": `Órgão / concurso:
Cargo / vaga / ênfase (obrigatório se o edital tiver várias):
Matérias a treinar (do programa / conteúdo do edital):
Pesos por matéria (se souber):
Estilo da banca:
Prioridades / pontos fracos:
Anexe o edital, quadro de vagas e provas anteriores como CONTEXTO para a IA saber O QUE a prova cobra — as perguntas serão sobre as matérias, não sobre o PDF.`,
      en: `Exam / agency:
Target role / vacancy / emphasis (required if the notice has several):
Subjects to practice (from the syllabus / edital program):
Subject weights (if known):
Bank / exam style notes:
Priorities / weak areas:
Attach the notice (edital), vacancy table, and past exams as CONTEXT so the AI knows WHAT the exam tests — questions will be on the subjects, not about the PDF.`,
    },
    focusExamples: {
      en: ["Portuguese", "Logical reasoning", "Role-specific knowledge", "Only what I miss"],
      "pt": ["Português", "Raciocínio lógico", "Conhecimentos específicos", "Só o que estou errando"],
    },
  },
  {
    slug: "vestibular",
    label: {
      en: "College entrance / ENEM",
      "pt": "Vestibular / ENEM",
    },
    guidelinesTemplate: {
      en: `Exam (ENEM / university):
Focus areas (Nature, Humanities, Math, Languages…):
Pace notes:
Attach past exams or syllabus excerpts when possible.`,
      "pt": `Prova (ENEM / vestibular):
Áreas de foco (Natureza, Humanas, Matemática, Linguagens…):
Ritmo / rotina:
Anexe provas anteriores ou trechos do edital quando possível.`,
    },
    focusExamples: {
      en: ["Reading comprehension", "Math", "Sciences", "Writing prompts"],
      "pt": ["Interpretação de texto", "Matemática", "Natureza", "Redação"],
    },
  },
  {
    slug: "certificacao",
    label: {
      en: "Professional certification",
      "pt": "Certificação profissional",
    },
    guidelinesTemplate: {
      en: `Exam name (AWS, Cisco, CFA…):
Domains / blueprint weights:
Preferred question style:
Paste blueprint notes or attach official outline.`,
      "pt": `Exame (AWS, Cisco, CFA…):
Domínios / pesos do blueprint:
Estilo de perguntas preferido:
Cole notas do blueprint ou anexe o outline oficial.`,
    },
    focusExamples: {
      en: ["Domain I", "Domain II", "Scenario questions", "Weak domains only"],
      "pt": ["Domínio I", "Domínio II", "Cenários práticos", "Só domínios fracos"],
    },
  },
  {
    slug: "entrevista",
    label: {
      en: "Job interview",
      "pt": "Entrevista de emprego",
    },
    guidelinesTemplate: {
      en: `Role title:
Company:
Seniority (junior / mid / senior):
Must-have skills / stack:
Interview format (HR / technical / case):
Paste or attach the job description as CONTEXT — practice questions will drill the required skills at that seniority, not quiz what the posting lists.
Add career page / LinkedIn / blog links in the Links field.`,
      "pt": `Cargo:
Empresa:
Senioridade (júnior / pleno / sênior):
Skills / stack obrigatórias:
Formato (RH / técnica / case):
Cole ou anexe a descrição da vaga como CONTEXTO — as perguntas treinam as skills no nível de senioridade, não perguntam o que o anúncio lista.
Adicione links da página de carreiras / LinkedIn / blog no campo Links.`,
    },
    focusExamples: {
      en: [
        "Behavioral (STAR)",
        "Company culture fit",
        "Role-specific technical",
        "Questions I ask the interviewer",
      ],
      "pt": [
        "Perguntas comportamentais (STAR)",
        "Fit cultural da empresa",
        "Perguntas técnicas da stack",
        "Perguntas que eu faço ao entrevistador",
      ],
    },
  },
  {
    slug: "idioma",
    label: {
      en: "Language",
      "pt": "Idioma",
    },
    guidelinesTemplate: {
      en: `Language:
Level (A1–C2):
Skills to train (reading, grammar, vocabulary, speaking prompts):
Short daily pills preferred.`,
      "pt": `Idioma:
Nível (A1–C2):
Skills (leitura, gramática, vocabulário, produção):
Prefira pills curtas diárias.`,
    },
    focusExamples: {
      en: ["Grammar", "Vocabulary", "Reading", "Speaking prompts"],
      "pt": ["Gramática", "Vocabulário", "Leitura", "Produção oral"],
    },
  },
  {
    slug: "faculdade",
    label: {
      en: "College course",
      "pt": "Faculdade / disciplina",
    },
    guidelinesTemplate: {
      en: `Course / discipline:
Upcoming exam (midterm / final):
Professor emphasis:
Attach slides / problem sets when possible.`,
      "pt": `Disciplina:
Prova (P1 / P2 / final):
Ênfase do professor:
Anexe slides / listas quando possível.`,
    },
    focusExamples: {
      en: ["Lecture topics", "Problem set style", "Definitions", "What I missed last quiz"],
      "pt": ["Conteúdo das aulas", "Estilo da lista", "Definições", "O que errei na última"],
    },
  },
  {
    slug: "trabalho",
    label: {
      en: "Work skill",
      "pt": "Trabalho / skill",
    },
    guidelinesTemplate: {
      en: `Skill (SQL, Excel, coding…):
Context / tools at work:
Prefer practical scenarios over memorization.`,
      "pt": `Skill (SQL, Excel, código…):
Contexto / ferramentas no trabalho:
Prefira cenários práticos a decorar.`,
    },
    focusExamples: {
      en: ["Hands-on scenario", "Debugging", "Best practices", "Edge cases"],
      "pt": ["Cenário prático", "Debugging", "Boas práticas", "Casos-limite"],
    },
  },
  {
    slug: "livre",
    label: {
      en: "Custom",
      "pt": "Livre / outro",
    },
    guidelinesTemplate: {
      en: `What I'm studying:
How to measure progress:
What to prioritize:`,
      "pt": `O que estou estudando:
Como medir progresso:
O que priorizar:`,
    },
    focusExamples: {
      en: ["Basics", "Practice problems", "Review mistakes"],
      "pt": ["Fundamentos", "Exercícios", "Revisar erros"],
    },
  },
];

export function getTopicPreset(slug: string | null | undefined): TopicPresetDefinition | undefined {
  return TOPIC_PRESETS.find((p) => p.slug === slug);
}

export function isTopicPresetSlug(value: string): value is TopicPresetSlug {
  return TOPIC_PRESETS.some((p) => p.slug === value);
}

/** Product is open-exam-only for now; other presets stay in code but hidden from UI. */
export const PRIMARY_PRESET_SLUGS: readonly TopicPresetSlug[] = ["open_exam"] as const;

export function visibleTopicPresets(): TopicPresetDefinition[] {
  return TOPIC_PRESETS.filter((p) =>
    (PRIMARY_PRESET_SLUGS as readonly string[]).includes(p.slug),
  );
}

export function isPrimaryPresetSlug(value: string | null | undefined): boolean {
  return value != null && (PRIMARY_PRESET_SLUGS as readonly string[]).includes(value);
}

export function localizePreset(
  slug: TopicPresetSlug,
  locale: LocaleCode,
): { label: string; guidelinesTemplate: string; focusExamples: string[] } {
  const preset = getTopicPreset(slug)!;
  return {
    label: preset.label[locale],
    guidelinesTemplate: preset.guidelinesTemplate[locale],
    focusExamples: preset.focusExamples[locale],
  };
}
