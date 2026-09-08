import { slugifyKey } from "@quizzeira/shared";

/** Soft product gate: non-open-exam presets rejected on create from public API. */
export function assertOpenExamOnlyPreset(presetSlug: string | null | undefined): void {
  if (presetSlug == null || presetSlug === "open_exam") return;
  throw Object.assign(
    new Error("Only open exam preset is available in this product phase"),
    { statusCode: 400 },
  );
}

export function catalogSlugHint(title: string): string {
  return slugifyKey(title);
}
