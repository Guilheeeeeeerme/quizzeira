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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  webOrigin: requireEnv("WEB_ORIGIN", "http://localhost:5173"),
  apiOrigin: requireEnv("API_ORIGIN", "http://localhost:3000"),
  cookieDomain: process.env.COOKIE_DOMAIN ?? "localhost",
  databaseUrl: requireEnv(
    "DATABASE_URL",
    "mysql://quizapp:quizapp@localhost:3306/quizapp",
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
};
