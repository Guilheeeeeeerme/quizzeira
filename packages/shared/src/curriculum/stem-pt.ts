// Concept: Minimal Portuguese stemmer (Snowball-inspired suffix stripping).

const SUFFIXES = [
  "amente",
  "emente",
  "idade",
  "idades",
  "adora",
  "adoras",
  "ismo",
  "ismos",
  "ista",
  "istas",
  "oso",
  "osa",
  "osos",
  "osas",
  "ação",
  "acoes",
  "ação",
  "ções",
  "mente",
  "amento",
  "imentos",
  "ança",
  "anças",
  "ível",
  "ável",
  "ções",
  "ção",
  "ões",
  "ães",
  "ais",
  "eis",
  "ois",
  "uis",
  "ns",
  "es",
  "s",
];

export function stemPt(token: string): string {
  let t = token
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (t.length < 4) return t;
  for (const suf of SUFFIXES) {
    const plain = suf.normalize("NFD").replace(/\p{M}/gu, "");
    if (t.endsWith(plain) && t.length - plain.length >= 3) {
      return t.slice(0, -plain.length);
    }
  }
  return t;
}

export function stemTokens(text: string): string[] {
  return text
    .split(/\s+/)
    .map((t) => stemPt(t))
    .filter(Boolean);
}
