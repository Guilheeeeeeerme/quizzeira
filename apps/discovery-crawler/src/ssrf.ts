/**
 * Block SSRF-style fetches to loopback, link-local, and RFC1918/private targets.
 * Fixture mode callers should skip this check before invoking fetch helpers.
 */

import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

export function isBlockedIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v) return true;
  if (v === "::1" || v === "0:0:0:0:0:0:0:1") return true;
  if (v.startsWith("fe80:") || v.startsWith("fc") || v.startsWith("fd")) return true;

  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

export function assertSafeFetchUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`ssrf_blocked:invalid_url:${raw.slice(0, 120)}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`ssrf_blocked:scheme:${url.protocol}`);
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost")) {
    throw new Error(`ssrf_blocked:hostname:${host}`);
  }
  if (isIP(host) && isBlockedIp(host)) {
    throw new Error(`ssrf_blocked:ip:${host}`);
  }
  return url;
}

/** Resolve hostname and reject private/link-local answers. */
export async function assertSafeFetchTarget(raw: string): Promise<URL> {
  const url = assertSafeFetchUrl(raw);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return url;
  try {
    const results = await lookup(host, { all: true, verbatim: true });
    for (const r of results) {
      if (isBlockedIp(r.address)) {
        throw new Error(`ssrf_blocked:resolved:${host}->${r.address}`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("ssrf_blocked:")) throw err;
    // DNS failure: let the subsequent fetch surface the error; do not open the gate.
    throw new Error(`ssrf_blocked:dns:${host}`);
  }
  return url;
}
