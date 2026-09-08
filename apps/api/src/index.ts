import Fastify from "fastify";
import multipart from "@fastify/multipart";
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
import { internalRoutes } from "./routes/internal";
import { seedPrompts } from "./services/prompt-store";

async function bootstrap() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  await registerCors(app);
  await registerCookie(app);
  await registerRateLimit(app);
  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(quizRoutes);
  await app.register(progressRoutes);
  await app.register(topicRoutes);
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
