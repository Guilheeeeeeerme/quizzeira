import { workerEnv } from "./env";

export async function dmzFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body != null && init.body !== "";
  const res = await fetch(`${workerEnv.internalApiUrl}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      "x-internal-key": workerEnv.internalApiKey,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`DMZ ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export function dmzGet<T>(path: string): Promise<T> {
  return dmzFetch<T>(path);
}

export function dmzPost<T>(path: string, body?: unknown): Promise<T> {
  return dmzFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export function dmzPut<T>(path: string, body: unknown): Promise<T> {
  return dmzFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function dmzPatch<T>(path: string, body: unknown): Promise<T> {
  return dmzFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
