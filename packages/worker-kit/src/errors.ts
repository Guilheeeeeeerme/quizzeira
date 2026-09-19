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

/**
 * Budget hits and provider outages are transient: callers should park the
 * unit of work and try again later instead of marking it failed.
 * Authentication/billing failures are NOT deferrable: retrying them only
 * burns the call counter; the provider circuit means a re-probe after the
 * long cooldown, and the unit goes to review/dead-letter meanwhile (§9, §11).
 */
const HARD_MESSAGE_RE =
  /\b(401|403)\b|unauthori[sz]ed|invalid api key|api key not valid|billing|insufficient|no credits/i;

export function isDeferrableLlmError(err: unknown): boolean {
  const code = llmErrorCode(err);
  if (code === "llm_budget_exceeded" || code === "llm_unavailable") return true;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (HARD_MESSAGE_RE.test(msg)) return false;
  return /llm_budget_exceeded|llm_unavailable|429|503|high demand|rate limit/i.test(msg);
}
