// Concept: Import Discovery artifacts → Documents with role hints (§10).
import { kindToHints } from "@quizzeira/shared";
import { logInfo } from "@quizzeira/worker-kit";
import { content, discovery } from "../clients.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/import";

interface DiscoveryArtifact {
  id: string;
  examSlug: string | null;
  examTitle: string | null;
  kind: string;
  kindHint?: string;
  roleHint?: string;
  url: string | null;
  storageKey: string | null;
  checksum: string | null;
  contentHash?: string | null;
  contentType: string | null;
}

export async function importDiscoveryArtifacts(): Promise<number> {
  const { items } = await discovery.get<{ items: DiscoveryArtifact[] }>(
    `/internal/artifacts?published=false&limit=${contentEnv.docsPerPass * 4}`,
  );
  let imported = 0;
  for (const artifact of items) {
    if (!artifact.examSlug || !artifact.storageKey) continue;
    // Defensive: never import listing/admin roleHint artifacts.
    const hints = artifact.kindHint
      ? { kindHint: artifact.kindHint, roleHint: artifact.roleHint ?? "unknown" }
      : kindToHints(artifact.kind);
    if (hints.roleHint === "administrative" || artifact.kind === "listing") {
      await discovery.patch(`/internal/artifacts/${artifact.id}`, { published: true }).catch(() => undefined);
      continue;
    }
    const res = await content.post<{ created: boolean }>("/internal/documents", {
      discoveryArtifactId: artifact.id,
      examSlug: artifact.examSlug,
      examTitle: artifact.examTitle,
      kind: artifact.kind,
      roleHint: hints.roleHint,
      kindHint: hints.kindHint,
      sourceUrl: artifact.url,
      storageKey: artifact.storageKey,
      checksum: artifact.checksum ?? artifact.contentHash,
      contentHash: artifact.contentHash ?? artifact.checksum,
      contentType: artifact.contentType,
    });
    if (res.created) imported += 1;
    await discovery.patch(`/internal/artifacts/${artifact.id}`, { published: true }).catch(() => undefined);
  }
  if (imported) logInfo("imported artifacts", { worker: NAME, imported });
  return imported;
}
