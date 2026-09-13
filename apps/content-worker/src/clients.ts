// Two upstreams, two keys: the worker reads artifacts from Discovery and writes
// everything else to Content. worker-kit's dmz helpers assume a single
// INTERNAL_API_URL, which does not fit a stage that spans two services.
import { contentEnv } from "./env.js";
import { currentRunId } from "@quizzeira/worker-kit";

async function call<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const hasBody = init?.body != null && init.body !== "";
  const runId = currentRunId();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      "x-internal-key": apiKey,
      ...(runId ? { "x-run-id": runId } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${baseUrl}${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const discovery = {
  get: <T>(path: string) => call<T>(contentEnv.discoveryApiUrl, contentEnv.discoveryApiKey, path),
  post: <T>(path: string, body?: unknown) =>
    call<T>(contentEnv.discoveryApiUrl, contentEnv.discoveryApiKey, path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body: unknown) =>
    call<T>(contentEnv.discoveryApiUrl, contentEnv.discoveryApiKey, path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const content = {
  get: <T>(path: string) => call<T>(contentEnv.contentApiUrl, contentEnv.contentApiKey, path),
  post: <T>(path: string, body?: unknown) =>
    call<T>(contentEnv.contentApiUrl, contentEnv.contentApiKey, path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body: unknown) =>
    call<T>(contentEnv.contentApiUrl, contentEnv.contentApiKey, path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    call<T>(contentEnv.contentApiUrl, contentEnv.contentApiKey, path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
