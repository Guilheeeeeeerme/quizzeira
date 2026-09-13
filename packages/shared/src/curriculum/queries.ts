// Concept: Deterministic topic-query templates (§17.2).

export interface QueryTemplate {
  id: string;
  /** Placeholders: {subject}, {topic}, {subtopic}, {banca}, {org} */
  pattern: string;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  // Keep in sync with query-templates.yaml (§17.2 / §47).
  { id: "topic-explain", pattern: "{subject} {topic} explicação" },
  { id: "subtopic-rule", pattern: "{subtopic} regra norma-padrão" },
  { id: "lei-cite", pattern: "{subject} {topic} lei artigo" },
  { id: "apostila", pattern: "apostila {subject} {topic}" },
  { id: "concurso-focus", pattern: "{topic} {subtopic} concurso público" },
];

export function buildTopicQueries(input: {
  subject: string;
  topic: string;
  subtopic?: string | null;
  banca?: string | null;
  org?: string | null;
  max?: number;
}): string[] {
  const vars: Record<string, string> = {
    subject: input.subject,
    topic: input.topic,
    subtopic: input.subtopic ?? input.topic,
    banca: input.banca ?? "",
    org: input.org ?? "",
  };
  const max = input.max ?? 3;
  const out: string[] = [];
  for (const tpl of QUERY_TEMPLATES) {
    let q = tpl.pattern;
    for (const [k, v] of Object.entries(vars)) {
      q = q.replaceAll(`{${k}}`, v);
    }
    q = q.replace(/\s+/g, " ").trim();
    if (q && !out.includes(q)) out.push(q);
    if (out.length >= max) break;
  }
  return out;
}
