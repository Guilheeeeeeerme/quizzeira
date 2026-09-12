import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";

export async function registerInternalDomainStatsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { domain: string } }>(
    "/internal/domain-stats/:domain",
    async (request) => {
      const row = await prisma.domainStats.findUnique({
        where: { domain: request.params.domain },
      });
      return { stats: row };
    },
  );

  app.post<{ Params: { domain: string }; Body: Record<string, unknown> }>(
    "/internal/domain-stats/:domain/observe",
    async (request) => {
      const body = request.body ?? {};
      const density =
        body.avgDensity != null && Number.isFinite(Number(body.avgDensity))
          ? Number(body.avgDensity)
          : undefined;
      const row = await prisma.domainStats.upsert({
        where: { domain: request.params.domain },
        create: {
          domain: request.params.domain,
          fetched: Number(body.fetched || 0),
          becameKnowledge: Number(body.becameKnowledge || 0),
          rejectedLowValue: Number(body.rejectedLowValue || 0),
          avgDensity: density ?? null,
          updatedAt: new Date(),
        },
        update: {
          fetched: body.fetched != null ? { increment: Number(body.fetched) } : undefined,
          becameKnowledge:
            body.becameKnowledge != null
              ? { increment: Number(body.becameKnowledge) }
              : undefined,
          rejectedLowValue:
            body.rejectedLowValue != null
              ? { increment: Number(body.rejectedLowValue) }
              : undefined,
          avgDensity: density,
          updatedAt: new Date(),
        },
      });
      return { stats: row };
    },
  );
}
