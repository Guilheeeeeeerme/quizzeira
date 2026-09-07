export type LlmErrorCode =
  | "llm_unavailable"
  | "guardrail_block"
  | "llm_budget_exceeded"
  | "llm_provider_failed"
  | "llm_shape";

export type LlmTypedError = Error & { code: LlmErrorCode };

export function llmError(code: LlmErrorCode, message: string): LlmTypedError {
  return Object.assign(new Error(message), { code }) as LlmTypedError;
}

export function llmErrorCode(err: unknown): string | null {
  if (err instanceof Error) {
    const code = (err as Error & { code?: unknown }).code;
    if (typeof code === "string" && code) return code;
  }
  return null;
}
