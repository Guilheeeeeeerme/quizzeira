import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from "../utils/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "./cookie";
import { prisma } from "../lib/prisma";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    userRole?: "USER" | "ADMIN";
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
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true },
      });
      if (!user) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }
      request.userId = user.id;
      request.userRole = user.role;
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
    request.userRole = user.role;
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;
  if (request.userRole !== "ADMIN") {
    reply.code(403).send({ error: "Admin required" });
  }
}

export { parseTtlSeconds };
