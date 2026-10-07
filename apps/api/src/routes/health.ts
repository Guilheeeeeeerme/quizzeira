import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/version", async () => ({
    service: "@quizzeira/api",
    gitsha: process.env.GIT_SHA ?? "",
  }));
}
