/** Stems that quiz the notice / vacancy table instead of subject matter. */
const META_STEM_RE =
  /\b(organizadora|cesgranrio|quadro\s+de\s+vagas|cadastro\s+de\s+reserva|ampla\s+concorr[eê]ncia|\bPcD\b|pessoa\s+com\s+defici|\bCLT\b|celetista|employment\s+regime|regime\s+(de\s+trabalho|jur[ií]dico|celetista)|polo[s]?\s+de\s+trabalho|n[uú]mero\s+de\s+vagas|(total\s+)?number\s+of\s+(vacancies|vagas)|vagas?\s+(para|em|de)|etapas?\s+do\s+(processo|certame|psp)|fases?\s+do\s+(processo|certame|psp)|quem\s+(executa|organiza)|responsible\s+for\s+execut|entity\s+responsible|executor|based on the (provided|attached)\s+(file|pdf|document)|segundo\s+o\s+(arquivo|edital|pdf)|conforme\s+o\s+arquivo|list\s+three\s+different\s+['"]?[eê]nfases|different\s+['"]?[eê]nfases)\b/i;

export function isMetaMaterialStem(prompt: string): boolean {
  return META_STEM_RE.test(prompt);
}

export function countMetaMaterialStems(
  questions: Array<{ prompt?: string | null }>,
): number {
  return questions.filter((q) => isMetaMaterialStem(String(q.prompt ?? ""))).length;
}
