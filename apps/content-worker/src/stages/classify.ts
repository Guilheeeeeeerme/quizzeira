// Concept: Document + section classification (§14 tiers 0–1).

import type {
  ArtifactKindHint,
  DocumentRole,
  NormalizedDocument,
  NormalizedSection,
  RoleHint,
  SectionRole,
} from "@quizzeira/shared";
import { roleHintFromKindHint } from "@quizzeira/shared";
import { normalizeHtmlFallback } from "./normalize.js";
import { computeLinkDensity, computeSectionScores, type SectionScores } from "./scoring.js";

export interface ClassifiedSection {
  section: NormalizedSection;
  role: SectionRole;
  scores: SectionScores;
}

export interface ClassificationResult {
  role: DocumentRole;
  roleConfidence: number;
  roleMethod: string;
  subtype: string | null;
  sections: ClassifiedSection[];
}

interface RoleVote {
  role: DocumentRole;
  weight: number;
}

function specStrong(text: string): boolean {
  return (
    /\bedital\b.*\b(abertura|n[ºo°]\s*\d+)/i.test(text) ||
    /conte[úu]do\s+program[áa]tico/i.test(text) ||
    /\banexo\b.*\b(programa|conte[úu]do)/i.test(text) ||
    /\bretifica[çc][ãa]o\b/i.test(text)
  );
}

const SPEC_BODY_PATTERNS = [
  /das\s+inscri[çc][õo]es/i,
  /das\s+vagas/i,
  /da\s+remunera[çc][ãa]o/i,
  /das\s+provas/i,
  /dos\s+recursos/i,
  /das\s+disposi[çc][õo]es\s+finais/i,
  /cronograma/i,
];

function specBodyScore(text: string): number {
  let hits = 0;
  for (const re of SPEC_BODY_PATTERNS) {
    if (re.test(text)) hits += 1;
  }
  return hits >= 3 ? 0.3 : 0;
}

function evidStrong(text: string): boolean {
  if (/\bcaderno\b/i.test(text)) return true;
  if (/\bprova\s+(objetiva|discursiva|tipo|branca|azul)/i.test(text)) return true;
  if (/\bgabarito\b/i.test(text)) return true;
  if (/padr[ãa]o\s+de\s+respostas?/i.test(text)) return true;
  const qCount = (text.match(/\bquest[ãa]o\s+\d+\b/gi) ?? []).length;
  return qCount >= 10;
}

function knowStrong(text: string): boolean {
  if (/\bapostila\b/i.test(text)) return true;
  if (/\bcap[íi]tulo\s+\d+/i.test(text)) return true;
  if ((text.match(/\bart\.\s*\d+/gi) ?? []).length >= 5) return true;
  if ((text.match(/\bexemplo:/gi) ?? []).length >= 3) return true;
  if (/\bexerc[íi]cios?\b/i.test(text)) return true;
  if (/\bresumo\b/i.test(text)) return true;
  if (/\bdefini[çc][ãa]o\b/i.test(text)) return true;
  return false;
}

function knowBody(text: string, linkDensity: number): number {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length === 0) return 0;
  const longParas = paragraphs.filter((p) => p.length >= 300);
  const paragraphShare = longParas.length / paragraphs.length;
  const headings = (text.match(/^#{1,3}\s|^[A-ZÁÉÍÓÚÃÕÇ][^\n]{0,80}:?\s*$/gm) ?? []).length;
  const headingShare = headings / Math.max(paragraphs.length, 1);
  const avgLen = paragraphs.reduce((s, p) => s + p.length, 0) / paragraphs.length;
  if (paragraphShare >= 0.6 && headingShare >= 0.02 && headingShare <= 0.2 && linkDensity < 0.1 && avgLen >= 300) {
    return 0.3;
  }
  return 0;
}

function adminStrong(text: string): boolean {
  return (
    /inscri[çc][ãa]o\s+(online|aqui)/i.test(text) ||
    /\bboleto\b/i.test(text) ||
    /\bcart[ãa]o\s+de\s+confirma[çc][ãa]o/i.test(text) ||
    /\bresultado\s+(final|preliminar)/i.test(text) ||
    /\bconvoca[çc][ãa]o\b/i.test(text) ||
    /\bperguntas\s+frequentes\b/i.test(text) ||
    /\bnot[íi]cias?\b/i.test(text)
  );
}

function adminBody(text: string, linkDensity: number): number {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length === 0) return 0;
  const avgLen = paragraphs.reduce((s, p) => s + p.length, 0) / paragraphs.length;
  const shortListItems = paragraphs.filter((p) => p.length < 80 && /href|http/i.test(p));
  if (linkDensity > 0.3 || avgLen < 120 || shortListItems.length / paragraphs.length >= 0.4) {
    return 0.3;
  }
  return 0;
}

function tier0Role(
  roleHint?: RoleHint | null,
  kindHint?: ArtifactKindHint | null,
): RoleVote | null {
  if (roleHint && roleHint !== "unknown") {
    return { role: roleHint, weight: 0.95 };
  }
  if (kindHint && kindHint !== "unknown") {
    return { role: roleHintFromKindHint(kindHint), weight: 0.9 };
  }
  return null;
}

