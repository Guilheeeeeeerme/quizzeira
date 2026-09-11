import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  SUPPORTED_LOCALES,
  detectLocale as detectLocaleFrom,
  translate as translateWithDict,
  type Locale,
} from "./locale";

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, STORAGE_KEY };
export type { Locale };

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * English source strings are keys. PT values may use "concursos" as a synonym
 * for Open exams — that word must not appear in code identifiers.
 */
const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    or: "or",
    "Try the demo": "Try the demo",
    "Instant guest access to sample quizzes — no signup required.":
      "Instant guest access — explore the product without signup (no seeded exam content).",
    "Demo sign-in failed": "Demo sign-in failed",
    "Failed to prepare": "Failed to prepare",
    "Action failed": "Action failed",
    "The catalog fills when the crawler discovers published exams. Nothing is invented here.":
      "The catalog fills when the crawler discovers published exams. Nothing is invented here.",
    "Catalog stays empty until admin adds sources and Ingestion discovers exams. No content seeds.":
      "Catalog stays empty until admin adds sources and Ingestion discovers exams. No content seeds.",
    Admin: "Admin",
    Sources: "Sources",
    Exams: "Exams",
    "Quality queue": "Quality queue",
    "Source registry, exams, and quality HITL queue.":
      "Source registry, exams, and quality HITL queue.",
    "Add source": "Add source",
    "No sources yet.": "No sources yet.",
    "Source proposals": "Source proposals",
    "No pending proposals.": "No pending proposals.",
    "No exams discovered yet.": "No exams discovered yet.",
    "Nothing waiting for review.": "Nothing waiting for review.",
    "Pass rate": "Pass rate",
    "Force publish": "Force publish",
    Recheck: "Recheck",
    Enable: "Enable",
    Disable: "Disable",
    Close: "Close",
    Reopen: "Reopen",
    Approve: "Approve",
    Reject: "Reject",
    Save: "Save",
    Name: "Name",
    "Edit study config": "Edit study config",
    "Exam, emphasis, and guidelines only — pick the exam from the open exams catalog.":
      "Exam, emphasis, and guidelines only — pick the exam from the open exams catalog.",
    "This removes the study config and related study pills.":
      "This removes the study config and related study pills.",
  },
  pt: {
    "AI Dev Quiz": "Quizzeira Concursos",
    Dashboard: "Painel",
    Progress: "Progresso",
    Language: "Idioma",
    "Log out": "Sair",
    "Log out?": "Sair?",
    "You will need to sign in again to continue your quizzes.":
      "Você precisará entrar novamente para continuar estudando.",
    Cancel: "Cancelar",
    "Switch to light mode": "Mudar para modo claro",
    "Switch to dark mode": "Mudar para modo escuro",
    "Sign in": "Entrar",
    "Continue your AI development quizzes.": "Continue estudando concursos públicos abertos.",
    "Continue studying open public exams.": "Continue estudando concursos públicos abertos.",
    Email: "E-mail",
    Password: "Senha",
    "No account?": "Não tem conta?",
    Register: "Criar conta",
    "Login failed": "Falha no login",
    "Create account": "Criar conta",
    "Start with a level that matches your pace.": "Escolha um concurso aberto e comece uma pill de estudo.",
    "Pick an open exam and start a study pill.": "Escolha um concurso aberto e comece uma pill de estudo.",
    "Display name": "Nome de exibição",
    "At least 6 characters": "Pelo menos 6 caracteres",
    "Registration failed": "Falha no cadastro",
    "Have an account?": "Já tem uma conta?",
    "Choose a level": "Concursos abertos",
    "Each quiz has 4 multiple-choice and 1 open question.":
      "Cada sessão de estudo mistura questões objetivas e abertas geradas para o exame.",
    "4 MCQ · 1 open": "Sessão de estudo",
    "Start quiz": "Iniciar estudo",
    "Recent attempts": "Tentativas recentes",
    "Pick a level above to start your first quiz.":
      "Escolha um concurso aberto para começar.",
    "No levels available.": "Nenhum concurso aberto ainda.",
    Score: "Pontuação",
    View: "Ver",
    "Failed to start quiz": "Falha ao iniciar o estudo",
    "Loading quiz...": "Carregando quiz...",
    "Answer choices": "Opções de resposta",
    "Question {current} of {total}": "Questão {current} de {total}",
    "Your answer": "Sua resposta",
    Back: "Voltar",
    Next: "Próxima",
    "Submit quiz": "Enviar quiz",
    "Submit failed": "Falha ao enviar",
    "Quiz in progress.": "Quiz em andamento.",
    "Submitted — your quiz is queued for automatic correction.":
      "Enviado — seu quiz está na fila para correção automática.",
    "Your quiz is being corrected automatically.": "Seu quiz está sendo corrigido automaticamente.",
    "Correction complete.": "Correção concluída.",
    "Failed to load": "Falha ao carregar",
    "Loading results": "Carregando resultados",
    "Waiting for correction": "Aguardando correção",
    "Quiz results": "Resultado do quiz",
    "Your answers were saved. Correction runs automatically — this page will refresh with your score and feedback when it's ready.":
      "Suas respostas foram salvas. A correção acontece automaticamente — esta página será atualizada com sua pontuação e feedback quando estiver pronta.",
    "Q{index}.": "Questão {index}.",
    "Your answer:": "Sua resposta:",
    "Grade:": "Nota:",
    "Back to dashboard": "Voltar ao painel",
    "Your progress": "Seu progresso",
    "Track attempts and scores across your topics.":
      "Acompanhe tentativas e pontuações nos seus tópicos.",
    "Start a study pill from an open exam to see history here.":
      "Inicie uma pill a partir de um concurso aberto para ver o histórico aqui.",
    Topic: "Tópico",
    "All attempts": "Todas as tentativas",
    Status: "Status",
    Submitted: "Enviado",
    "No attempts yet.": "Nenhuma tentativa ainda.",
    "Email and password (min 6 chars) required":
      "E-mail e senha (mínimo de 6 caracteres) obrigatórios",
    "Email already registered": "E-mail já cadastrado",
    "Email and password required": "E-mail e senha obrigatórios",
    "Invalid credentials": "Credenciais inválidas",
    Unauthorized: "Não autorizado",
    "Request failed": "Falha na requisição",
    Quizzeira: "Quizzeira",
    Topics: "Tópicos",
    "Open exams": "Concursos abertos",
    "Exam study": "Estudo para exames",
    "My studies": "Meus estudos",
    "Pick an open public exam we track, then set tempo, pill, and focus.":
      "Escolha um exame público aberto que acompanhamos; depois defina tempo, pill e foco.",
    "No open exams yet.": "Nenhum concurso aberto ainda.",
    "The catalog fills when the crawler discovers published exams. Nothing is invented here.":
      "O catálogo preenche quando o crawler descobre exames publicados. Nada é inventado aqui.",
    Open: "Aberto",
    Unknown: "Desconhecido",
    "Bank ready ({n})": "Banco pronto ({n})",
    "Bank warming ({n})": "Banco aquecendo ({n})",
    "No questions yet": "Sem questões ainda",
    "{n} questions ready": "{n} questões prontas",
    "Building bank ({n})": "Banco em montagem ({n})",
    "Building bank": "Banco em montagem",
    "Crawler has not filled this bank yet — study will generate from scratch.":
      "O crawler ainda não encheu este banco — estudar gera do zero.",
    "A few questions cached; more will arrive as the crawler runs.":
      "Poucas questões em cache; mais chegam conforme o crawler roda.",
    "Catalog seed": "Catálogo semente",
    "Study this exam": "Estudar este concurso",
    "Study anyway": "Estudar mesmo assim",
    "Search exams": "Buscar exames",
    "Search by name, org, or board…": "Buscar por nome, órgão ou banca…",
    "Filter by question bank": "Filtrar pelo banco de questões",
    "Sort exams": "Ordenar exames",
    "Sort: questions": "Ordenar: questões",
    "Sort: title": "Ordenar: título",
    "Sort: organization": "Ordenar: órgão",
    "Sort: status": "Ordenar: status",
    "All ({n})": "Todos ({n})",
    "Ready ({n})": "Prontos ({n})",
    "Building ({n})": "Montando ({n})",
    "Empty ({n})": "Vazios ({n})",
    "Tracked exams": "Exames rastreados",
    "Ready to study": "Prontos para estudar",
    "Questions in bank": "Questões no banco",
    "Showing 0 of {total}": "Mostrando 0 de {total}",
    "Showing {start}–{end} of {filtered} · {total} tracked":
      "Mostrando {start}–{end} de {filtered} · {total} rastreados",
    "Showing {shown} of {total}": "Mostrando {shown} de {total}",
    "{n} exams still have an empty question bank.":
      "{n} exames ainda estão com banco de questões vazio.",
    "No exams match your filters.": "Nenhum exame corresponde aos filtros.",
    "Clear filters": "Limpar filtros",
    "Page {page} of {pages}": "Página {page} de {pages}",
    Previous: "Anterior",
    "Pipeline status": "Status do pipeline",
    "Crawler and question-bank steps for this exam.":
      "Passos do crawler e do banco de questões deste exame.",
    "Loading timeline…": "Carregando linha do tempo…",
    "No timestamp yet": "Sem horário ainda",
    Success: "Sucesso",
    Error: "Erro",
    Skipped: "Ignorado",
    Running: "Em execução",
    "Your prepared exam study configs. Start from Open exams to pick a tracked exam.":
      "Suas configs de estudo. Comece em Concursos abertos para escolher um exame.",
    "Browse open exams": "Ver concursos abertos",
    "Back to open exams": "Voltar aos concursos abertos",
    "No studies yet.": "Nenhum estudo ainda.",
    Materials: "Configuração",
    "Customize study": "Personalizar estudo",
    "Edit study materials": "Editar configuração de estudo",
    "Edit study config": "Editar configuração de estudo",
    Admin: "Admin",
    Sources: "Fontes",
    Exams: "Concursos",
    "Quality queue": "Fila de qualidade",
    "Source registry, exams, and quality HITL queue.":
      "Registro de fontes, concursos e fila HITL de qualidade.",
    "Add source": "Adicionar fonte",
    "No sources yet.": "Nenhuma fonte ainda.",
    "Source proposals": "Propostas de fonte",
    "No pending proposals.": "Nenhuma proposta pendente.",
    "No exams discovered yet.": "Nenhum concurso descoberto ainda.",
    "Nothing waiting for review.": "Nada aguardando revisão.",
    "Pass rate": "Taxa de aprovação",
    "Force publish": "Forçar publicação",
    Recheck: "Reavaliar",
    Enable: "Ativar",
    Disable: "Desativar",
    Close: "Fechar",
    Reopen: "Reabrir",
    Approve: "Aprovar",
    Reject: "Rejeitar",
    Save: "Salvar",
    Name: "Nome",
    "Catalog stays empty until admin adds sources and Ingestion discovers exams. No content seeds.":
      "O catálogo fica vazio até o admin cadastrar fontes e a Ingestion descobrir exames. Sem seed de conteúdo.",
    "Prefer picking an open exam from the catalog. Materials stay context, not the quiz subject.":
      "Prefira escolher um concurso aberto no catálogo.",
    "Exam, emphasis, and guidelines only — pick the exam from the open exams catalog.":
      "Somente exame, ênfase e diretrizes — escolha o concurso no catálogo.",
    "This removes the study config and related study pills.":
      "Isso remove a configuração de estudo e as pills relacionadas.",
    "Studies unused for 30 days are deleted automatically.":
      "Estudos sem uso por 30 dias são apagados automaticamente.",
    "Only open exam preset is available in this product phase":
      "Somente o preset de exame público (concurso) está disponível nesta fase do produto",
    Menu: "Menu",
    "Open navigation menu": "Abrir menu de navegação",
    "Close navigation menu": "Fechar menu de navegação",
    Primary: "Principal",
    "Your topics": "Seus estudos",
    "Create study topics, attach materials, and take short daily pills.":
      "Prepare um concurso aberto e faça pills curtas de estudo.",
    "Topics unused for 30 days are deleted automatically.":
      "Estudos sem uso por 30 dias são apagados automaticamente.",
    "New topic": "Novo estudo",
    "No topics yet.": "Nenhum estudo ainda.",
    "{n} files": "{n} arquivos",
    "{n} links": "{n} links",
    "Study now": "Estudar agora",
    Edit: "Editar",
    "Edit topic": "Editar estudo",
    "Pick a preset to seed guidelines, then customize.":
      "Ajuste as diretrizes do concurso e personalize o foco.",
    Preset: "Preset",
    Title: "Título",
    Guidelines: "Diretrizes",
    "Editable — preset is only a starting point.":
      "Editável — o preset é só um ponto de partida.",
    Links: "Links",
    "Add careers pages, job posts, or study resources. We fetch public pages when possible.":
      "Adicione páginas de carreiras, vagas ou materiais. Buscamos páginas públicas quando possível.",
    "Add link": "Adicionar link",
    Remove: "Remover",
    Attachments: "Anexos",
    "Upload file": "Enviar arquivo",
    "Delete topic": "Excluir tópico",
    "Delete topic?": "Excluir tópico?",
    "This removes the topic, materials, and related study pills.":
      "Isso remove o tópico, materiais e pills relacionadas.",
    "What do you want to focus on today?": "No que você quer focar hoje?",
    "Optional — skip to let the AI use your topic guidelines":
      "Opcional — pule para a IA usar as diretrizes do tópico",
    "Today's focus": "Foco de hoje",
    "e.g. History and Geography mock aligned to the notice":
      "ex.: simulado de História e Geografia alinhado ao edital",
    "e.g. emphasize logical reasoning; avoid legislation today":
      "ex.: enfatizar raciocínio lógico; evitar legislação hoje",
    "Session length": "Duração da sessão",
    "Default is a short pill. Pick a time to scale depth.":
      "O padrão é uma pill curta. Escolha um tempo para aumentar a profundidade.",
    "Pill (default)": "Pill (padrão)",
    "{n} min": "{n} min",
    "The AI is inferring subjects and building a timed session.":
      "A IA está inferindo matérias e montando uma sessão cronometrada.",
    Examples: "Exemplos",
    "Start studying": "Começar a estudar",
    "Skip and start": "Pular e começar",
    "Preparing your study pill": "Preparando sua pill de estudo",
    "The AI is choosing question types and length for a short session.":
      "A IA está escolhendo tipos e quantidade de questões para uma sessão curta.",
    "Topic not found": "Tópico não encontrado",
    "Correct answer:": "Resposta correta:",
    "Explanation:": "Explicação:",
    Generating: "Gerando",
    "In progress": "Em andamento",
    Pending: "Pendente",
    "In correction": "Em correção",
    Corrected: "Corrigido",
    "Timed out waiting for pill": "Tempo esgotado ao gerar a pill",
    "Pill generation failed": "Falha ao gerar a pill",
    "title and guidelines required": "título e diretrizes obrigatórios",
    "Invalid presetSlug": "Preset inválido",
    "Invalid durationMinutes": "Duração inválida",
    "Invalid URL": "URL inválida",
    "URL must be http(s)": "A URL deve ser http(s)",
    "Empty file": "Arquivo vazio",
    "File too large (max 20MB)": "Arquivo muito grande (máx. 20MB)",
    "file required": "arquivo obrigatório",
    "url required": "url obrigatória",
    or: "ou",
    "Try the demo": "Experimentar o demo",
    "Instant guest access to sample quizzes — no signup required.":
      "Acesso convidado instantâneo — explore o produto sem cadastro (sem conteúdo de exame semeado).",
    "Demo sign-in failed": "Falha no acesso demo",
    "Failed to prepare": "Falha ao preparar",
    "Action failed": "Ação falhou",

    // Admin (ADMIN-only screens: Source registry, discovered exams, HITL queue)
    "Manage ingestion sources, discovered exams, and the question quality queue.":
      "Gerencie as fontes de coleta, os concursos descobertos e a fila de qualidade das questões.",
    "Admin sections": "Seções administrativas",
    "Pipeline health": "Saúde do pipeline",
    "Portals the crawler visits. Nothing is crawled until you add one.":
      "Portais que o crawler visita. Nada é coletado até você cadastrar o primeiro.",
    "Save source": "Salvar fonte",
    "Crawl now": "Coletar agora",
    "Crawl queued. It runs on the crawler's next tick.":
      "Coleta agendada. Ela roda no próximo ciclo do crawler.",
    "Source added. The crawler will pick it up on its next pass.":
      "Fonte adicionada. O crawler vai usá-la na próxima passagem.",
    "Add at least one start URL.": "Informe pelo menos uma URL inicial.",
    "Add the first portal to crawl. Quizzeira ships with an empty registry on purpose — no seeded sources.":
      "Cadastre o primeiro portal a coletar. O Quizzeira começa com registro vazio de propósito — sem fontes semeadas.",
    "e.g. Cesgranrio concursos": "ex.: Cesgranrio concursos",
    "Start URLs (one per line)": "URLs iniciais (uma por linha)",
    "The listing pages to crawl. The domain is derived from the first URL.":
      "As páginas de listagem a coletar. O domínio vem da primeira URL.",
    "Link patterns (one regex per line)": "Padrões de link (um regex por linha)",
    "Keep only links whose text or URL matches. Empty keeps everything.":
      "Mantém apenas links cujo texto ou URL corresponda. Vazio mantém tudo.",
    "Open patterns (one regex per line)": "Padrões de inscrição aberta (um regex por linha)",
    "Marks a listing as an open registration period.":
      "Marca uma listagem como período de inscrições aberto.",
    "Crawl interval (minutes)": "Intervalo de coleta (minutos)",
    "every {n} min": "a cada {n} min",
    "{n} consecutive failures": "{n} falhas consecutivas",
    "Last OK": "Último sucesso",
    "Proposed sources": "Fontes propostas",
    "Domains the crawler found in outbound links. They stay inert until you approve them.":
      "Domínios que o crawler encontrou em links externos. Ficam inativos até você aprovar.",
    "No proposals waiting.": "Nenhuma proposta aguardando.",
    Active: "Ativa",
    Broken: "Com falha",
    Proposed: "Proposta",
    Disabled: "Desativada",
    Closed: "Encerrado",
    Failed: "Reprovada",
    "Needs review": "Requer revisão",
    "Discovered exams": "Concursos descobertos",
    "Everything Ingestion has found. Close an exam the crawler cannot tell is over.":
      "Tudo que a coleta encontrou. Encerre um concurso que o crawler não consegue perceber que acabou.",
    "Filter exams by status": "Filtrar concursos por situação",
    "Add a source and run a crawl; discovered exams appear here.":
      "Cadastre uma fonte e rode uma coleta; os concursos descobertos aparecem aqui.",
    "No exams match this filter.": "Nenhum concurso corresponde a este filtro.",
    "{n} artifact(s)": "{n} arquivo(s)",
    "Last seen": "Visto por último",
    "Open listing": "Abrir listagem",
    "Mark closed": "Marcar como encerrado",
    "Mark open": "Marcar como aberto",
    "Questions the publish gate rejected or could not decide. Publishing here overrides the automated verdict.":
      "Questões que o portão de publicação reprovou ou não conseguiu decidir. Publicar aqui sobrepõe o veredito automático.",
    "Filter by verdict": "Filtrar por veredito",
    "Items land here only when structural validation or the LLM judge rejects them.":
      "Os itens chegam aqui apenas quando a validação estrutural ou o juiz LLM os reprova.",
    "Show details": "Mostrar detalhes",
    "Hide details": "Ocultar detalhes",
    "keyed correct": "marcada como correta",
    "Open source document": "Abrir documento de origem",
    "Publish anyway": "Publicar mesmo assim",
    "Re-run eval": "Reavaliar",
    score: "nota",
    "Live counters from the Discovery and Content stacks.":
      "Contadores ao vivo das camadas de coleta e de conteúdo.",
    Refresh: "Atualizar",
    Ingestion: "Coleta",
    "Discovery stack unreachable.": "Camada de coleta inacessível.",
    "Content stack unreachable.": "Camada de conteúdo inacessível.",
    "Extraction and Generation": "Extração e geração",
    "Question bank": "Banco de questões",
    Proposals: "Propostas",
    Artifacts: "Arquivos",
    "Docs pending": "Docs pendentes",
    "Docs extracted": "Docs extraídos",
    "Docs failed": "Docs com falha",
    Chunks: "Trechos",
    Embedded: "Vetorizados",
    Draft: "Rascunho",
    Published: "Publicadas",
    "Last generation run": "Última geração",
    "{n} drafted": "{n} rascunhos",
    "No generation run yet.": "Nenhuma geração executada ainda.",
  },
};

function detectLocale(): Locale {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const nav =
    typeof navigator !== "undefined" ? navigator.language : null;
  return detectLocaleFrom({ stored, navigatorLanguage: nav });
}

function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  return translateWithDict(dictionaries, locale, key, vars);
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: (key, vars) => translate(locale, key, vars) }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used within I18nProvider");
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}

export function useT(): Translate {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx.t;
}

export function localizeApiError(message: string, t: Translate) {
  return t(message);
}
