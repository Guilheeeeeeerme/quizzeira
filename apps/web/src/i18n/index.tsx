import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

const STORAGE_KEY = "quizzeira.locale";

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {},
  "pt-BR": {
    "AI Dev Quiz": "Quiz de Dev IA",
    "Dashboard": "Painel",
    "Progress": "Progresso",
    "Language": "Idioma",
    "Log out": "Sair",
    "Log out?": "Sair?",
    "You will need to sign in again to continue your quizzes.":
      "Você precisará entrar novamente para continuar seus quizzes.",
    "Cancel": "Cancelar",
    "Switch to light mode": "Mudar para modo claro",
    "Switch to dark mode": "Mudar para modo escuro",
    "Sign in": "Entrar",
    "Continue your AI development quizzes.": "Continue seus quizzes de desenvolvimento com IA.",
    "Email": "E-mail",
    "Password": "Senha",
    "No account?": "Não tem conta?",
    "Register": "Criar conta",
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
    "Score": "Pontuação",
    "View": "Ver",
    "Failed to start quiz": "Falha ao iniciar o quiz",
    "Loading quiz...": "Carregando quiz...",
    "Answer choices": "Opções de resposta",
    "Question {current} of {total}": "Questão {current} de {total}",
    "Your answer": "Sua resposta",
    "Back": "Voltar",
    "Next": "Próxima",
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
    "Track attempts and scores across your topics.":
      "Acompanhe tentativas e pontuações nos seus tópicos.",
    "Start a study pill from Topics to see history here.":
      "Inicie uma pill em Tópicos para ver o histórico aqui.",
    "Topic": "Tópico",
    "Summary by level": "Resumo por nível",
    "Attempts:": "Tentativas:",
    "Best:": "Melhor:",
    "Last:": "Última:",
    "All attempts": "Todas as tentativas",
    "Start a quiz from the dashboard to see history here.":
      "Inicie um quiz no painel para ver o histórico aqui.",
    "Level": "Nível",
    "Status": "Status",
    "Submitted": "Enviado",
    "No attempts yet.": "Nenhuma tentativa ainda.",
    "Email and password (min 6 chars) required":
      "E-mail e senha (mínimo de 6 caracteres) obrigatórios",
    "Email already registered": "E-mail já cadastrado",
    "Email and password required": "E-mail e senha obrigatórios",
    "Invalid credentials": "Credenciais inválidas",
    "Unauthorized": "Não autorizado",
    "Request failed": "Falha na requisição",
    "Quizzeira": "Quizzeira",
    "Topics": "Tópicos",
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
    "Edit": "Editar",
    "Edit topic": "Editar tópico",
    "Pick a preset to seed guidelines, then customize.":
      "Escolha um preset para preencher as diretrizes e personalize.",
    "Preset": "Preset",
    "Title": "Título",
    "Guidelines": "Diretrizes",
    "Editable — preset is only a starting point.":
      "Editável — o preset é só um ponto de partida.",
    "Save": "Salvar",
    "Links": "Links",
    "Add careers pages, job posts, or study resources. We fetch public pages when possible.":
      "Adicione páginas de carreiras, vagas ou materiais. Buscamos páginas públicas quando possível.",
    "Add link": "Adicionar link",
    "Remove": "Remover",
    "Attachments": "Anexos",
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
    "Examples": "Exemplos",
    "Start studying": "Começar a estudar",
    "Skip and start": "Pular e começar",
    "Preparing your study pill": "Preparando sua pill de estudo",
    "The AI is choosing question types and length for a short session.":
      "A IA está escolhendo tipos e quantidade de questões para uma sessão curta.",
    "Topic not found": "Tópico não encontrado",
    "Correct answer:": "Resposta correta:",
    "Explanation:": "Explicação:",
    "Generating": "Gerando",
    "In progress": "Em andamento",
    "Pending": "Pendente",
    "In correction": "Em correção",
    "Corrected": "Corrigido",
    "Timed out waiting for pill": "Tempo esgotado ao gerar a pill",
    "Pill generation failed": "Falha ao gerar a pill",
    "title and guidelines required": "título e diretrizes obrigatórios",
    "Invalid presetSlug": "Preset inválido",
    "Invalid URL": "URL inválida",
    "URL must be http(s)": "A URL deve ser http(s)",
    "Empty file": "Arquivo vazio",
    "File too large (max 20MB)": "Arquivo muito grande (máx. 20MB)",
    "file required": "arquivo obrigatório",
    "url required": "url obrigatória",
  },
};

function detectLocale(): Locale {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {}
  if (stored !== null && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  if (navigator.language?.startsWith("pt")) return "pt-BR";
  return "en";
}

function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  let text = dictionaries[locale][key] ?? key;
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  }
  return text;
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
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
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
