import Fastify from "fastify";
import { env } from "./lib/env";
import { registerCors } from "./plugins/cors";
import { registerCookie } from "./plugins/cookie";
import { registerRateLimit } from "./plugins/rate-limit";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { quizRoutes } from "./routes/quiz";
import { progressRoutes } from "./routes/progress";

async function bootstrap() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  await registerCors(app);
  await registerCookie(app);
  await registerRateLimit(app);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(quizRoutes);
  await app.register(progressRoutes);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.code(500).send({ error: "Internal server error" });
  });

  await app.listen({ port: env.port, host: "0.0.0.0" });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
