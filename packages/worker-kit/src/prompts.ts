import type { PromptKey, PromptRecord } from "@quizzeira/shared";
import { dmzGet } from "./dmz";

export async function loadPrompt(key: PromptKey): Promise<string> {
  const record = await dmzGet<PromptRecord>(`/internal/prompts/${key}`);
  return record.body;
}
