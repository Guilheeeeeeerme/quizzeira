import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from "../utils/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "./cookie";
import { prisma } from "../lib/prisma";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

function parseTtlSeconds(ttl: string, fallback: number): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return fallback;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 1);
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const access = request.cookies[ACCESS_COOKIE];
  if (access) {
    try {
      const payload = verifyAccessToken(access);
      request.userId = payload.sub;
      return;
    } catch {
      // try refresh below
    }
  }

  const refresh = request.cookies[REFRESH_COOKIE];
  if (!refresh) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refresh);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    const newAccess = signAccessToken({ sub: user.id, email: user.email });
    reply.setCookie(ACCESS_COOKIE, newAccess, cookieOptions(15 * 60));
    request.userId = user.id;
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export { parseTtlSeconds };
