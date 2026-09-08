/** Media URLs from model/markdown output (OWASP LLM10). */

const RELATIVE_PATH = /^\/(?!\/)/;
const DEFAULT_ALLOWED_HOST_SUFFIXES = [
  "wikimedia.org",
  "wikipedia.org",
  "upload.wikimedia.org",
];

function hostAllowed(hostname: string, allowlist: string[]): boolean {
  const host = hostname.toLowerCase();
  return allowlist.some((entry) => {
    const needle = entry.toLowerCase().replace(/^\*\./, "");
    return host === needle || host.endsWith(`.${needle}`);
  });
}

/** Parse MEDIA_URL_ALLOWLIST (comma-separated host suffixes). Empty → defaults. */
export function mediaUrlAllowlist(
  raw: string | undefined = process.env.MEDIA_URL_ALLOWLIST,
): string[] {
  const parts = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : DEFAULT_ALLOWED_HOST_SUFFIXES;
}

/**
 * Allow relative app paths and https URLs whose host matches the allowlist.
 * Blocks data:, javascript:, http (non-TLS), and unknown hosts.
 */
export function isAllowedMediaUrl(
  url: string,
  allowlist: string[] = mediaUrlAllowlist(),
): boolean {
  const href = url.trim();
  if (!href || href.startsWith("data:") || /^javascript:/i.test(href)) {
    return false;
  }
  if (RELATIVE_PATH.test(href)) {
    return !href.includes("\\") && !href.includes("\0");
  }
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    return hostAllowed(parsed.hostname, allowlist);
  } catch {
    return false;
  }
}

export function filterAllowedMediaUrl(
  url: string,
  allowlist?: string[],
): string | null {
  return isAllowedMediaUrl(url, allowlist) ? url.trim() : null;
}
