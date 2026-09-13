import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function flag(key: string, defaultTrue = true): boolean {
  const raw = process.env[key];
  if (raw == null || raw === "") return defaultTrue;
  return raw !== "false" && raw !== "0";
}

export const contentEnv = {
  extractionEnabled: flag("CONTENT_EXTRACTION_ENABLED"),
  generationEnabled: flag("CONTENT_GENERATION_ENABLED"),
  embeddingsEnabled: flag("CONTENT_EMBEDDINGS_ENABLED"),

  stageImportEnabled: flag("CONTENT_STAGE_IMPORT", true),
  stageNormalizeEnabled: flag("CONTENT_STAGE_NORMALIZE", true),
  stageClassifyEnabled: flag("CONTENT_STAGE_CLASSIFY", true),
  stageSyllabusEnabled: flag("CONTENT_STAGE_SYLLABUS", true),
  stageEvidenceEnabled: flag("CONTENT_STAGE_EVIDENCE", true),
  stageKnowledgeEnabled: flag("CONTENT_STAGE_KNOWLEDGE", true),
  stagePlannerEnabled: flag("CONTENT_STAGE_PLANNER", true),

  docProcessorUrl: (process.env.DOC_PROCESSOR_URL ?? "http://doc-processor:3030").replace(
    /\/$/,
    "",
  ),

  docsPerPass: num("CONTENT_DOCS_PER_PASS", 3),
  chunksPerEmbedPass: num("CONTENT_CHUNKS_PER_EMBED_PASS", 32),
  examsPerGenerationPass: num("CONTENT_EXAMS_PER_GENERATION_PASS", 2),
  questionsPerGenerationRun: num("CONTENT_QUESTIONS_PER_RUN", 6),
  publishedTargetPerExam: num("CONTENT_PUBLISHED_TARGET", 40),
  retrievalTopK: num("CONTENT_RETRIEVAL_TOP_K", 8),

  chunkTargetChars: num("CONTENT_CHUNK_TARGET_CHARS", 3000),
  chunkOverlapChars: num("CONTENT_CHUNK_OVERLAP_CHARS", 300),
  maxChunksPerDocument: num("CONTENT_MAX_CHUNKS_PER_DOCUMENT", 200),

  embeddingDimensions: num("CONTENT_EMBEDDING_DIMENSIONS", 768),
  geminiEmbeddingModel: process.env.CONTENT_GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  openaiEmbeddingModel: process.env.CONTENT_OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",

  discoveryApiUrl: (process.env.DISCOVERY_API_URL ?? "http://discovery-api:3010").replace(
    /\/$/,
    "",
  ),
  discoveryApiKey:
    process.env.INTERNAL_API_KEY_DISCOVERY || process.env.INTERNAL_API_KEY || "dev-discovery-key",
  contentApiUrl: (
    process.env.CONTENT_API_URL ||
    process.env.INTERNAL_API_URL ||
    "http://content-api:3020"
  ).replace(/\/$/, ""),
  contentApiKey:
    process.env.INTERNAL_API_KEY_CONTENT || process.env.INTERNAL_API_KEY || "dev-content-key",
};
