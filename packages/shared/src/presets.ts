import type { LocaleCode, TopicPresetDefinition, TopicPresetSlug } from "./types";

export const TOPIC_PRESETS: TopicPresetDefinition[] = [
  {
    slug: "concurso",
    label: {
      en: "Public exam",
      "pt-BR": "Concurso público",
    },
    guidelinesTemplate: {
      en: `Exam / agency:
Target role / vacancy:
Subject weights (if known):
Bank / exam style notes:
Priorities / weak areas:
Attach the notice (edital) and past exams when possible.`,
      "pt-BR": `Órgão / concurso:
Cargo / vaga:
Pesos por matéria (se souber):
Estilo da banca:
Prioridades / pontos fracos:
Anexe o edital e provas anteriores quando possível.`,
    },
    focusExamples: {
      en: ["History", "Geography", "Exam-style mock", "Only what I miss"],
      "pt-BR": ["História", "Geografia", "Simulado no estilo da banca", "Só o que estou errando"],
    },
  },
  {
    slug: "vestibular",
    label: {
      en: "College entrance / ENEM",
      "pt-BR": "Vestibular / ENEM",
    },
    guidelinesTemplate: {
      en: `Exam (ENEM / university):
Focus areas (Nature, Humanities, Math, Languages…):
Pace notes:
Attach past exams or syllabus excerpts when possible.`,
      "pt-BR": `Prova (ENEM / vestibular):
Áreas de foco (Natureza, Humanas, Matemática, Linguagens…):
Ritmo / rotina:
Anexe provas anteriores ou trechos do edital quando possível.`,
    },
    focusExamples: {
      en: ["Reading comprehension", "Math", "Sciences", "Writing prompts"],
      "pt-BR": ["Interpretação de texto", "Matemática", "Natureza", "Redação"],
    },
  },
  {
    slug: "certificacao",
    label: {
      en: "Professional certification",
      "pt-BR": "Certificação profissional",
    },
    guidelinesTemplate: {
      en: `Exam name (AWS, Cisco, CFA…):
Domains / blueprint weights:
Preferred question style:
Paste blueprint notes or attach official outline.`,
      "pt-BR": `Exame (AWS, Cisco, CFA…):
Domínios / pesos do blueprint:
Estilo de perguntas preferido:
Cole notas do blueprint ou anexe o outline oficial.`,
    },
    focusExamples: {
      en: ["Domain I", "Domain II", "Scenario questions", "Weak domains only"],
      "pt-BR": ["Domínio I", "Domínio II", "Cenários práticos", "Só domínios fracos"],
    },
  },
  {
    slug: "entrevista",
    label: {
      en: "Job interview",
      "pt-BR": "Entrevista de emprego",
    },
    guidelinesTemplate: {
      en: `Role title:
Company:
Seniority:
Must-have skills:
Interview format (HR / technical / case):
Paste the job description here.
Add career page / LinkedIn / blog links in the Links field.`,
      "pt-BR": `Cargo:
Empresa:
Senioridade:
Skills obrigatórias:
Formato (RH / técnica / case):
Cole a descrição da vaga aqui.
Adicione links da página de carreiras / LinkedIn / blog no campo Links.`,
    },
    focusExamples: {
      en: [
        "Behavioral (STAR)",
        "Company culture fit",
        "Role-specific technical",
        "Questions I ask the interviewer",
      ],
      "pt-BR": [
        "Perguntas comportamentais (STAR)",
        "Fit cultural da empresa",
        "Perguntas técnicas da vaga",
        "Perguntas que eu faço ao entrevistador",
      ],
    },
  },
  {
    slug: "idioma",
    label: {
      en: "Language",
      "pt-BR": "Idioma",
    },
    guidelinesTemplate: {
      en: `Language:
Level (A1–C2):
Skills to train (reading, grammar, vocabulary, speaking prompts):
Short daily pills preferred.`,
      "pt-BR": `Idioma:
Nível (A1–C2):
Skills (leitura, gramática, vocabulário, produção):
Prefira pills curtas diárias.`,
    },
    focusExamples: {
      en: ["Grammar", "Vocabulary", "Reading", "Speaking prompts"],
      "pt-BR": ["Gramática", "Vocabulário", "Leitura", "Produção oral"],
    },
  },
  {
    slug: "faculdade",
    label: {
      en: "College course",
      "pt-BR": "Faculdade / disciplina",
    },
    guidelinesTemplate: {
      en: `Course / discipline:
Upcoming exam (midterm / final):
Professor emphasis:
Attach slides / problem sets when possible.`,
      "pt-BR": `Disciplina:
Prova (P1 / P2 / final):
Ênfase do professor:
Anexe slides / listas quando possível.`,
    },
    focusExamples: {
      en: ["Lecture topics", "Problem set style", "Definitions", "What I missed last quiz"],
      "pt-BR": ["Conteúdo das aulas", "Estilo da lista", "Definições", "O que errei na última"],
    },
  },
  {
    slug: "trabalho",
    label: {
      en: "Work skill",
      "pt-BR": "Trabalho / skill",
    },
    guidelinesTemplate: {
      en: `Skill (SQL, Excel, coding…):
Context / tools at work:
Prefer practical scenarios over memorization.`,
      "pt-BR": `Skill (SQL, Excel, código…):
Contexto / ferramentas no trabalho:
Prefira cenários práticos a decorar.`,
    },
    focusExamples: {
      en: ["Hands-on scenario", "Debugging", "Best practices", "Edge cases"],
      "pt-BR": ["Cenário prático", "Debugging", "Boas práticas", "Casos-limite"],
    },
  },
  {
    slug: "livre",
    label: {
      en: "Custom",
      "pt-BR": "Livre / outro",
    },
    guidelinesTemplate: {
      en: `What I'm studying:
How to measure progress:
What to prioritize:`,
      "pt-BR": `O que estou estudando:
Como medir progresso:
O que priorizar:`,
    },
    focusExamples: {
      en: ["Basics", "Practice problems", "Review mistakes"],
      "pt-BR": ["Fundamentos", "Exercícios", "Revisar erros"],
    },
  },
];

export function getTopicPreset(slug: string | null | undefined): TopicPresetDefinition | undefined {
  return TOPIC_PRESETS.find((p) => p.slug === slug);
}

export function isTopicPresetSlug(value: string): value is TopicPresetSlug {
  return TOPIC_PRESETS.some((p) => p.slug === value);
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
