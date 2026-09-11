import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

type InternalKeyEntry = { key: string; scopes: string };

function parseInternalApiKeys(raw: string | undefined): InternalKeyEntry[] {
  const out: InternalKeyEntry[] = [];
  // quiz-corrector is the only worker left that calls this API; Discovery and
  // Content workers authenticate against their own services.
  const roleDefaults: Record<string, string> = {
    CORRECTOR: "reviews,prompts",
  };
  for (const [role, scopes] of Object.entries(roleDefaults)) {
    const key = process.env[`INTERNAL_API_KEY_${role}`]?.trim();
    if (key) out.push({ key, scopes });
  }
  for (const part of (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const [key, scopes = "*"] = part.split(":");
    if (key?.trim()) out.push({ key: key.trim(), scopes: scopes.trim() || "*" });
  }
  return out;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  webOrigin: requireEnv("WEB_ORIGIN", "http://localhost:5173"),
  apiOrigin: requireEnv("API_ORIGIN", "http://localhost:3000"),
  cookieDomain: process.env.COOKIE_DOMAIN ?? "localhost",
  databaseUrl: requireEnv(
    "DATABASE_URL",
    "mysql://quizzeira:quizzeira@localhost:3306/quizzeira",
  ),
  redisUrl: requireEnv("REDIS_URL", "redis://localhost:6379"),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 5),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 1000),
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
  jwtAccessTtl: requireEnv("JWT_ACCESS_TTL", "15m"),
  jwtRefreshTtl: requireEnv("JWT_REFRESH_TTL", "7d"),
  port: Number(process.env.PORT ?? 3000),
  isProduction: process.env.NODE_ENV === "production",
  internalApiKey: requireEnv("INTERNAL_API_KEY", "dev-internal-key"),
  /**
   * Optional per-worker keys: INTERNAL_API_KEY_<ROLE>=key (scopes implied by role)
   * or INTERNAL_API_KEYS=key:scope1|scope2,key2:reviews|prompts
   */
  internalApiKeys: parseInternalApiKeys(process.env.INTERNAL_API_KEYS),
  internalRateLimitMax: Number(process.env.INTERNAL_RATE_LIMIT_MAX ?? 120),
  s3Endpoint: requireEnv("S3_ENDPOINT", "http://minio:9000"),
  s3Region: requireEnv("S3_REGION", "us-east-1"),
  s3AccessKeyId: requireEnv("S3_ACCESS_KEY_ID", "quizzeira"),
  s3SecretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY", "quizzeira-secret"),
  s3Bucket: requireEnv("S3_BUCKET", "quizzeira"),
  s3ForcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
  /** Content stack — published Question bank (Sampling, not RAG). */
  contentApiUrl: requireEnv("CONTENT_API_URL", "http://content-api:3020").replace(/\/+$/, ""),
  /** Discovery stack — Source registry / open exams. */
  discoveryApiUrl: requireEnv("DISCOVERY_API_URL", "http://discovery-api:3010").replace(/\/+$/, ""),
  /** Key presented to discovery-api; falls back to the shared internal key. */
  discoveryInternalKey:
    process.env.INTERNAL_API_KEY_DISCOVERY?.trim() ||
    process.env.INTERNAL_API_KEY?.trim() ||
    "dev-internal-key",
  /** Key presented to content-api; falls back to the shared internal key. */
  contentInternalKey:
    process.env.INTERNAL_API_KEY_CONTENT?.trim() ||
    process.env.INTERNAL_API_KEY?.trim() ||
    "dev-internal-key",
  /** Timeout for service-to-service calls (ms). */
  serviceFetchTimeoutMs: Number(process.env.SERVICE_FETCH_TIMEOUT_MS ?? 8000),
};
