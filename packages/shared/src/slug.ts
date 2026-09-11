/**
 * Stable identity slug. Used for exam slugs, subject slugs and source ids, so
 * changing it would re-key existing rows across all three databases.
 */
export function slugifyKey(raw: string | null | undefined, maxLen = 64): string {
  const base = String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return base || "unknown";
}
