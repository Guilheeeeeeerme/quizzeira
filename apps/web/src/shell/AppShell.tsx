import { useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { SUPPORTED_LOCALES, useLocale, useT } from "../i18n";
import type { Locale } from "../i18n";
import { useTheme } from "../theme/ThemeProvider";
import {
  AlertDialog,
  Button,
  IconButton,
  SegmentedControl,
  Text,
  TextLink,
} from "../ui";
import styles from "./AppShell.module.css";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
};

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.5 9.2A5.5 5.5 0 0 1 6.8 2.5 5.6 5.6 0 1 0 13.5 9.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <TextLink to="/" className={styles.brand}>
            {t("Quizzeira")}
          </TextLink>

          <nav className={styles.nav} aria-label="Primary">
            <TextLink to="/">{t("Topics")}</TextLink>
            <TextLink to="/progress">{t("Progress")}</TextLink>
          </nav>

          <div className={styles.actions}>
            <SegmentedControl
              ariaLabel={t("Language")}
              value={locale}
              options={SUPPORTED_LOCALES.map((code) => ({
                value: code,
                label: localeLabels[code],
              }))}
              onChange={setLocale}
            />
            <IconButton
              label={theme === "dark" ? t("Switch to light mode") : t("Switch to dark mode")}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </IconButton>
            {user ? (
              <Text size="caption" tone="secondary" className={styles.user}>
                {user.displayName ?? user.email}
              </Text>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => setConfirmLogout(true)}>
              {t("Log out")}
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>

      <AlertDialog
        open={confirmLogout}
        title={t("Log out?")}
        description={t("You will need to sign in again to continue your quizzes.")}
        confirmLabel={t("Log out")}
        cancelLabel={t("Cancel")}
        loading={loggingOut}
        onConfirm={() => void handleLogout()}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
