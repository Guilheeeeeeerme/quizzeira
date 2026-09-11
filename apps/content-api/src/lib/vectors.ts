// Concept: Embeddings (pgvector reads/writes)
//
// Prisma has no vector type, so the embedding column is declared Unsupported in
// schema.prisma and touched only through the two functions below. Keeping all
// raw SQL here means the rest of the app never hand-builds a vector literal.
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
 * Cosine k-NN over chunk embeddings, optionally scoped to one exam. Used to
 * ground Generation; the study runtime never calls this (Study samples finished
 * questions, it does not retrieve context at quiz time).
 */
export async function searchChunks(input: {
  embedding: number[];
  examSlug?: string | null;
  limit: number;
}): Promise<ChunkMatch[]> {
  const literal = toVectorLiteral(input.embedding);
  const limit = Math.max(1, Math.min(input.limit, 50));
  const scope = input.examSlug
    ? Prisma.sql`AND d."examSlug" = ${input.examSlug}`
    : Prisma.empty;

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
    ${scope}
    ORDER BY c."embedding" <=> ${literal}::vector
    LIMIT ${limit}
  `;
}

/** Chunks still waiting for an embedding, oldest first. */
export async function listUnembeddedChunks(limit: number): Promise<
  Array<{ id: string; text: string; documentId: string }>
> {
  return prisma.$queryRaw<Array<{ id: string; text: string; documentId: string }>>`
    SELECT "id", "text", "documentId"
    FROM "Chunk"
    WHERE "embedding" IS NULL
    ORDER BY "createdAt" ASC
    LIMIT ${Math.max(1, Math.min(limit, 200))}
  `;
}
