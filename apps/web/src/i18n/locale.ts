export const SUPPORTED_LOCALES = ["pt", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";

export const STORAGE_KEY = "quizzeira.locale";

/** Map legacy stored values and browser tags onto supported locales. */
export function coerceLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (raw === "en" || raw.startsWith("en-")) return "en";
  if (raw === "pt" || raw === "pt-br" || raw.startsWith("pt")) return "pt";
  return null;
}

export function detectLocale(input: {
  stored?: string | null;
  navigatorLanguage?: string | null;
}): Locale {
  const fromStored = coerceLocale(input.stored ?? null);
  if (fromStored) return fromStored;
  const fromNav = coerceLocale(input.navigatorLanguage ?? null);
  if (fromNav) return fromNav;
  return DEFAULT_LOCALE;
}

export function translate(
  dictionaries: Record<Locale, Record<string, string>>,
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  // English keys are the source strings; missing PT falls back to the English key.
  // Preferred default locale is PT (see detectLocale).
  let text =
    locale === "en"
      ? (dictionaries.en[key] ?? key)
      : (dictionaries.pt[key] ?? dictionaries.en[key] ?? key);
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  }
  return text;
}
