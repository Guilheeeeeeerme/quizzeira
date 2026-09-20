import { readFileSync } from "node:fs";
import { join } from "node:path";
import { okResult, type SocialPost, type SocialSourceAdapter } from "../types.js";

/** Deterministic adapter for CI / local boot — no network. */
export function createFixtureAdapter(): SocialSourceAdapter {
  return {
    id: "fixture",
    platform: "fixture",
    async fetchRecent() {
      try {
        const path = join(__dirname, "../../fixtures/posts.json");
        const posts = JSON.parse(readFileSync(path, "utf8")) as SocialPost[];
        return okResult(posts);
      } catch {
        return okResult(INLINE_FIXTURE);
      }
    },
  };
}

const INLINE_FIXTURE: SocialPost[] = [
  {
    platform: "fixture",
    externalId: "fx-1",
    feedLabel: "fixture-concurso-channel",
    permalink: "https://example.invalid/fixture/1",
    text: "Saiu o edital do concurso TCE-GO 2026! PDF: https://www.cebraspe.org.br/concursos/tcego26/edital.pdf",
    observedAt: "2026-09-19T12:00:00.000Z",
  },
  {
    platform: "fixture",
    externalId: "fx-2",
    feedLabel: "fixture-concurso-channel",
    text: "Alguém tem o gabarito preliminar? https://cdn.cesgranrio.org.br/provas/gabarito_preliminar.pdf",
    attachmentUrls: [],
    observedAt: "2026-09-19T12:05:00.000Z",
  },
  {
    platform: "fixture",
    externalId: "fx-3",
    feedLabel: "fixture-noise",
    text: "Bom dia pessoal, alguém jogando hoje?",
    observedAt: "2026-09-19T12:10:00.000Z",
  },
];
