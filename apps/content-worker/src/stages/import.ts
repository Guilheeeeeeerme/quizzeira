// Concept: Import — Discovery artifacts → Content Documents (§47 import.ts).

import { logInfo, logWarn } from "@quizzeira/worker-kit";
import type { ArtifactKindHint, DocumentRole, RoleHint } from "@quizzeira/shared";
import { roleHintFromKindHint } from "@quizzeira/shared";
import { content, discovery } from "../clients.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/import";

interface DiscoveryArtifact {
  id: string;
  examSlug: string | null;
  examTitle: string | null;
  kind: string;
  kindHint?: ArtifactKindHint;
  roleHint?: RoleHint;
  url: string | null;
  storageKey: string | null;
  checksum: string | null;
  contentType: string | null;
}

function mapRoleHint(roleHint?: RoleHint, kindHint?: ArtifactKindHint): DocumentRole {
  if (roleHint && roleHint !== "unknown") return roleHint;
  if (kindHint && kindHint !== "unknown") return roleHintFromKindHint(kindHint);
  return "unknown";
}

export interface ImportPassResult {
  imported: number;
}

/**
 * Copies unpublished Discovery artifacts into Content as Documents, carrying
 * role/kind hints when present. Marks artifacts published upstream after import.
 */
export async function runImportPass(): Promise<ImportPassResult> {
  if (!contentEnv.stageImportEnabled) return { imported: 0 };

  const { items } = await discovery.get<{ items: DiscoveryArtifact[] }>(
    "/internal/artifacts?published=false&limit=25",
  );
  let imported = 0;

  for (const artifact of items) {
    if (!artifact.examSlug) continue;
    try {
      const roleHint = artifact.roleHint ?? "unknown";
      const kindHint = artifact.kindHint ?? "unknown";
      await content.post("/internal/documents", {
        discoveryArtifactId: artifact.id,
        examSlug: artifact.examSlug,
        examTitle: artifact.examTitle,
        kind: artifact.kind,
        roleHint,
        kindHint,
        role: mapRoleHint(roleHint, kindHint),
        sourceUrl: artifact.url,
        storageKey: artifact.storageKey,
        checksum: artifact.checksum,
        contentType: artifact.contentType,
      });
      await discovery.patch(`/internal/artifacts/${artifact.id}`, { published: true });
      imported += 1;
    } catch (err) {
      logWarn("artifact import failed", {
        worker: NAME,
        artifactId: artifact.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (imported) logInfo("import pass", { worker: NAME, imported });
  return { imported };
}
