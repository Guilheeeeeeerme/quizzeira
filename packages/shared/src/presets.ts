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
Prioridades / pontos fracos:`,
      en: `Exam / agency:
Target role / vacancy / emphasis (required if the notice has several):
Subjects to practice (from the syllabus / edital program):
Subject weights (if known):
Bank / exam style notes:
Priorities / weak areas:`,
    },
    focusExamples: {
      en: ["Portuguese", "Logical reasoning", "Role-specific knowledge", "Only what I miss"],
      "pt": ["Português", "Raciocínio lógico", "Conhecimentos específicos", "Só o que estou errando"],
    },
  },
];

export function getTopicPreset(slug: string | null | undefined): TopicPresetDefinition | undefined {
  return TOPIC_PRESETS.find((p) => p.slug === slug);
}

export function isTopicPresetSlug(value: string): value is TopicPresetSlug {
  return TOPIC_PRESETS.some((p) => p.slug === value);
}

/** Product is open-exam-only. */
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
