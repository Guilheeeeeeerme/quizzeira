import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_CHARS = 40_000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;

const BLOCKED_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata.goog",
  "metadata",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

function linkFetchAllowlist(): Set<string> | null {
  const raw = (process.env.LINK_FETCH_ALLOWLIST ?? "").trim();
  if (!raw) return null;
  return new Set(
    raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inCidr(ip: string, base: string, prefix: number): boolean {
  const shift = 32 - prefix;
  return ipv4ToInt(ip) >>> shift === ipv4ToInt(base) >>> shift;
}

/** Block loopback, RFC1918, link-local, CGNAT, and cloud metadata ranges. */
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    if (inCidr(ip, "0.0.0.0", 8)) return true;
    if (inCidr(ip, "10.0.0.0", 8)) return true;
    if (inCidr(ip, "127.0.0.0", 8)) return true;
    if (inCidr(ip, "169.254.0.0", 16)) return true;
    if (inCidr(ip, "172.16.0.0", 12)) return true;
    if (inCidr(ip, "192.168.0.0", 16)) return true;
    if (inCidr(ip, "100.64.0.0", 10)) return true;
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      if (isIP(mapped) === 4) return isBlockedIp(mapped);
    }
    return false;
  }
  return true;
}

export async function assertSafeFetchUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Blocked hostname");
  }

  const allowlist = linkFetchAllowlist();
  if (allowlist && !allowlist.has(hostname)) {
    throw new Error("Hostname not in LINK_FETCH_ALLOWLIST");
  }

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("Blocked IP address");
    return parsed;
  }

  let records: Array<{ address: string }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("DNS resolution failed");
  }
  if (!records.length) throw new Error("DNS resolution returned no addresses");
  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error("Resolved to a private or metadata address");
    }
  }
  return parsed;
}

function resolveRedirect(current: URL, location: string): string {
  return new URL(location, current).toString();
}

export async function fetchUrlText(url: string): Promise<{ ok: boolean; text: string | null }> {
  try {
    let current = url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertSafeFetchUrl(current);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(current, {
          signal: controller.signal,
          redirect: "manual",
          headers: { "User-Agent": "quizzeira-link-fetch/1.0" },
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return { ok: false, text: null };
        if (hop === MAX_REDIRECTS) return { ok: false, text: null };
        current = resolveRedirect(new URL(current), location);
        continue;
      }

      if (!response.ok) return { ok: false, text: null };
      const contentType = response.headers.get("content-type") ?? "";
      const raw = await response.text();
      const text = contentType.includes("html") ? stripHtml(raw) : raw.trim();
      if (!text) return { ok: false, text: null };
      return { ok: true, text: text.slice(0, MAX_CHARS) };
    }
    return { ok: false, text: null };
  } catch {
    return { ok: false, text: null };
  }
}

export function excerptText(value: string | null | undefined, max = 6000): string | null {
  if (!value?.trim()) return null;
  return value.trim().slice(0, max);
}
