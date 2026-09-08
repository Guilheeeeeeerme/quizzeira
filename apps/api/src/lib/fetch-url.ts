const MAX_CHARS = 40_000;
const FETCH_TIMEOUT_MS = 12_000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchUrlText(url: string): Promise<{ ok: boolean; text: string | null }> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, text: null };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "quizzeira-link-fetch/1.0" },
    });
    clearTimeout(timer);
    if (!response.ok) return { ok: false, text: null };
    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();
    const text = contentType.includes("html") ? stripHtml(raw) : raw.trim();
    if (!text) return { ok: false, text: null };
    return { ok: true, text: text.slice(0, MAX_CHARS) };
  } catch {
    return { ok: false, text: null };
  }
}

export function excerptText(value: string | null | undefined, max = 6000): string | null {
  if (!value?.trim()) return null;
  return value.trim().slice(0, max);
}