function tier1DocumentRole(doc: NormalizedDocument): { role: DocumentRole; confidence: number } {
  const titleBlock = [
    doc.metadata.title ?? "",
    doc.sections.slice(0, 2).map((s) => s.heading ?? "").join(" "),
    doc.sections[0]?.text.slice(0, 600) ?? "",
  ].join("\n");
  const fullSample = doc.sections.map((s) => s.text).join("\n").slice(0, 8000);
  const linkDensity = doc.stats.linkDensity ?? computeLinkDensity(fullSample);

  const votes = new Map<DocumentRole, number>();
  const add = (role: DocumentRole, w: number) => votes.set(role, (votes.get(role) ?? 0) + w);

  if (specStrong(titleBlock) || specStrong(fullSample)) add("specification", 0.5);
  add("specification", specBodyScore(fullSample));
  if (evidStrong(fullSample)) add("evidence", 0.5);
  if (knowStrong(fullSample)) add("knowledge", 0.5);
  add("knowledge", knowBody(fullSample, linkDensity));
  if (adminStrong(titleBlock) || adminStrong(fullSample)) add("administrative", 0.5);
  add("administrative", adminBody(fullSample, linkDensity));

  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return { role: "unknown", confidence: 0 };

  const [topRole, topScore] = ranked[0];
  const second = ranked[1]?.[1] ?? 0;
  if (topScore >= 0.5 && (topRole === "specification" || topRole === "evidence") && ranked.some(([r]) => r !== topRole && (votes.get(r) ?? 0) >= 0.5)) {
    return { role: "mixed", confidence: Math.min(0.9, topScore) };
  }
  if (topScore - second >= 0.3) {
    return { role: topRole, confidence: Math.min(0.95, topScore + 0.2) };
  }
  return { role: topRole, confidence: Math.max(0.4, topScore) };
}

function classifySectionRole(section: NormalizedSection, docLinkDensity: number): SectionRole {
  const heading = section.heading ?? "";
  const text = section.text;
  const combined = `${heading}\n${text}`;

  // Syllabus role from heading (not body): body mentions of "conteúdo programático"
  // in retificação notes must not steal the only syllabus slot from subject sections.
  if (
    /conte[úu]do\s+program[áa]tico|disciplinas|conhecimentos\s+(b[áa]sicos|gerais|espec[íi]ficos)/i.test(
      heading,
    ) ||
    (/^programa\b/i.test(heading) && !/programador/i.test(heading))
  ) {
    return "syllabus";
  }
  if (/cargo|vagas|requisitos|remunera[cç][ãa]o|carga hor[aá]ria/i.test(combined) && /\|/.test(text)) {
    return "vacancies";
  }
  if (/cronograma/i.test(heading) || (text.match(/\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) ?? []).length >= 3) {
    return "schedule";
  }
  if (/inscri/i.test(heading) || /taxa|boleto|isen[cç][ãa]o|CPF/i.test(text)) {
    return "registration";
  }
  if (/das provas/i.test(heading) || /quest[oõ]es|peso|pontua[cç][ãa]o|nota m[ií]nima|eliminat[oó]rio/i.test(text)) {
    return "exam_structure";
  }
  if (/disposi[cç][õo]es/i.test(heading)) return "legal_disposition";
  if ((text.match(/\bdever[aá]\b|\b[eé] vedado\b|\bo candidato deve\b/gi) ?? []).length / Math.max(text.split(/\s+/).length, 1) > 0.015) {
    return "instructional";
  }
  if ((text.match(/^\s*[A-E]\)/gm) ?? []).length >= 4) return "question_block";
  if (/gabarito/i.test(heading) || (text.match(/\d+\s*[-–.)]\s*[A-E]/g) ?? []).length >= 10) {
    return "answer_key";
  }
  if (docLinkDensity > 0.5 || computeLinkDensity(text) > 0.5) return "nav";
  if (section.flags.includes("legal_article")) return "legal_article";
  return "content";
}

export function classifyDocument(
  doc: NormalizedDocument,
  hints?: { roleHint?: RoleHint | null; kindHint?: ArtifactKindHint | null },
): ClassificationResult {
  const tier0 = tier0Role(hints?.roleHint, hints?.kindHint);
  let role: DocumentRole;
  let roleConfidence: number;
  let roleMethod: string;

  if (tier0 && tier0.weight >= 0.9 && tier0.role !== "unknown") {
    role = tier0.role;
    roleConfidence = tier0.weight;
    roleMethod = "tier0_provenance";
  } else {
    const t1 = tier1DocumentRole(doc);
    role = t1.role;
    roleConfidence = t1.confidence;
    roleMethod = "tier1_lexical";
    if (tier0) {
      roleConfidence = Math.max(roleConfidence, tier0.weight * 0.5);
    }
  }

  let subtype: string | null = null;
  if (/\bretifica[çc][ãa]o\b/i.test(doc.metadata.title ?? "")) subtype = "edital_retificacao";

  const linkDensity = doc.stats.linkDensity ?? 0;
  const sections = doc.sections.map((section) => {
    const sectionRole = classifySectionRole(section, linkDensity);
    const scores = computeSectionScores(section.text);
    return { section, role: sectionRole, scores };
  });

  return { role, roleConfidence, roleMethod, subtype, sections };
}

/** Convenience: classify raw HTML (used in tests). */
export function classifyHtml(
  html: string,
  documentId = "test-doc",
  hints?: { roleHint?: RoleHint | null; kindHint?: ArtifactKindHint | null },
): ClassificationResult {
  const doc = normalizeHtmlFallback({
    documentId,
    contentType: "text/html",
    bytes: Buffer.from(html, "utf8"),
  });
  return classifyDocument(doc, hints);
}
