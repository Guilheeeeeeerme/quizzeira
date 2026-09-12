/** Direct-mode URL ingestion (§11.4). */

import type { ArtifactKindHint, RoleHint } from "@quizzeira/shared";
import { storeArtifact } from "./store.js";
import { isPublicHttpUrl } from "./robots.js";

export async function ingestDirectUrl(input: {
  url: string;
  sourceId: string;
  examId?: string | null;
  kindHint?: ArtifactKindHint;
  roleHint?: RoleHint;
  label?: string;
}): Promise<{ downloaded: boolean } | null> {
  if (!isPublicHttpUrl(input.url)) return null;
  return storeArtifact({
    examId: input.examId ?? null,
    sourceId: input.sourceId,
    url: input.url,
    withBytes: true,
    kindHint: input.kindHint ?? "unknown",
    roleHint: input.roleHint ?? "unknown",
    anchorLabel: input.label,
  });
}
