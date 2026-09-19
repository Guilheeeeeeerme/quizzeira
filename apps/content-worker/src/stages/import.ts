// Concept: Import — Discovery artifacts → Content Documents (§47 import.ts).

import { logInfo, logWarn } from "@quizzeira/worker-kit";
import type { ArtifactKindHint, DocumentRole, RoleHint } from "@quizzeira/shared";
import { roleHintFromKindHint } from "@quizzeira/shared";
import { content, discovery } from "../clients.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/import";
// String contract shared with discovery-api's
// src/routes/internal/artifacts.ts (IMPORT_ARTIFACT_JOB_KIND) — keep in sync.
const JOB_KIND = "import_artifact";
const LEASE_OWNER = `content-worker:${process.pid}`;

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

interface ImportJob {
  id: string;
  entityId: string;
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
 * Copies Discovery artifacts into Content as Documents, carrying role/kind
 * hints when present. Claims from the durable job lease layer (§5, item 1b)
 * instead of polling `published=false` directly: discovery-api enqueues one
 * `import_artifact` job per artifact at creation time, so a crashed worker's
 * lease simply expires and the next claim retries it — no separate recovery
 * path. `published` is still set for back-compat with other readers.
 */
export async function runImportPass(): Promise<ImportPassResult> {
  if (!contentEnv.stageImportEnabled) return { imported: 0 };

  const { jobs } = await discovery.post<{ jobs: ImportJob[] }>("/internal/jobs/claim", {
    kind: JOB_KIND,
    leaseOwner: LEASE_OWNER,
    batchSize: 25,
  });
  let imported = 0;

  for (const job of jobs) {
    try {
      const { artifact } = await discovery.get<{ artifact: DiscoveryArtifact }>(
        `/internal/artifacts/${job.entityId}`,
      );
      if (!artifact.examSlug) {
        await discovery.post(`/internal/jobs/${job.id}/complete`);
        continue;
      }
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
      await discovery.post(`/internal/jobs/${job.id}/complete`);
      imported += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logWarn("artifact import failed", { worker: NAME, jobId: job.id, artifactId: job.entityId, error: message });
      await discovery
        .post(`/internal/jobs/${job.id}/fail`, { errorCode: "import_failed", error: message })
        .catch(() => undefined);
    }
  }

  if (imported) logInfo("import pass", { worker: NAME, imported });
  return { imported };
}
