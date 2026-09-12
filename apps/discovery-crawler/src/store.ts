// Concept: Artifact store helper with role/kind hints + content hash (§11.2, §35).
import { createHash } from "node:crypto";
import { kindToHints, type ArtifactFetchSignals, type ArtifactKindHint, type RoleHint } from "@quizzeira/shared";
import { dmzPost } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { fetchUrl } from "./fetch.js";

export interface StoreArtifactInput {
  examId?: string | null;
  sourceId: string;
  url: string;
  kind?: string;
  kindHint?: ArtifactKindHint;
  roleHint?: RoleHint;
  anchorLabel?: string | null;
  topicQueryId?: string | null;
  withBytes?: boolean;
  fetchSignals?: ArtifactFetchSignals;
  politenessMs?: number;
}

export async function storeArtifact(
  input: StoreArtifactInput,
): Promise<{ downloaded: boolean; contentHash: string | null } | null> {
  const hints =
    input.kindHint || input.roleHint
      ? {
          kindHint: input.kindHint ?? "unknown",
          roleHint: input.roleHint ?? "unknown",
        }
      : kindToHints(input.kind ?? "other");

  let base64: string | undefined;
  let contentType: string | undefined;
  let contentHash: string | null = null;
  let etag: string | null = null;
  let lastModified: string | null = null;
  let downloaded = false;

  if (input.withBytes !== false) {
    try {
      const res = await fetchUrl(input.url, {
        politenessMs: input.politenessMs,
        allowPlaywright: !/\.pdf(\?|#|$)/i.test(input.url),
      });
      if (res.status >= 200 && res.status < 400 && res.body.byteLength <= crawlerEnv.maxArtifactBytes) {
        contentType = res.contentType ?? undefined;
        contentHash = createHash("sha256").update(res.body).digest("hex");
        base64 = res.body.toString("base64");
        etag = res.etag;
        lastModified = res.lastModified;
        downloaded = true;
      }
    } catch {
      // URL-only reference.
    }
  }

  const kind =
    input.kind ??
    (hints.kindHint === "listing"
      ? "listing"
      : hints.kindHint === "edital"
        ? "edital"
        : hints.kindHint === "prova"
          ? "prova"
          : hints.kindHint === "gabarito"
            ? "gabarito"
            : hints.kindHint === "programa"
              ? "programa"
              : "other");

  try {
    await dmzPost("/internal/artifacts", {
      examId: input.examId ?? null,
      sourceId: input.sourceId,
      kind,
      kindHint: hints.kindHint,
      roleHint: hints.roleHint,
      anchorLabel: input.anchorLabel ?? null,
      topicQueryId: input.topicQueryId ?? null,
      url: input.url,
      contentType: contentType ?? "application/octet-stream",
      contentHash,
      etag,
      lastModified,
      fetchSignals: input.fetchSignals,
      base64,
      storageKey: contentHash ? `artifacts/sha256/${contentHash.slice(0, 2)}/${contentHash}` : undefined,
    });
    return { downloaded, contentHash };
  } catch {
    return null;
  }
}
