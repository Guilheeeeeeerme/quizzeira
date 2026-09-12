/** Per-section role classification (§14). */

import type { SectionRole } from "../curriculum/roles";
import { metadataProbability } from "../curriculum/metadata";

export function classifySectionRole(heading: string | null, text: string): SectionRole {
  const blob = `${heading ?? ""}\n${text.slice(0, 2000)}`;

  if (/conte[uú]do\s+program[aá]tico|programa\s+das?\s+provas|anexo.*programa/i.test(blob)) {
    return "syllabus";
  }
  if (/das?\s+inscri[cç][oõ]es|taxa\s+de\s+inscri|isen[cç][aã]o/i.test(blob)) {
    return "registration";
  }
  if (/vagas|cadastro\s+de\s+reserva|remunera[cç][aã]o|sal[aá]rio/i.test(blob)) {
    return "vacancies";
  }
  if (/cronograma|calend[aá]rio|datas?\s+das?\s+provas/i.test(blob)) {
    return "schedule";
  }
  if (/estrutura\s+da\s+prova|n[uú]mero\s+de\s+quest|peso\s+das?\s+provas/i.test(blob)) {
    return "exam_structure";
  }
  if (/gabarito|resposta\s+definitiva/i.test(blob)) return "answer_key";
  if (/quest[aã]o\s+\d+|assinale\s+a\s+alternativa/i.test(blob)) return "question_block";
  if (/art\.\s*\d+|cap[ií]tulo|se[cç][aã]o\s+[IVX]/i.test(blob) && /lei|c[oó]digo|constitui/i.test(blob)) {
    return "legal_article";
  }
  if (/das?\s+disposi[cç][oõ]es|das?\s+disposicoes/i.test(blob)) return "legal_disposition";
  if (/instru[cç][oõ]es?\s+aos?\s+candidatos|o\s+candidato\s+dever/i.test(blob)) {
    return "instructional";
  }
  if (/menu|voltar|cookie|naveg/i.test(blob)) return "nav";

  const meta = metadataProbability(blob);
  if (meta > 0.55) return "other";
  if (text.length > 200) return "content";
  return "other";
}
