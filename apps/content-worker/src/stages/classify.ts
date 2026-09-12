/** Role classification stage wrapper (§14). */

import { classifyDocumentRole, type DocumentRole } from "@quizzeira/shared";

export function classifyRoleFromText(input: {
  url?: string | null;
  label?: string | null;
  kindHint?: string | null;
  roleHint?: string | null;
  text: string;
}): { role: DocumentRole; confidence: number; method: string } {
  const result = classifyDocumentRole(input);
  return {
    role: result.role,
    confidence: result.confidence,
    method: result.method,
  };
}
