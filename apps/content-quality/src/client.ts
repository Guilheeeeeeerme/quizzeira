// content-api is this worker's only upstream, but it is not the study API that
// worker-kit's dmz helpers point at, so the calls are made explicitly here.
import { currentRunId } from "@quizzeira/worker-kit";
import { qualityEnv } from "./env.js";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body != null && init.body !== "";
  const runId = currentRunId();
  const res = await fetch(`${qualityEnv.contentApiUrl}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      "x-internal-key": qualityEnv.contentApiKey,
      ...(runId ? { "x-run-id": runId } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`content-api ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const contentApi = {
  get: <T>(path: string) => call<T>(path),
  post: <T>(path: string, body?: unknown) =>
    call<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
};
