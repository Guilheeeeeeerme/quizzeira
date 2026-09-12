// Concept: Generation brief assembly (§24.2) — deterministic, no LLM.
export type KuKind =
  | "rule"
  | "definition"
  | "exception"
  | "formula"
  | "procedure"
  | "classification"
  | "fact"
  | "example";

export interface BriefKnowledgeUnit {
  id: string;
  kind: KuKind;
  statement: string;
  example: string | null;
  qualifiers: string[];
}

export interface ExamStyleProfileSnapshot {
  optionCount: number;
  stemLengthP50: number;
  negativeStemRate: number;
  commandVerbs: string[];
  certoErrado: boolean;
  difficultyProxy: number;
}

export interface GenerationBrief {
  exam: { title: string; org: string; banca: string | null; year: number | null };
  position: { title: string } | null;
  syllabus: {
    subject: string;
    topic: string | null;
    subtopic: string;
    path: string[];
    rawText: string;
    nodeId: string;
    canonicalKey: string;
  };
  style: ExamStyleProfileSnapshot;
  difficulty: { target: 0.3 | 0.5 | 0.7; rationale: string };
  knowledge: BriefKnowledgeUnit[];
  exemplars: Array<{ stem: string; options: string[]; note: "formato apenas" }>;
  avoid: Array<{ stem: string }>;
  constraints: {
    count: number;
    optionCount: number;
    forbidden: string[];
    mustCite: true;
    language: "pt-BR";
  };
}

export const DEFAULT_STYLE: ExamStyleProfileSnapshot = {
  optionCount: 5,
  stemLengthP50: 120,
  negativeStemRate: 0.15,
  commandVerbs: ["Assinale", "Considere", "De acordo com"],
  certoErrado: false,
  difficultyProxy: 0.5,
};

export const FORBIDDEN_AXES = [
  "vagas, remuneração, salário, taxa de inscrição",
  "banca, organizador, edital, número do edital",
  "cronograma, datas de inscrição, local de prova",
  "quais assuntos constam no conteúdo programático",
  "requisitos de escolaridade, documentos para posse",
];

export interface BuildBriefInput {
  examTitle: string;
  org?: string | null;
  banca?: string | null;
  year?: number | null;
  positionTitle?: string | null;
  syllabusPath: string[];
  syllabusRawText: string;
  syllabusNodeId: string;
  canonicalKey: string;
  knowledge: BriefKnowledgeUnit[];
  style?: ExamStyleProfileSnapshot;
  exemplars?: GenerationBrief["exemplars"];
  avoid?: GenerationBrief["avoid"];
  count?: number;
  difficultyTarget?: 0.3 | 0.5 | 0.7;
}

/** Select 6–12 KUs with kind diversity (§19.3 / §24.2). */
export function selectKnowledgeForBrief(
  units: BriefKnowledgeUnit[],
  max = 10,
): BriefKnowledgeUnit[] {
  const byKind = new Map<string, BriefKnowledgeUnit[]>();
  for (const u of units) {
    const list = byKind.get(u.kind) ?? [];
    list.push(u);
    byKind.set(u.kind, list);
  }
  const out: BriefKnowledgeUnit[] = [];
  const kinds = [...byKind.keys()];
  let i = 0;
  while (out.length < Math.min(max, units.length) && kinds.length) {
    const kind = kinds[i % kinds.length];
    const bucket = byKind.get(kind)!;
    const next = bucket.shift();
    if (next) out.push(next);
    if (bucket.length === 0) {
      byKind.delete(kind);
      kinds.splice(kinds.indexOf(kind), 1);
      if (kinds.length === 0) break;
      i = i % kinds.length;
      continue;
    }
    i += 1;
  }
  return out;
}

export function buildGenerationBrief(input: BuildBriefInput): GenerationBrief {
  const path = input.syllabusPath.filter(Boolean);
  const subject = path[0] ?? "Geral";
  const topic = path.length > 2 ? path[1] : null;
  const subtopic = path[path.length - 1] ?? input.syllabusRawText;
  const style = input.style ?? DEFAULT_STYLE;
  const knowledge = selectKnowledgeForBrief(input.knowledge);
  const target = input.difficultyTarget ?? (style.difficultyProxy >= 0.6 ? 0.7 : style.difficultyProxy <= 0.35 ? 0.3 : 0.5);

  return {
    exam: {
      title: input.examTitle,
      org: input.org ?? "—",
      banca: input.banca ?? null,
      year: input.year ?? null,
    },
    position: input.positionTitle ? { title: input.positionTitle } : null,
    syllabus: {
      subject,
      topic,
      subtopic,
      path,
      rawText: input.syllabusRawText,
      nodeId: input.syllabusNodeId,
      canonicalKey: input.canonicalKey,
    },
    style,
    difficulty: {
      target,
      rationale: `style.difficultyProxy=${style.difficultyProxy}`,
    },
    knowledge,
    exemplars: (input.exemplars ?? []).slice(0, 2),
    avoid: input.avoid ?? [],
    constraints: {
      count: Math.max(1, input.count ?? 3),
      optionCount: style.optionCount || 5,
      forbidden: FORBIDDEN_AXES,
      mustCite: true,
      language: "pt-BR",
    },
  };
}

export function briefToPromptPayload(brief: GenerationBrief): string {
  return JSON.stringify(
    {
      exam: brief.exam,
      position: brief.position,
      syllabus: {
        path: brief.syllabus.path,
        subtopic: brief.syllabus.subtopic,
        rawText: brief.syllabus.rawText,
      },
      difficulty: brief.difficulty,
      style: {
        optionCount: brief.style.optionCount,
        commandVerbs: brief.style.commandVerbs,
        certoErrado: brief.style.certoErrado,
      },
      knowledge: brief.knowledge.map((k) => ({
        id: k.id,
        kind: k.kind,
        statement: k.statement,
        example: k.example,
      })),
      exemplars: brief.exemplars,
      avoid: brief.avoid,
      constraints: brief.constraints,
    },
    null,
    2,
  );
}
