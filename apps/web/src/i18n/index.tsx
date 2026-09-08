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
    "Your progress": "Seu progresso",
    "Track attempts and scores across every level.":
      "Acompanhe tentativas e pontuações em todos os níveis.",
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
