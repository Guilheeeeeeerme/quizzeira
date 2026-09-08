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
      "Instant guest access to sample quizzes — no signup required.",
    "Demo sign-in failed": "Demo sign-in failed",
    "Failed to prepare": "Failed to prepare",
    "Action failed": "Action failed",
  },
  pt: {
    "AI Dev Quiz": "Quiz de Dev IA",
    Dashboard: "Painel",
    Progress: "Progresso",
    Language: "Idioma",
    "Log out": "Sair",
    "Log out?": "Sair?",
    "You will need to sign in again to continue your quizzes.":
      "Você precisará entrar novamente para continuar seus quizzes.",
    Cancel: "Cancelar",
    "Switch to light mode": "Mudar para modo claro",
    "Switch to dark mode": "Mudar para modo escuro",
    "Sign in": "Entrar",
    "Continue your AI development quizzes.": "Continue seus quizzes de desenvolvimento com IA.",
    Email: "E-mail",
    Password: "Senha",
    "No account?": "Não tem conta?",
    Register: "Criar conta",
    "Login failed": "Falha no login",
    "Create account": "Criar conta",
    "Start with a level that matches your pace.": "Comece com um nível no seu ritmo.",
    "Display name": "Nome de exibição",
    "At least 6 characters": "Pelo menos 6 caracteres",
    "Registration failed": "Falha no cadastro",
    "Have an account?": "Já tem uma conta?",
    "Choose a level": "Escolha um nível",
    "Each quiz has 4 multiple-choice and 1 open question.":
      "Cada quiz tem 4 questões de múltipla escolha e 1 questão aberta.",
    "4 MCQ · 1 open": "4 múltipla escolha · 1 aberta",
    "Start quiz": "Iniciar quiz",
    "Recent attempts": "Tentativas recentes",
    "Pick a level above to start your first quiz.":
      "Escolha um nível acima para começar seu primeiro quiz.",
    "No levels available.": "Nenhum nível disponível.",
    Score: "Pontuação",
    View: "Ver",
    "Failed to start quiz": "Falha ao iniciar o quiz",
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
    Open: "Aberto",
    Unknown: "Desconhecido",
    "Bank ready ({n})": "Banco pronto ({n})",
    "Bank warming ({n})": "Banco aquecendo ({n})",
    "Catalog seed": "Catálogo semente",
    "Study this exam": "Estudar este concurso",
    "Your prepared exam study configs. Start from Open exams to pick a tracked exam.":
      "Suas configs de estudo. Comece em Concursos abertos para escolher um exame.",
    "Browse open exams": "Ver concursos abertos",
    "Back to open exams": "Voltar aos concursos abertos",
    "No studies yet.": "Nenhum estudo ainda.",
    Materials: "Materiais",
    "Customize study": "Personalizar estudo",
    "Edit study materials": "Editar materiais de estudo",
    "Prefer picking an open exam from the catalog. Materials stay context, not the quiz subject.":
      "Prefira escolher um concurso aberto no catálogo. Materiais são contexto, não o assunto do quiz.",
    "Studies unused for 30 days are deleted automatically.":
      "Estudos sem uso por 30 dias são apagados automaticamente.",
    "Only open exam preset is available in this product phase":
      "Somente o preset de exame público (concurso) está disponível nesta fase do produto",
    Menu: "Menu",
    Close: "Fechar",
    "Open navigation menu": "Abrir menu de navegação",
    "Close navigation menu": "Fechar menu de navegação",
    Primary: "Principal",
    "Your topics": "Seus tópicos",
    "Create study topics, attach materials, and take short daily pills.":
      "Crie tópicos de estudo, anexe materiais e faça pills curtas diárias.",
    "Topics unused for 30 days are deleted automatically.":
      "Tópicos sem uso por 30 dias são apagados automaticamente.",
    "New topic": "Novo tópico",
    "No topics yet.": "Nenhum tópico ainda.",
    "{n} files": "{n} arquivos",
    "{n} links": "{n} links",
    "Study now": "Estudar agora",
    Edit: "Editar",
    "Edit topic": "Editar tópico",
    "Pick a preset to seed guidelines, then customize.":
      "Escolha um preset para preencher as diretrizes e personalize.",
    Preset: "Preset",
    Title: "Título",
    Guidelines: "Diretrizes",
    "Editable — preset is only a starting point.":
      "Editável — o preset é só um ponto de partida.",
    Save: "Salvar",
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
      "Acesso convidado instantâneo a quizzes de exemplo — sem cadastro.",
    "Demo sign-in failed": "Falha no acesso demo",
    "Failed to prepare": "Falha ao preparar",
    "Action failed": "Ação falhou",
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
