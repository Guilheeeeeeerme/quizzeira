import type { ReactNode } from "react";
import { useLocale, useT, SUPPORTED_LOCALES } from "../i18n";
import type { Locale } from "../i18n";
import { useTheme } from "../theme/ThemeProvider";
import { Heading, IconButton, SegmentedControl, Text } from "../ui";
import styles from "./AuthLayout.module.css";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
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

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
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
      </div>

      <div className={styles.panel}>
        <div className={styles.brandBlock}>
          <p className={styles.brand}>{t("Quizzeira")}</p>
          <Heading level={1} size="display" className={styles.title}>
            {title}
          </Heading>
          {subtitle ? (
            <Text tone="secondary" size="bodySm" className={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </div>
        <div className={styles.form}>{children}</div>
      </div>
    </div>
  );
}
