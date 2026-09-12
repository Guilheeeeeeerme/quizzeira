// Concept: Deterministic text signals shared by the metadata classifier (§22.2),
// content quality scoring (§20) and the section-role classifier (§14.5).
// Everything here is a regex count or a ratio; nothing calls a model.

export const DATE_RE =
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}\s+de\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4}\b/gi;
export const CURRENCY_RE = /R\$\s?\d/g;
export const CONTACT_RE =
  /\b(?:\(?\d{2}\)?\s?\d{4,5}-?\d{4})\b|[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/\S+|www\.\S+/gi;
export const LEGAL_CITATION_RE =
  /\bart(?:igo)?s?\.?\s*\d+|§\s*\d*|\binciso\b|\bal[íi]nea\b|\bcaput\b|\blei\s+(?:complementar\s+)?n?[ºo°.]?\s*\d|\bs[úu]mula\b|\bdecreto(?:-lei)?\s+n?[ºo°.]?\s*\d|\bconstitui[çc][ãa]o\s+federal\b|\bCF\/88\b|\bc[óo]digo\s+(?:civil|penal|tribut[áa]rio|de\s+processo)/gi;
export const EXPLANATORY_RE =
  /\bpor\s+exemplo\b|\bex\.\s*:|\bou\s+seja\b|\bisto\s+[ée]\b|\bdefine-se\b|\bconsiste\s+em\b|\bsignifica\b|\bcaracteriza-se\b|\bem\s+outras\s+palavras\b|\bportanto\b|\bassim\s+sendo\b|\bnesse\s+caso\b|\bregra\s*:|\bexce[çc][ãa]o\s*:/gi;

/** Edition-bound facts about an exam; every hit is strong evidence of B1–B4. */
export const VACANCY_STRONG_RE =
  /\binscri[çc][õo]es\s+abertas\b|\btaxa\s+de\s+inscri[çc][ãa]o\b|\bcadastro\s+de\s+reserva\b|\bremunera[çc][ãa]o\b|\bsal[áa]rio\b|\bvencimento\s+b[áa]sico\b|\bisen[çc][ãa]o\s+(?:da\s+)?taxa\b|\bboleto\b|\bcart[ãa]o\s+de\s+confirma[çc][ãa]o\b|\blocal\s+de\s+prova\b|\bconvoca[çc][ãa]o\b|\bhomologa[çc][ãa]o\b|\bposse\b|\bn[úu]mero\s+de\s+vagas\b|\bvagas?\b|\bedital\s+de\s+abertura\b|\bbanca\s+organizadora\b|\borganiza(?:[çc][ãa]o|dora)\s+do\s+(?:concurso|certame)\b|\bprazo\s+de\s+inscri[çc]|\bper[íi]odo\s+de\s+inscri[çc]|\bdata\s+da\s+prova\b|\bser[áa]\s+aplicada\b|\baplica[çc][ãa]o\s+da\s+prova\b|\best[áa]\s+(?:com\s+)?promovendo\b|\best[áa]\s+com\s+inscri[çc]|\boferecid[oa]s?\s+(?:por|pel[ao])\b|\boferece\s+o\b|\bexame\s+(?:para|de)\s+certifica[çc][ãa]o\b|\bcertifica[çc][ãa]o\b|\bescolaridade\s+exigida\b|\brequisitos?\s+(?:do|para\s+o)\s+cargo\b|\bno\s+dia\s+da\s+prova\b|\bdocumento\s+(?:oficial\s+)?de\s+identifica[çc][ãa]o\b|\bcronograma\b|\bresultado\s+(?:final|preliminar)\b|\bnota\s+de\s+corte\b|\bclassificat[óo]ri[oa]\b|\beliminat[óo]ri[oa]\b|\bcarga\s+hor[áa]ria\b|\bjornada\s+de\s+trabalho\b|\bvig[êe]ncia\s+do\s+concurso\b|\bvalidade\s+do\s+concurso\b/gi;

/** Weaker signals: present in real knowledge too, but pile up in admin text. */
export const VACANCY_MODERATE_RE =
  /\bcargos?\b|\bconcursos?\b|\bedital\b|\binscri[çc][ãa]o\b|\binscri[çc][õo]es\b|\bcandidat[oa]s?\b|\binstitui[çc][ãa]o\b|\bassocia[çc][ãa]o\b|\bcertame\b|\bprova\s+objetiva\b|\bprova\s+discursiva\b|\bquest[õo]es\s+ter[áa]\b|\bbanca\b|\bselecionad[oa]s?\b|\bprocesso\s+seletivo\b/gi;

export const CANDIDATE_IMPERATIVE_RE =
  /\bo\s+candidato\s+(?:dever[áa]|deve|n[ãa]o\s+poder[áa]|poder[áa])\b|\b[ée]\s+vedad[oa]\b|\bser[áa]\s+eliminad[oa]\b|\bser[ãa]o\s+eliminad[oa]s\b|\bdever[áa]\s+(?:comparecer|apresentar|preencher|efetuar|acessar)\b|\bcabe\s+ao\s+candidato\b|\b[ée]\s+de\s+responsabilidade\s+do\s+candidato\b/gi;

export const ORG_RE =
  /\btribunal\s+(?:de\s+contas|regional|de\s+justi[çc]a|superior)\b|\bsecretaria\s+(?:de\s+estado|municipal|da\s+fazenda)\b|\bprefeitura\b|\bc[âa]mara\s+municipal\b|\bassembleia\s+legislativa\b|\bminist[ée]rio\s+p[úu]blico\b|\bdefensoria\b|\buniversidade\s+(?:federal|estadual)\b|\bassocia[çc][ãa]o\s+brasileira\b|\bfunda[çc][ãa]o\b|\bbanco\s+do\s+brasil\b|\bcaixa\s+econ[ôo]mica\b|\bpetrobras\b|\btranspetro\b|\bcorreios\b|\binss\b|\bcesgranrio\b|\bcebraspe\b|\bcespe\b|\bfgv\b|\bvunesp\b|\bfcc\b|\bibfc\b|\biades\b|\bfundatec\b|\bidecan\b|\baocp\b|\bquadrix\b|\bconsulplan\b|\b[A-Z]{2,5}-[A-Z]{2}\b|\b(?:TCU|TCE|TCM|TRT|TRF|TRE|TJ|MPU|MPE|MPF|STF|STJ|TST|PGE|PGM|CVM|ANBIMA|PLANEJAR|MANAUSPREV|FDSBC|SEFAZ|SEF)\b/g;

export const EDITAL_REFERENCE_RE =
  /\bedital\s+n[ºo°.]?\s*\d|\bretifica[çc][ãa]o\b|\banexo\s+[IVX]+\b|\bsubitem\s+\d|\bitem\s+\d+(?:\.\d+)+/gi;

/**
 * Interrogatives whose answer is a fact about *this edition* of an exam. These
 * are the stems in the six screenshots (§4) and the REG-1xx fixtures, in form.
 */
export const METADATA_QUESTION_RE =
  /\bquantas?\s+vagas\b|\bquantas\s+quest[õo]es\b|\bqual\s+(?:o\s+)?(?:valor|pre[çc]o)\s+da\s+taxa\b|\bqual\s+(?:a\s+)?(?:remunera[çc][ãa]o|sal[áa]rio)\b|\bqual\s+(?:o\s+)?n[úu]mero\s+do\s+edital\b|\bqual\s+(?:a\s+)?escolaridade\b|\bqual\s+(?:a\s+)?data\b|\bat[ée]\s+que\s+data\b|\bem\s+que\s+(?:cidade|local|data|dia)\b|\bqual\s+(?:o\s+)?prazo\s+(?:de|para)\s+inscri|\bqual\s+(?:a\s+)?(?:institui[çc][ãa]o|associa[çc][ãa]o|entidade|[óo]rg[ãa]o|banca|empresa|organiza[çc][ãa]o)\s+(?:[ée]\s+respons[áa]vel|oferece|organiza|realiza|promove|est[áa]\s+com|aplica)\b|\bpor\s+qual\s+(?:institui[çc][ãa]o|associa[çc][ãa]o|entidade|[óo]rg[ãa]o|banca)\b|\bqual\s+cargo\b|\bpara\s+qual\s+cargo\b|\bquais\s+(?:os\s+)?cargos\b|\bqual\s+documento\s+(?:deve|dever[áa])\s+ser\s+apresentado\b|\bo\s+que\s+.{0,80}\best[áa]\s+promovendo\b|\bqual\s+(?:o\s+)?nome\s+da\s+(?:institui[çc][ãa]o|associa[çc][ãa]o|banca|empresa)\b|\bquem\s+(?:organiza|oferece|realiza|promove)\b|\best[áa]\s+com\s+inscri[çc][õo]es\s+abertas\s+para\b/i;

/** Stem asks *which topics are in the programa* rather than the topic itself (B2). */
export const SYLLABUS_META_RE =
  /(?:consta|constam|est[áa]\s+previst[oa]|fazem\s+parte|faz\s+parte|est[ãa]o\s+inclu[íi]d[oa]s|s[ãa]o\s+cobrad[oa]s|ser[ãa]o\s+cobrad[oa]s).{0,40}(?:conte[úu]do\s+program[áa]tico|programa|edital)|\bquais\s+(?:os\s+)?(?:assuntos|mat[ée]rias|disciplinas|t[óo]picos|conte[úu]dos)\b|\bconte[úu]do\s+program[áa]tico\s+(?:de|da|do)\b/i;

export const OUTLINE_MARKER_RE = /^\s*(?:\d{1,2}(?:\.\d{1,2}){0,3}[.)]?|[IVXLC]{1,6}[.)\-–]|[a-z][.)]|[•\-–—●▪])\s+\S/;
export const INLINE_NUMBERED_RE = /(?:^|\s)\d{1,2}\.\s+(?=\p{L})/gu;
export const OPTION_MARKER_RE = /(?:^|\n)\s*\(?([A-Ea-e])[).]\s+\S/g;

