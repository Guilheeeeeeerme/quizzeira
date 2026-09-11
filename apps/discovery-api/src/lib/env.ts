import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 3010),
  databaseUrl: process.env.DISCOVERY_DATABASE_URL || "",
  internalApiKey: process.env.INTERNAL_API_KEY_DISCOVERY || process.env.INTERNAL_API_KEY || "dev-discovery-key",
  adminInternalKey: process.env.INTERNAL_API_KEY || "dev-internal-key",
  s3Endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
  s3Region: process.env.S3_REGION || "us-east-1",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || "quizzeira",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "quizzeira-secret",
  s3Bucket: process.env.S3_BUCKET || "quizzeira",
  s3ForcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
};
