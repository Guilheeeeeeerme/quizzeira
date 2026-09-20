import type { FetchLike } from "./types.js";

export interface JsonFetchOpts {
  fetchFn?: FetchLike;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
}

/**
 * Small JSON GET/POST helper with injectable fetch for unit tests.
 * Official public APIs only — callers supply documented endpoints.
 */
export async function fetchJson<T>(
  url: string,
  opts: JsonFetchOpts = {},
): Promise<{ ok: true; data: T; status: number } | { ok: false; status: number; body: string }> {
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  const res = await fetchFn(url, {
    method: opts.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(opts.headers ?? {}),
    },
    body: opts.body,
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 400) };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T, status: res.status };
  } catch {
    return { ok: false, status: res.status, body: `invalid JSON: ${text.slice(0, 200)}` };
  }
}
