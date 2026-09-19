import {
  classifyDocumentHints,
  domainFromUrl,
  looksLikelyOpen,
  type ArtifactKindHint,
  type RoleHint,
} from "@quizzeira/shared";
import type { SocialFileCandidate, SocialPost, SocialSignal } from "./types.js";

/** Hosts that must never become Discovery Sources (mirrors discovery-api scouting). */
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
  "redd.it",
  "whatsapp.com",
  "telegram.me",
  "t.me",
  "telegram.org",
]);

const EXAM_TALK_RE =
  /\b(concursos?|editais?|edital|oab|provas?|gabarito|inscri[cç]([aã]o|[oõ]es)|banca|cespe|cebraspe|fcc|fgv|vunesp|cesgranrio|conte[uú]do\s+program)/i;

const URL_RE = /https?:\/\/[^\s<>"'）)\]]+/gi;

/** True when hostname is a social / chat CDN we refuse as a Source. */
export function isSocialHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (SOCIAL_HOSTS.has(host)) return true;
  for (const blocked of SOCIAL_HOSTS) {
    if (host === blocked || host.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function looksExamTalk(text: string): boolean {
  return EXAM_TALK_RE.test(text) || looksLikelyOpen(text);
}

function stripTrailingPunct(url: string): string {
  return url.replace(/[.,;:!?)\]}>]+$/g, "");
}

function looksFileish(url: string, label: string): boolean {
  const blob = `${label} ${url}`;
  if (/\.(pdf|docx?|odt|rtf|xlsx?|pptx?)(?:$|[?#])/i.test(url)) return true;
  if (/\/(edital|prova|gabarito|caderno|retifica)/i.test(url)) return true;
  if (/drive\.google\.com|docs\.google\.com|dropbox\.com|mediafire\.com/i.test(url)) {
    return true;
  }
  return /\b(edital|prova|gabarito|caderno|retifica|programa)\b/i.test(blob);
}

function candidateFromUrl(url: string, label: string): SocialFileCandidate | null {
  const clean = stripTrailingPunct(url);
  // Attachment URLs bypass URL_RE, so the scheme must be checked here too.
  if (!/^https?:\/\//i.test(clean)) return null;
  const domain = domainFromUrl(clean);
  if (!domain || isSocialHost(domain)) return null;
  if (!looksFileish(clean, label)) return null;
  const hints = classifyDocumentHints(label, clean);
  return {
    url: clean,
    label: label.slice(0, 200),
    kindHint: hints.kindHint as ArtifactKindHint,
    roleHint: hints.roleHint as RoleHint,
  };
}

/** Extract exam-relevant signal + outbound file candidates from one post. */
export function analyzePost(post: SocialPost): SocialSignal {
  const examRelevant = looksExamTalk(post.text);
  const urls = new Set<string>();
  for (const m of post.text.matchAll(URL_RE)) urls.add(m[0]);
  for (const a of post.attachmentUrls ?? []) urls.add(a);

  const files: SocialFileCandidate[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    const c = candidateFromUrl(url, post.text);
    if (!c || seen.has(c.url)) continue;
    seen.add(c.url);
    files.push(c);
  }

  if (!examRelevant && files.length === 0) {
    return { post, examRelevant: false, reason: "no exam talk or file links", files: [] };
  }
  if (!examRelevant && files.length > 0) {
    return {
      post,
      examRelevant: true,
      reason: "outbound exam-like file link without exam keywords",
      files,
    };
  }
  return {
    post,
    examRelevant: true,
    reason: files.length ? "exam talk + file link(s)" : "exam talk only",
    files,
  };
}
