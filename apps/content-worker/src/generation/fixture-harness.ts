// Concept: Fixture generation harness — produces real MCQ text from KUs without live LLM (§24 offline).
import {
  buildGenerationBrief,
  type BriefKnowledgeUnit,
  type GenerationBrief,
} from "./brief.js";
import { distillKnowledgeUnits } from "../stages/knowledge/distill.js";
import { computeStyleProfile } from "../stages/evidence/style-profile.js";
import type { GeneratedQuestionInput } from "@quizzeira/shared";

export interface HarnessQuestion extends GeneratedQuestionInput {
  knowledgeUnitIds: string[];
  difficulty: number;
  label: "good" | "bad_metadata";
}

export interface HarnessResult {
  brief: GenerationBrief;
  knowledgeUnits: BriefKnowledgeUnit[];
  questions: HarnessQuestion[];
}

const FIXTURE_KNOWLEDGE = `
Concordância verbal. Com sujeito composto anteposto ao verbo, o verbo vai para o plural.
Chegaram o pai e o filho. A regra exige plural quando os núcleos do sujeito precedem o verbo.
Quando o sujeito composto é posposto, admite-se a concordância com o núcleo mais próximo.
Define-se concordância nominal como a harmonia entre nome e seus determinantes em gênero e número.
Por exemplo: as meninas inteligentes concorda em feminino e plural com o substantivo.
É proibido o uso de haviam no sentido de existir; o verbo haver impessoal fica no singular: havia problemas.
Nunca se usa crase antes de verbo. A crase indica a fusão de preposição a com artigo a.
`;

const FIXTURE_BAD_METADATA = [
  {
    prompt: "Quantas vagas são oferecidas para o cargo de Analista no edital do TCE-GO?",
    options: ["10", "20", "30", "40", "50"],
    correctIndex: 1,
    explanation: "Conforme o quadro de vagas do edital.",
  },
  {
    prompt: "Qual o valor da taxa de inscrição do concurso público estadual?",
    options: ["R$ 50", "R$ 80", "R$ 100", "R$ 120", "R$ 150"],
    correctIndex: 2,
    explanation: "A taxa consta no edital de abertura.",
  },
];

/** Deterministic item writer from a KU statement — stand-in for LLM generation.v2. */
export function generateFromKnowledgeUnit(
  ku: BriefKnowledgeUnit,
  optionCount = 5,
): HarnessQuestion {
  const statement = ku.statement.replace(/\.$/, "");
  const correct =
    statement.length > 110 ? `${statement.slice(0, 107).trim()}…` : statement;

  const distractors = [
    "Com sujeito composto anteposto, o verbo fica no singular sempre.",
    "Haver no sentido de existir flexiona-se no plural: haviam problemas.",
    "A crase é obrigatória antes de qualquer verbo no infinitivo.",
    "Concordância nominal independe de gênero e número dos nomes.",
    "Sujeito composto posposto nunca admite concordância no singular.",
  ];

  const options = [correct, ...distractors].slice(0, optionCount);
  const seed = [...ku.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 7) % (i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = Math.max(0, options.indexOf(correct));

  const kindLabel: Record<string, string> = {
    rule: "concordância e sintaxe",
    definition: "definição gramatical",
    exception: "exceção normativa",
    formula: "fórmula",
    procedure: "procedimento",
    classification: "classificação",
    fact: "norma-padrão",
    example: "exemplo normativo",
  };
  const topic = kindLabel[ku.kind] ?? "norma-padrão";
  const prompt =
    ku.kind === "definition"
      ? `Assinale a alternativa que apresenta a definição correta relacionada a ${topic} no português padrão.`
      : `Assinale a alternativa em que a regra de Língua Portuguesa está corretamente aplicada acerca de ${topic}.`;

  return {
    type: "MULTIPLE_CHOICE",
    prompt,
    options,
    correctIndex,
    referenceAnswer: null,
    explanation: `Fundamento na unidade de conhecimento: ${statement}.`,
    knowledgeUnitIds: [ku.id],
    difficulty: 0.5,
    label: "good",
  };
}

export function runFixtureGenerationHarness(): HarnessResult {
  const distilled = distillKnowledgeUnits(FIXTURE_KNOWLEDGE, {
    syllabusNodeId: "leaf-concordancia-verbal",
    max: 8,
  });
  const knowledge: BriefKnowledgeUnit[] = distilled.map((d) => ({
    id: d.id,
    kind: d.kind,
    statement: d.statement,
    example: d.example,
    qualifiers: d.qualifiers,
  }));

  const style = computeStyleProfile([
    {
      prompt: "Assinale a alternativa em que a concordância verbal está correta.",
      options: ["A", "B", "C", "D", "E"],
    },
    {
      prompt: "De acordo com a norma-padrão, indique a forma adequada.",
      options: ["A", "B", "C", "D", "E"],
    },
    {
      prompt: "Considere as afirmações sobre crase e assinale a correta.",
      options: ["A", "B", "C", "D", "E"],
    },
  ]);

  const brief = buildGenerationBrief({
    examTitle: "TCE-GO — Técnico de Controle Externo — 2026",
    org: "TCE-GO",
    banca: "FCC",
    year: 2026,
    positionTitle: "Técnico de Controle Externo",
    syllabusPath: ["Língua Portuguesa", "Sintaxe", "Concordância verbal"],
    syllabusRawText: "Concordância verbal e nominal",
    syllabusNodeId: "leaf-concordancia-verbal",
    canonicalKey: "lingua-portuguesa:concordancia-verbal",
    knowledge,
    style: {
      optionCount: style.optionCount,
      stemLengthP50: style.stemLengthP50,
      negativeStemRate: style.negativeStemRate,
      commandVerbs: style.commandVerbs,
      certoErrado: style.certoErrado,
      difficultyProxy: style.difficultyProxy,
    },
    count: 3,
  });

  const good: HarnessQuestion[] = brief.knowledge.slice(0, 3).map((ku) =>
    generateFromKnowledgeUnit(ku, brief.constraints.optionCount),
  );

  const bad: HarnessQuestion[] = FIXTURE_BAD_METADATA.map((b) => ({
    type: "MULTIPLE_CHOICE" as const,
    prompt: b.prompt,
    options: b.options,
    correctIndex: b.correctIndex,
    referenceAnswer: null,
    explanation: b.explanation,
    knowledgeUnitIds: [] as string[],
    difficulty: 0.2,
    label: "bad_metadata" as const,
  }));

  return { brief, knowledgeUnits: knowledge, questions: [...good, ...bad] };
}
