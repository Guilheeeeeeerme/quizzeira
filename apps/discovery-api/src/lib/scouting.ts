/**
 * Deterministic source-candidate scoring (§6.1).
 *
 * Signals (bounded, capped at 1.0):
 *  - official government identity:             +0.50
 *  - recognized banca identity:                +0.25
 *  - exam-language signals (name/urls):        +0.10
 *  - robots/accessibility result:              +0.10
 *  - historical artifact yield (DomainStats):  +0.15 max
 *  - domain already observed by Quizzeira:     +0.05
 *
 * Hard deny rules reject a candidate before storage — social, storefront,
 * login, link-farm and unrelated-content domains never become proposals
 * ("Outbound-link discovery remains a weak signal only", §6.1).
 *
 * Policy bands: >=0.85 and official/banca → auto-activate; 0.60–0.84 →
 * quarantine for admin review; <0.6 → observe (candidates only).
 */

export interface CandidateDomainStats {
  fetched: number;
  becameKnowledge: number;
  rejectedLowValue: number;
  avgDensity?: number | null;
}

export interface CandidateSignals {
  urls: string[];
  name: string;
  robotsAllowed?: boolean | null;
  domainStats?: CandidateDomainStats | null;
  priorSources?: number | null;
}

export type CandidateClassification = "official" | "banca" | "unknown";
export type CandidateDecision = "auto_activate" | "quarantine" | "observe";

export interface CandidateScoring {
  score: number;
  classification: CandidateClassification;
  signals: Record<string, number>;
  decision: CandidateDecision;
  denyReason?: string;
}

const SOCIAL_HOSTS = new Set([
  "instagram.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "pinterest.com",
  "tumblr.com",
  "reddit.com",
  "whatsapp.com",
  "telegram.me",
  "ebay.com",
  "amazon.com",
  "mercadolivre.com",
  "shopee.com",
  "shein.com",
  "olx.com",
  "olx.com.br",
]);

const LOGIN_PREFIX = /^(login|auth|accounts|sso)\./i;
const SOCIAL_WORDS = /\b(social|navigation|link farm|linkfarm)\b/i;
const STOREFRONT_WORDS = /\b(loja|shop|store|assine|compre|promo)\b/i;
const UNRELATED_WORDS = /\b(marketplace|hotel|market|flea|wedding)\b/i;

const OFFICIAL_HOSTS = /\.(gov|jus|leg|edu|mil)\.br$/i;
const BANCA_NAMES =
  /(vunesp|fundação\s+carlos\s+chagas|fundacao\s+carlos\s+chagas|fgv|cebraspe|cespe|cesgranrio|consulplan|ibfc|quadrix|idecan|fundetec)/i;
const EXAM_LANGUAGE =
  /\b(concursos?|editais?|oab|provas?|gabarito|inscriç[õo]es|inscricoes|banca|cargos?|vestibular)\b/i;

function hostsOf(urls: string[]): string[] {
  return urls.map((u) => {
    try {
      return new URL(u).hostname.toLowerCase().replace(/^(www(2)?|www)\./i, "");
    } catch {
      return "";
    }
  });
}

/** Returns the hard-deny reason, or null when the candidate is acceptable. */
export function hardDeny(name: string, urls: string[]): string | null {
  const hosts = hostsOf(urls).filter(Boolean);
  for (const host of hosts) {
    if (SOCIAL_HOSTS.has(host)) {
      return `social network domain (deny): ${host}`;
    }
    if (LOGIN_PREFIX.test(host)) return `login/auth domain (deny): ${host}`;
  }
  const haystack = `${name} ${hosts.join(" ")}`;
  if (SOCIAL_WORDS.test(haystack)) return "social/navigation content (deny)";
  if (STOREFRONT_WORDS.test(haystack)) return "storefront content (deny)";
  if (UNRELATED_WORDS.test(haystack)) return "unrelated content (deny)";
  return null;
}

export function scoreCandidate(signals: CandidateSignals): CandidateScoring {
  const hosts = hostsOf(signals.urls).filter(Boolean);
  const official = hosts.some((h) => OFFICIAL_HOSTS.test(h)) ? 1 : 0;
  const banca = BANCA_NAMES.test(signals.name) ? 1 : 0;
  const examLang = EXAM_LANGUAGE.test(signals.name) ? 1 : 0;
  const robots = signals.robotsAllowed === true ? 1 : 0;
  const stats = signals.domainStats ?? null;
  const yieldRatio =
    stats && stats.fetched > 0
      ? Math.max(0, Math.min(1, stats.becameKnowledge / stats.fetched))
      : 0;
  const observed = Math.min(1, Math.max(0, signals.priorSources ?? 0));

  const score = Math.min(
    1.0,
    official * 0.6 +
      banca * 0.55 +
      examLang * 0.1 +
      robots * 0.1 +
      yieldRatio * 0.15 +
      observed * 0.05,
  );
  const classification: CandidateClassification =
    official === 1 ? "official" : banca === 1 ? "banca" : "unknown";
  // Policy bands (§6.1): >=0.85 with official/banca identity auto-activates;
  // 0.60–0.84 quarantines for admin review; everything else only observes.
  const decision: CandidateDecision =
    score >= 0.85 && classification !== "unknown"
      ? "auto_activate"
      : score >= 0.6
        ? "quarantine"
        : "observe";
  return {
    score,
    classification,
    signals: { official, banca, examLang, robots, yieldRatio, observed },
    decision,
  };
}
