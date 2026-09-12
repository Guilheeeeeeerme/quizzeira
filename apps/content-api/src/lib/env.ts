import "dotenv/config";

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const env = {
  port: num("PORT", 3020),
  databaseUrl: process.env.CONTENT_DATABASE_URL || "",
  /** Workers (content-worker, content-quality) authenticate with this. */
  internalApiKey:
    process.env.INTERNAL_API_KEY_CONTENT || process.env.INTERNAL_API_KEY || "dev-content-key",
  /** Study API + admin proxy authenticate with the platform-wide key. */
  adminInternalKey: process.env.INTERNAL_API_KEY || "dev-internal-key",
  /** Where Discovery keeps artifact bytes; extraction reads from the same bucket. */
  s3Endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
  s3Region: process.env.S3_REGION || "us-east-1",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || "quizzeira",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "quizzeira-secret",
  s3Bucket: process.env.S3_BUCKET || "quizzeira",
  s3ForcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
  /** Must match the embedding model the worker uses. */
  embeddingDimensions: num("CONTENT_EMBEDDING_DIMENSIONS", 768),
  /** Cross-plane join for §30 Artifact → Source / TopicQuery. */
  discoveryApiUrl: (process.env.DISCOVERY_API_URL || "http://discovery-api:3010").replace(
    /\/+$/,
    "",
  ),
  discoveryApiKey:
    process.env.INTERNAL_API_KEY_DISCOVERY ||
    process.env.INTERNAL_API_KEY ||
    "dev-discovery-key",
};
