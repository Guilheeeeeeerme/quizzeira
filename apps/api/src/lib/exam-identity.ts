import type { LocaleCode } from "@quizzeira/shared";
import { normalizeLocale, slugifyKey } from "@quizzeira/shared";

const KNOWN_ORGS =
  /\b(transpetro|petrobras|bb|banco\s+do\s+brasil|caixa(?:\s+econ[oô]mica)?|correios|marinha|inss|receita\s+federal|pol[ií]cia\s+federal|prefeitura|ibamsp|pf|prf|tcu|tst|trf|trt|mpm|mpu|aneel|anatel|anvisa|ibama|funai)\b/gi;

const KNOWN_BANCAS =
  /\b(cesgranrio|fgv|fcc|cebraspe|cespe|vunesp|ibfc|iades|aoqp|fundatec|ibamsp|institut[oa]\s+acesso)\b/gi;

function firstMatch(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m?.[0]?.trim() ?? null;
}

function lineValue(guidelines: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im");
    const m = guidelines.match(re);
    const value = m?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

/**
 * Derive a shared bank key from topic copy (title + guidelines + focus).
 * Materials stay context; this only names the exam identity for reuse.
 */
export function inferExamIdentity(input: {
  topicTitle: string;
  guidelines: string;
  focusText?: string | null;
}): { examSlug: string; emphasis: string | null; displayLabel: string } {
  const blob = [input.topicTitle, input.guidelines, input.focusText ?? ""].join("\n");
  const org =
    lineValue(input.guidelines, [
      "Órgão\\s*/\\s*concurso",
      "Orgao\\s*/\\s*concurso",
      "Exam\\s*/\\s*agency",
      "Órgão",
      "Orgao",
      "Concurso",
      "Exam",
    ]) ?? firstMatch(KNOWN_ORGS, blob);
  const banca = firstMatch(KNOWN_BANCAS, blob);
  const emphasis =
    lineValue(input.guidelines, [
      "Cargo\\s*/\\s*vaga\\s*/\\s*ênfase[^:]*",
      "Cargo\\s*/\\s*vaga\\s*/\\s*enfase[^:]*",
      "Target\\s+role\\s*/\\s*vacancy\\s*/\\s*emphasis[^:]*",
      "Cargo",
      "Ênfase",
      "Enfase",
      "Role",
    ]) ??
    (input.focusText?.trim() || null);

  const parts = [org, banca].filter(Boolean).map((p) => String(p));
  const label =
    parts.length > 0
      ? parts.join(" ")
      : input.topicTitle.trim() || "open_exam";
  const examSlug = slugifyKey(label);
  return {
    examSlug,
    emphasis: emphasis ? emphasis.slice(0, 120) : null,
    displayLabel: label,
  };
}

export function pickSubjectForDeposit(
  subjects: string[],
  focusText: string | null | undefined,
  fallback = "geral",
): string {
  const focus = focusText?.trim();
  if (focus) {
    const hit = subjects.find((s) => s.toLowerCase().includes(focus.toLowerCase()));
    if (hit) return hit;
    return focus;
  }
  return subjects[0] ?? fallback;
}

export function localeOrDefault(value: string | null | undefined): LocaleCode {
  return normalizeLocale(value);
}
