import type { ReactNode } from "react";
import { useLocale, useT, SUPPORTED_LOCALES } from "../i18n";
import type { Locale } from "../i18n";
import { Heading, SegmentedControl, Text } from "../ui";
import styles from "./AuthLayout.module.css";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
};

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
