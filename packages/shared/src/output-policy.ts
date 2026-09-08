/**
 * Output-side policy screen (OWASP LLM10) — shared by API persist paths and
 * worker-kit. Mirrors registry.yml script-exec / data-exfil / tracking.
 */

export interface OutputPolicy {
  id: string;
  pattern: RegExp;
}

export const OUTPUT_POLICIES: readonly OutputPolicy[] = [
  {
    id: "script-exec",
    pattern: /<script\b|javascript:|\bon(load|error|click|submit|mouseover)\s*=/i,
  },
  {
    id: "data-exfil",
    pattern:
      /\b(webhook\.site|exfiltrat\w*|pastebin\.com|requestbin\w*|ngrok\.(io|dev|app)|pipedream\.net|burpcollaborator\.net)\b|\bcurl\b\s+https?:|\bnc\s+-e\b/i,
  },
  {
    id: "tracking",
    pattern: /\btracking\s+pixel\b|\butm_[a-z]+\b|\b(pixel|beacon)\.(gif|png|js)\b/i,
  },
];

export class OutputPolicyError extends Error {
  readonly policyId: string;
  constructor(policyId: string) {
    super(`Model output blocked by policy: ${policyId}`);
    this.name = "OutputPolicyError";
    this.policyId = policyId;
  }
}

/** Block script/exfil/tracking payloads before persist or render. */
export function screenModelOutput(payload: string): void {
  if (!payload) return;
  for (const policy of OUTPUT_POLICIES) {
    if (policy.pattern.test(payload)) {
      throw new OutputPolicyError(policy.id);
    }
  }
}

export function screenModelStrings(...values: Array<string | null | undefined>): void {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      screenModelOutput(value);
    }
  }
}
