/** Artifact store helpers with role/kind hints (§11). */

import { dmzPost } from "@quizzeira/worker-kit";
import type { ArtifactKindHint, RoleHint } from "@quizzeira/shared";
import { fetchBytes, USER_AGENT } from "./fetch.js";

export { USER_AGENT };

export async function storeArtifact(input: {
  examId?: string | null;
  sourceId: string;
  url: string;
  withBytes: boolean;
  kind?: string;
  kindHint?: ArtifactKindHint;
  roleHint?: RoleHint;
  anchorLabel?: string;
  topicQueryId?: string;
}): Promise<{ downloaded: boolean } | null> {
  const kind =
    input.kind ??
    (input.kindHint === "listing"
      ? "other"
      : input.kindHint && input.kindHint !== "unknown"
        ? mapKindHint(input.kindHint)
        : /edital/i.test(input.url)
          ? "edital"
          : "other");

  let base64: string | undefined;
  let contentType: string | undefined;
  let etag: string | undefined;
  let contentHash: string | undefined;

  if (input.withBytes) {
    const fetched = await fetchBytes(input.url);
    if (fetched.ok && fetched.buffer) {
      const okType = /pdf|html|text\/plain|msword|officedocument|epub/i.test(fetched.contentType);
      if (okType) {
        base64 = fetched.buffer.toString("base64");
        contentType = fetched.contentType;
        etag = fetched.etag ?? undefined;
        const { createHash } = await import("node:crypto");
        contentHash = createHash("sha256").update(fetched.buffer).digest("hex");
      }
    }
  }

  try {
    await dmzPost("/internal/artifacts", {
      examId: input.examId ?? null,
      sourceId: input.sourceId,
      kind,
      kindHint: input.kindHint ?? "unknown",
      roleHint: input.roleHint ?? "unknown",
      anchorLabel: input.anchorLabel ?? null,
      topicQueryId: input.topicQueryId ?? null,
      url: input.url,
      contentType: contentType ?? "application/octet-stream",
      base64,
      etag: etag ?? null,
      contentHash: contentHash ?? null,
    });
    return { downloaded: Boolean(base64) };
  } catch {
    return null;
  }
}

function mapKindHint(hint: ArtifactKindHint): string {
  switch (hint) {
    case "edital":
    case "retificacao":
      return "edital";
    case "programa":
      return "programa";
    case "prova":
      return "prova";
    case "gabarito":
    case "padrao_resposta":
      return "gabarito";
    default:
      return "other";
  }
}
