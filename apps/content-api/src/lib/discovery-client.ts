import { env } from "./env";

export type DiscoveryArtifactProvenance = {
  artifact: {
    id: string;
    examId: string | null;
    examSlug: string | null;
    examTitle: string | null;
    sourceId: string | null;
    topicQueryId: string | null;
    kind: string;
    kindHint: string;
    roleHint: string;
    anchorLabel: string | null;
    contentHash: string | null;
    url: string | null;
    storageKey: string | null;
    published: boolean;
    fetchSignals: unknown;
    fetchedAt: string;
  };
  source: {
    id: string;
    domain: string;
    name: string;
    kind: string;
    discoveryMode: string;
    trust: string;
    authorityScore: number | null;
    status: string;
  } | null;
  topicQuery: {
    id: string;
    examId: string;
    syllabusNodeId: string;
    canonicalKey: string;
    queries: unknown;
    status: string;
    candidatesFound: number;
    candidatesStored: number;
  } | null;
};

/** Best-effort resolve of discovery Artifact → Source / TopicQuery for §30 provenance. */
export async function fetchArtifactProvenance(
  artifactId: string,
): Promise<DiscoveryArtifactProvenance | null> {
  const base = env.discoveryApiUrl;
  if (!base || !artifactId) return null;
  try {
    const res = await fetch(`${base}/internal/artifacts/${encodeURIComponent(artifactId)}`, {
      headers: {
        "x-internal-key": env.discoveryApiKey,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as DiscoveryArtifactProvenance;
  } catch {
    return null;
  }
}
