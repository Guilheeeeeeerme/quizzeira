const base = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function localeHeader(): Record<string, string> {
  try {
    const stored = localStorage.getItem("quizzeira.locale");
    if (stored === "pt-BR" || stored === "en") {
      return { "Accept-Language": stored, "X-Locale": stored };
    }
  } catch {}
  return { "Accept-Language": "en", "X-Locale": "en" };
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...localeHeader(),
    ...(options.headers as Record<string, string> | undefined),
  };
  // Avoid Content-Type: application/json on body-less POSTs — Fastify returns 400
  // when parsing an empty JSON body (breaks /auth/logout).
  if (options.body !== undefined && headers["Content-Type"] === undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status);
  }

  return data as T;
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    credentials: "include",
    headers: localeHeader(),
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status);
  }
  return data as T;
}
