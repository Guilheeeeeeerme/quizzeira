import { createHash } from "node:crypto";
import type { ArtifactKindHint, RoleHint } from "@quizzeira/shared";
import { kindHintToArtifactKind } from "@quizzeira/shared";
import { dmzPost } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { fetchBytes } from "./fetch.js";
import { htmlToRoughText, rejectAfterFetch } from "./search/postfetch.js";

function sha256Hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export interface StoreArtifactInput {
  examId?: string | null;
  sourceId: string;
  url: string;
  withBytes: boolean;
  kindHint?: ArtifactKindHint;
  roleHint?: RoleHint;
  anchorLabel?: string;
  topicQueryId?: string;
  /** Legacy kind for oab-fgv and callers that still pass kind directly. */
  kind?: string;
  etag?: string | null;
  lastModified?: Date | null;
  contentHash?: string | null;
  fetchSignals?: Record<string, unknown>;
  /** Domain for robots/politeness; defaults to hostname of url. */
  domain?: string;
  politenessMs?: number;
}

export type StoreArtifactResult =
  | { downloaded: boolean; rejected?: undefined }
  | { downloaded: false; rejected: string };

/**
 * Persist an artifact. RC-2: never attach listing pages to exams — use
 * storeSourceListingArtifact for listing HTML attached to Source only.
 */
export async function storeArtifact(
  input: StoreArtifactInput,
): Promise<StoreArtifactResult | null> {
  if (input.kindHint === "listing" && input.examId) {
    throw new Error("listing artifacts must not be attached to an exam");
  }

  const kindHint = input.kindHint ?? "unknown";
  const roleHint = input.roleHint ?? "unknown";
  const kind = input.kind ?? kindHintToArtifactKind(kindHint);

  let base64: string | undefined;
  let contentType: string | undefined;
  let contentHash = input.contentHash ?? null;
  let etag = input.etag ?? null;
  let lastModified = input.lastModified ?? null;

  if (input.withBytes) {
    try {
      const domain = input.domain || domainFromUrl(input.url);
      const fetched = await fetchBytes(input.url, {
        domain: domain || "unknown",
        politenessMs: input.politenessMs ?? 1000,
      });
      contentType = fetched.contentType;
      etag = fetched.etag ?? etag;
      lastModified = fetched.lastModified ?? lastModified;
      const okType = /pdf|html|text\/plain|officedocument|msword|epub/i.test(contentType ?? "");
      if (okType && fetched.buf.byteLength <= crawlerEnv.maxArtifactBytes) {
        // Post-fetch rejects for knowledge topic candidates (§17.3).
        if (input.roleHint === "knowledge" && /html/i.test(contentType ?? "")) {
          const html = fetched.buf.toString("utf8");
          const text = htmlToRoughText(html);
          const reason = rejectAfterFetch({ text, html });
          if (reason) {
            return { downloaded: false, rejected: reason };
          }
        }
        base64 = fetched.buf.toString("base64");
        contentHash = contentHash ?? fetched.contentHash;
      }
    } catch {
      // Record URL reference only (including robots disallow).
    }
  }

  try {
    await dmzPost("/internal/artifacts", {
      examId: input.examId ?? null,
      sourceId: input.sourceId,
      kind,
      kindHint,
      roleHint,
      anchorLabel: input.anchorLabel ?? null,
      topicQueryId: input.topicQueryId ?? null,
      url: input.url,
      contentType: contentType ?? "application/octet-stream",
      base64,
      contentHash,
      etag,
      lastModified: lastModified?.toISOString() ?? null,
      fetchSignals: input.fetchSignals ?? null,
    });
    return { downloaded: Boolean(base64) };
  } catch {
    return null;
  }
}

/** Listing page HTML for debugging — attached to Source, never to Exam (§11.2). */
export async function storeSourceListingArtifact(input: {
  sourceId: string;
  url: string;
  html: string;
}): Promise<{ downloaded: boolean } | null> {
  const buf = Buffer.from(input.html, "utf8");
  if (buf.byteLength > crawlerEnv.maxArtifactBytes) return null;
  try {
    await dmzPost("/internal/artifacts", {
      examId: null,
      sourceId: input.sourceId,
      kind: "other",
      kindHint: "listing",
      roleHint: "administrative",
      url: input.url,
      contentType: "text/html",
      base64: buf.toString("base64"),
      contentHash: sha256Hex(buf),
    });
    return { downloaded: true };
  } catch {
    return null;
  }
}

/** Fetch bytes with politeness and store (direct / topic modes). */
export async function storeArtifactFromFetch(
  input: StoreArtifactInput & {
    domain: string;
    politenessMs: number;
  },
): Promise<{ downloaded: boolean } | null> {
  let base64: string | undefined;
  let contentType: string | undefined;
  let contentHash = input.contentHash ?? null;
  let etag = input.etag ?? null;
  let lastModified = input.lastModified ?? null;

  if (input.withBytes) {
    try {
      const fetched = await fetchBytes(input.url, {
        domain: input.domain,
        politenessMs: input.politenessMs,
      });
      if (fetched.buf.byteLength <= crawlerEnv.maxArtifactBytes) {
        base64 = fetched.buf.toString("base64");
        contentType = fetched.contentType;
        contentHash = fetched.contentHash;
        etag = fetched.etag;
        lastModified = fetched.lastModified;
      }
    } catch {
      // URL reference only.
    }
  }

  const kindHint = input.kindHint ?? "unknown";
  const kind = input.kind ?? kindHintToArtifactKind(kindHint);

  try {
    await dmzPost("/internal/artifacts", {
      examId: input.examId ?? null,
      sourceId: input.sourceId,
      kind,
      kindHint,
      roleHint: input.roleHint ?? "unknown",
      anchorLabel: input.anchorLabel ?? null,
      topicQueryId: input.topicQueryId ?? null,
      url: input.url,
      contentType: contentType ?? "application/octet-stream",
      base64,
      contentHash,
      etag,
      lastModified: lastModified?.toISOString() ?? null,
      fetchSignals: input.fetchSignals ?? null,
    });
    return { downloaded: Boolean(base64) };
  } catch {
    return null;
  }
}
