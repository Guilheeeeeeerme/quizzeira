// Concept: Embeddings (pgvector reads/writes)
//
// Prisma has no vector type, so the embedding column is declared Unsupported in
// schema.prisma and touched only through the functions below.
//
// Invariant 1 (§9.4): only eligible chunks from knowledge/mixed documents and
// knowledge section roles (content | legal_article) may enter the knowledge index.
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

/** Knowledge-index guard joined as `c` / `d` / `s` (§9.4.1 / §9.4.4). */
const KNOWLEDGE_INDEX_GUARD = Prisma.sql`
  AND c."eligibility" = 'eligible'::"EligibilityStatus"
  AND d."role" IN ('knowledge'::"DocumentRole", 'mixed'::"DocumentRole")
  AND s."role" IN ('content'::"SectionRole", 'legal_article'::"SectionRole")
`;

export async function setChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const literal = toVectorLiteral(embedding);
  const updated = await prisma.$executeRaw`
    UPDATE "Chunk" AS c
    SET "embedding" = ${literal}::vector
    FROM "Document" AS d, "Section" AS s
    WHERE c."id" = ${chunkId}
      AND d."id" = c."documentId"
      AND s."id" = c."sectionId"
      AND c."eligibility" = 'eligible'::"EligibilityStatus"
      AND d."role" IN ('knowledge'::"DocumentRole", 'mixed'::"DocumentRole")
      AND s."role" IN ('content'::"SectionRole", 'legal_article'::"SectionRole")
  `;
  if (Number(updated) === 0) {
    throw Object.assign(
      new Error("chunk is not eligible for the knowledge index (role/section/eligibility)"),
      { statusCode: 400 },
    );
  }
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
 * ground Generation; the study runtime never calls this.
 */
export async function searchChunks(input: {
  embedding: number[];
  examSlug?: string | null;
  syllabusNodeId?: string | null;
  canonicalKey?: string | null;
  limit: number;
  /** Defaults true — knowledge-index guard always on for generation retrieval (§9.4 / §39.3). */
  eligibleOnly?: boolean;
}): Promise<ChunkMatch[]> {
  const literal = toVectorLiteral(input.embedding);
  const limit = Math.max(1, Math.min(input.limit, 50));
  const scope = input.examSlug
    ? Prisma.sql`AND d."examSlug" = ${input.examSlug}`
    : Prisma.empty;
  // Invariant: generation retrieval never returns non-eligible / wrong-role chunks.
  const eligibility =
    input.eligibleOnly === false ? Prisma.empty : KNOWLEDGE_INDEX_GUARD;
  const mapJoin =
    input.syllabusNodeId || input.canonicalKey
      ? Prisma.sql`JOIN "ChunkSyllabusMap" m ON m."chunkId" = c."id"`
      : Prisma.empty;
  const mapFilter = input.syllabusNodeId
    ? Prisma.sql`AND m."syllabusNodeId" = ${input.syllabusNodeId}`
    : input.canonicalKey
      ? Prisma.sql`AND m."canonicalKey" = ${input.canonicalKey}`
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
    LEFT JOIN "Section" s ON s."id" = c."sectionId"
    ${mapJoin}
    WHERE c."embedding" IS NOT NULL
    ${scope}
    ${eligibility}
    ${mapFilter}
    ORDER BY c."embedding" <=> ${literal}::vector
    LIMIT ${limit}
  `;
}

/** Chunks still waiting for an embedding, oldest first. */
export async function listUnembeddedChunks(
  limit: number,
  eligibleOnly = false,
): Promise<Array<{ id: string; text: string; documentId: string }>> {
  const eligibility = eligibleOnly ? KNOWLEDGE_INDEX_GUARD : Prisma.empty;

  return prisma.$queryRaw<Array<{ id: string; text: string; documentId: string }>>`
    SELECT c."id", c."text", c."documentId"
    FROM "Chunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    LEFT JOIN "Section" s ON s."id" = c."sectionId"
    WHERE c."embedding" IS NULL
    ${eligibility}
    ORDER BY c."createdAt" ASC
    LIMIT ${Math.max(1, Math.min(limit, 200))}
  `;
}

export async function setSyllabusNodeEmbedding(
  nodeId: string,
  embedding: number[],
): Promise<void> {
  const literal = toVectorLiteral(embedding);
  await prisma.$executeRaw`
    UPDATE "SyllabusNode"
    SET "embedding" = ${literal}::vector
    WHERE "id" = ${nodeId}
  `;
}

export async function listUnembeddedSyllabusLeaves(
  limit: number,
): Promise<Array<{ id: string; pathSlug: string; title: string }>> {
  return prisma.$queryRaw<Array<{ id: string; pathSlug: string; title: string }>>`
    SELECT n."id", n."pathSlug", n."title"
    FROM "SyllabusNode" n
    JOIN "Syllabus" s ON s."id" = n."syllabusId"
    WHERE n."embedding" IS NULL
      AND n."depth" >= 1
      AND n."status" = 'active'
      AND s."status" = 'active'
    ORDER BY n."ordinal" ASC
    LIMIT ${Math.max(1, Math.min(limit, 200))}
  `;
}

export async function getSyllabusNodeEmbeddings(
  nodeIds: string[],
): Promise<Array<{ id: string; embedding: number[] }>> {
  if (nodeIds.length === 0) return [];
  const rows = await prisma.$queryRaw<Array<{ id: string; embedding: string }>>`
    SELECT "id", "embedding"::text AS "embedding"
    FROM "SyllabusNode"
    WHERE "id" IN (${Prisma.join(nodeIds)})
      AND "embedding" IS NOT NULL
  `;
  return rows
    .map((row) => {
      const embedding = parseVectorLiteral(row.embedding);
      return embedding ? { id: row.id, embedding } : null;
    })
    .filter((r): r is { id: string; embedding: number[] } => r != null);
}

function parseVectorLiteral(raw: string): number[] | null {
  const trimmed = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!trimmed) return null;
  const values = trimmed.split(",").map((p) => Number(p.trim()));
  if (values.some((v) => !Number.isFinite(v))) return null;
  return values;
}
