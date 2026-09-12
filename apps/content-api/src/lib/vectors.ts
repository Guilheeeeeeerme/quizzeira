// Concept: Embeddings (pgvector reads/writes) — eligible knowledge chunks only (§9.4).
import { Prisma } from "../generated/prisma";
import { env } from "./env";
import { prisma } from "./prisma";

function toVectorLiteral(embedding: number[]): string {
  if (embedding.length !== env.embeddingDimensions) {
    throw Object.assign(
      new Error(
        `embedding has ${embedding.length} dims, expected ${env.embeddingDimensions}`,
      ),
      { statusCode: 400 },
    );
  }
  for (const value of embedding) {
    if (!Number.isFinite(value)) {
      throw Object.assign(new Error("embedding contains a non-finite value"), {
        statusCode: 400,
      });
    }
  }
  return `[${embedding.join(",")}]`;
}

export async function setChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const literal = toVectorLiteral(embedding);
  await prisma.$executeRaw`
    UPDATE "Chunk" SET "embedding" = ${literal}::vector WHERE "id" = ${chunkId}
  `;
}

export interface ChunkMatch {
  id: string;
  documentId: string;
  ordinal: number;
  text: string;
  examSlug: string;
  similarity: number;
}

/**
 * Cosine k-NN over eligible knowledge-chunk embeddings only (invariant 1).
 */
export async function searchChunks(input: {
  embedding: number[];
  examSlug?: string | null;
  limit: number;
  eligibleOnly?: boolean;
}): Promise<ChunkMatch[]> {
  const literal = toVectorLiteral(input.embedding);
  const limit = Math.max(1, Math.min(input.limit, 50));
  const scope = input.examSlug
    ? Prisma.sql`AND d."examSlug" = ${input.examSlug}`
    : Prisma.empty;
  const eligibility =
    input.eligibleOnly === false
      ? Prisma.empty
      : Prisma.sql`AND c."eligibility" = 'eligible' AND d."role" = 'knowledge'`;

  return prisma.$queryRaw<ChunkMatch[]>`
    SELECT c."id",
           c."documentId",
           c."ordinal",
           c."text",
           d."examSlug",
           1 - (c."embedding" <=> ${literal}::vector) AS "similarity"
    FROM "Chunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE c."embedding" IS NOT NULL
    ${eligibility}
    ${scope}
    ORDER BY c."embedding" <=> ${literal}::vector
    LIMIT ${limit}
  `;
}

/** Eligible (or legacy unlabelled) chunks still waiting for an embedding. */
export async function listUnembeddedChunks(limit: number): Promise<
  Array<{ id: string; text: string; documentId: string }>
> {
  return prisma.$queryRaw<Array<{ id: string; text: string; documentId: string }>>`
    SELECT c."id", c."text", c."documentId"
    FROM "Chunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE c."embedding" IS NULL
      AND (
        c."eligibility" = 'eligible'
        OR (c."eligibility" = 'parked' AND d."role" IN ('knowledge', 'unknown') AND c."contentHash" = '')
      )
      AND d."role" NOT IN ('administrative', 'specification')
    ORDER BY c."createdAt" ASC
    LIMIT ${Math.max(1, Math.min(limit, 200))}
  `;
}
