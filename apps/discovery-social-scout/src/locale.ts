/**
 * pt-BR is the product default for Brazilian concurso discovery.
 * Aligns with packages/shared LocaleCode ("pt") / web DEFAULT_LOCALE.
 */
export const DEFAULT_SOCIAL_LOCALE = "pt-BR";

/** Resolve scout locale; only `pt-BR` (default) and `en` are recognized. */
export function resolveSocialLocale(raw?: string): "pt-BR" | "en" {
  const value = (raw ?? process.env.DISCOVERY_SOCIAL_LOCALE ?? DEFAULT_SOCIAL_LOCALE)
    .trim()
    .toLowerCase();
  if (value === "en" || value.startsWith("en-")) return "en";
  return "pt-BR";
}

/**
 * Per-provider query shaping for official APIs.
 * Gaps (no language filter): Reddit public search, Instagram Graph media,
 * Facebook Page feed, Telegram Bot getUpdates — those rely on pt-BR keywords
 * / operator-chosen BR feeds instead.
 */
export interface ProviderLocaleParams {
  /** X recent search operator, e.g. `lang:pt`. */
  xLangOperator: string | null;
  /** Google CSE `lr` (language restrict). */
  googleLr: string | null;
  /** Google CSE `gl` (geolocation / country). */
  googleGl: string | null;
  /** Google CSE `hl` (interface / bias language). */
  googleHl: string | null;
  /** YouTube Data API `relevanceLanguage`. */
  youtubeRelevanceLanguage: string | null;
  /** YouTube Data API `regionCode`. */
  youtubeRegionCode: string | null;
}

export function providerLocaleParams(
  locale: "pt-BR" | "en" = resolveSocialLocale(),
): ProviderLocaleParams {
  if (locale === "en") {
    return {
      xLangOperator: "lang:en",
      googleLr: "lang_en",
      googleGl: "us",
      googleHl: "en",
      youtubeRelevanceLanguage: "en",
      youtubeRegionCode: "US",
    };
  }
  return {
    xLangOperator: "lang:pt",
    googleLr: "lang_pt",
    googleGl: "br",
    googleHl: "pt-BR",
    youtubeRelevanceLanguage: "pt",
    youtubeRegionCode: "BR",
  };
}

/** Google CSE query suffix favoring exam file hits (pt-BR vocabulary). */
export function googleQuerySuffix(locale: "pt-BR" | "en" = resolveSocialLocale()): string {
  if (locale === "en") return "(filetype:pdf OR notice OR answer key OR exam)";
  return "(filetype:pdf OR edital OR gabarito OR prova OR inscrição)";
}
