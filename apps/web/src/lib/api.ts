const base = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status);
  }

  return data as T;
}

export async function triggerCorrection(attemptId: string) {
  return api<{ attemptId: string; status: string; score: number }>(
    `/quiz/${attemptId}/correct`,
    { method: "POST" },
  );
}
