import type { PromptKey, PromptRecord } from "@quiz-app/shared";
import { dmzGet } from "./dmz";

export async function loadPrompt(key: PromptKey): Promise<string> {
  const record = await dmzGet<PromptRecord>(`/internal/prompts/${key}`);
  return record.body;
}
