/** Generation brief builder (§24.2). */

export interface GenerationBrief {
  exam: { title: string; org: string; banca: string | null; year: number | null };
  position: { title: string } | null;
  syllabus: {
    subject: string;
    topic: string | null;
    subtopic: string;
    path: string[];
    rawText: string;
  };
  knowledge: Array<{
    id: string;
    kind: string;
    statement: string;
    example: string | null;
    qualifiers: string[];
  }>;
  constraints: {
    count: number;
    optionCount: number;
    forbidden: string[];
    mustCite: true;
    language: "pt-BR";
  };
}

const FORBIDDEN = [
  "organizador",
  "banca",
  "edital",
  "vagas",
  "salário",
  "taxa de inscrição",
  "cronograma",
  "local de prova",
  "requisitos de escolaridade",
  "quais assuntos constam no conteúdo programático",
];

export function buildGenerationBrief(input: {
  examTitle: string;
  org?: string | null;
  banca?: string | null;
  year?: number | null;
  positionTitle?: string | null;
  path: string[];
  rawText: string;
  knowledgeUnits: GenerationBrief["knowledge"];
  count: number;
  optionCount?: number;
}): GenerationBrief {
  const [subject, topic, subtopic] = [
    input.path[0] ?? "Geral",
    input.path[1] ?? null,
    input.path[input.path.length - 1] ?? "Geral",
  ];
  return {
    exam: {
      title: input.examTitle,
      org: input.org ?? "",
      banca: input.banca ?? null,
      year: input.year ?? null,
    },
    position: input.positionTitle ? { title: input.positionTitle } : null,
    syllabus: {
      subject,
      topic,
      subtopic,
      path: input.path,
      rawText: input.rawText,
    },
    knowledge: input.knowledgeUnits.slice(0, 12),
    constraints: {
      count: input.count,
      optionCount: input.optionCount ?? 5,
      forbidden: FORBIDDEN,
      mustCite: true,
      language: "pt-BR",
    },
  };
}

export const GENERATION_V2_SYSTEM = `Você é um elaborador de itens de concurso público brasileiro.
Cada questão DEVE avaliar o subtópico do brief usando APENAS as knowledge units fornecidas.
Cite os ids das units usadas em knowledgeUnitIds.
PROIBIDO: perguntas sobre o edital, organizador, banca, vagas, salário, datas, taxas, locais, requisitos, procedimentos, ou sobre quais assuntos constam no programa.
Não copie exemplares. Não invente números de lei que não estejam nas units.
Responda somente JSON no schema pedido.`;