export function countMatches(re: RegExp, text: string): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return [...text.matchAll(new RegExp(re.source, flags))].length;
}

export function per500(count: number, chars: number): number {
  return count / Math.max(1, chars / 500);
}

export function cap(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value / max);
}

export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+(?=[\p{Lu}\d"“(])|\n{2,}/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function words(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Ordered option markers a) b) c) d) … count (an evidence signal). */
export function orderedOptionMarkers(text: string): number {
  const labels = [...text.matchAll(OPTION_MARKER_RE)].map((m) => m[1].toLowerCase());
  let expected = 0;
  let runs = 0;
  const order = ["a", "b", "c", "d", "e"];
  for (const label of labels) {
    if (label === order[expected]) {
      expected += 1;
      if (expected >= 4) {
        runs += 1;
        expected = 0;
      }
    } else if (label === "a") {
      expected = 1;
    } else {
      expected = 0;
    }
  }
  return runs;
}

/**
 * Share of "syllabus-shaped" items: short noun phrases behind outline markers
 * or separated by `;`. This catches the programa itself so it is never mistaken
 * for teachable content.
 */
export function syllabusListShape(text: string): number {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const segments: string[] = [];
  for (const line of lines) {
    const inline = line.split(/(?:^|\s)(?=\d{1,2}\.\s+\p{L})/u).map((s) => s.trim()).filter(Boolean);
    if (inline.length >= 3) segments.push(...inline);
    else if (line.split(";").length >= 3) segments.push(...line.split(";").map((s) => s.trim()));
    else segments.push(line);
  }
  if (segments.length === 0) return 0;
  const shortItems = segments.filter((s) => {
    const marker = OUTLINE_MARKER_RE.test(s) || /^[\p{Lu}]/u.test(s);
    const short = s.length <= 90;
    const noVerbSentence = !/[.!?]\s+\p{Ll}/u.test(s) && words(s).length <= 12;
    return marker && short && noVerbSentence;
  });
  const share = shortItems.length / segments.length;
  return segments.length >= 3 ? share : 0;
}

export function uppercaseShare(text: string): number {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length === 0) return 0;
  return letters.replace(/[^\p{Lu}]/gu, "").length / letters.length;
}

export function alphaRatio(text: string): number {
  const compact = text.replace(/\s+/g, "");
  if (compact.length === 0) return 0;
  return (compact.match(/\p{L}/gu)?.length ?? 0) / compact.length;
}

export function averageWordLength(text: string): number {
  const ws = words(text);
  if (ws.length === 0) return 0;
  return ws.reduce((sum, w) => sum + w.length, 0) / ws.length;
}

const PT_MARKERS = /\b(de|que|não|nao|para|com|uma|por|dos|das|como|mais|são|sao|também|tambem|seu|sua|ser|ou|foi|entre|sobre|quando)\b/gi;
const EN_MARKERS = /\b(the|and|with|that|this|from|which|are|was|were|have|has|will|not|for|you|your|their|there|about)\b/gi;
const ES_MARKERS = /\b(el|los|las|del|una|con|por|que|para|más|pero|también|como|sus|esta|este|cuando|donde|hay|muy)\b/gi;

/** Cheap language guess for pt/en/es; "und" when nothing matches. */
export function guessLanguage(text: string): "pt" | "en" | "es" | "und" {
  const sample = text.slice(0, 6000);
  const pt = countMatches(PT_MARKERS, sample);
  const en = countMatches(EN_MARKERS, sample);
  const esOnly = countMatches(/\b(el|los|las|del|pero|muy|hay|donde)\b/gi, sample);
  const es = countMatches(ES_MARKERS, sample);
  if (pt === 0 && en === 0 && es === 0) return "und";
  if (esOnly >= 3 && es > pt) return "es";
  if (en > pt * 1.5) return "en";
  return "pt";
}
