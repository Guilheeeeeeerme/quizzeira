import Fastify from "fastify";
import { env } from "./lib/env";
import { redis } from "./lib/redis";
import { registerCors } from "./plugins/cors";
import { registerCookie } from "./plugins/cookie";
import { registerRateLimit } from "./plugins/rate-limit";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { quizRoutes } from "./routes/quiz";
import { progressRoutes } from "./routes/progress";
import { topicRoutes } from "./routes/topics";
import { examRoutes } from "./routes/exams";
import { internalRoutes } from "./routes/internal";
import { adminRoutes } from "./routes/admin";
import { seedPrompts } from "./services/prompt-store";

async function bootstrap() {
  if (env.isProduction && env.internalApiKey === "dev-internal-key") {
    throw new Error(
      "Refusing to start: INTERNAL_API_KEY must not be the default in production",
    );
  }

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL?.trim() || "info",
      base: {
        service: process.env.SERVICE_NAME?.trim() || "quizzeira-api",
      },
    },
    trustProxy: true,
  });

  await registerCors(app);
  await registerCookie(app);
  await registerRateLimit(app);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(quizRoutes);
  await app.register(progressRoutes);
  await app.register(topicRoutes);
  await app.register(examRoutes);
  await app.register(adminRoutes);
  await app.register(internalRoutes, { prefix: "/internal" });

  await seedPrompts();

  app.addHook("onClose", async () => {
    await redis.quit();
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ error: (error as Error).message });
    }
    reply.code(500).send({ error: "Internal server error" });
  });

  await app.listen({ port: env.port, host: "0.0.0.0" });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
