// Concept: Topic-query templates (§17.2). Table-driven, per canonical subject
// family, alias-substituted from the lexicon. No LLM.

export interface QueryTemplateSet {
  /** `{leaf}`, `{topic}`, `{subject}` are substituted. */
  templates: readonly string[];
}

export const DEFAULT_QUERY_TEMPLATES: QueryTemplateSet = {
  templates: ["{leaf} {subject}", "{leaf} resumo concurso", "{leaf} {topic} exemplos regras"],
};

export const QUERY_TEMPLATES_BY_FAMILY: Record<string, QueryTemplateSet> = {
  language: {
    templates: ["{leaf} {subject} regras", "{leaf} gramática exemplos", "{leaf} resumo concurso"],
  },
  math: {
    templates: ["{leaf} {subject}", "{leaf} exercícios resolvidos", "{leaf} {topic} fórmulas exemplos"],
  },
  it: {
    templates: ["{leaf} {subject} conceitos", "{leaf} resumo concurso", "{leaf} {topic} documentação"],
  },
  legal: {
    templates: ["{leaf} {subject}", "{leaf} lei artigo", "{leaf} resumo concurso {topic}"],
  },
  admin: DEFAULT_QUERY_TEMPLATES,
  finance: DEFAULT_QUERY_TEMPLATES,
  health: DEFAULT_QUERY_TEMPLATES,
  engineering: DEFAULT_QUERY_TEMPLATES,
  general: DEFAULT_QUERY_TEMPLATES,
};
