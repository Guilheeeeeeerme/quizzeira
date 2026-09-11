import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import "@fontsource-variable/inter/wght.css";
import "../styles/global.css";

export type ThemeMode = "dark";

interface ThemeContextValue {
  theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Linear UI guide requires dark primary surfaces; light mode is not offered. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    try {
      localStorage.removeItem("quizzeira.theme");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ theme: "dark" as const }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
