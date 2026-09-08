import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  cookieOptions,
} from "../plugins/cookie";
import { authenticate, parseTtlSeconds } from "../plugins/auth";
import { env } from "../lib/env";
import type { UserDto } from "@quizzeira/shared";

function toUserDto(user: {
  id: string;
  email: string;
  displayName: string | null;
  role: "USER" | "ADMIN";
}): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{
    Body: { email: string; password: string; displayName?: string };
  }>("/auth/register", async (request, reply) => {
    const { email, password, displayName } = request.body ?? {};
    if (!email?.trim() || !password || password.length < 6) {
      return reply.code(400).send({ error: "Email and password (min 6 chars) required" });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName?.trim() || null,
      },
    });

    const payload = { sub: user.id, email: user.email };
    reply.setCookie(ACCESS_COOKIE, signAccessToken(payload), cookieOptions(parseTtlSeconds(env.jwtAccessTtl, 900)));
    reply.setCookie(REFRESH_COOKIE, signRefreshToken(payload), cookieOptions(parseTtlSeconds(env.jwtRefreshTtl, 604800)));

    return { user: toUserDto(user) };
  });

  app.post<{ Body: { email: string; password: string } }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body ?? {};
    if (!email?.trim() || !password) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const payload = { sub: user.id, email: user.email };
    reply.setCookie(ACCESS_COOKIE, signAccessToken(payload), cookieOptions(parseTtlSeconds(env.jwtAccessTtl, 900)));
    reply.setCookie(REFRESH_COOKIE, signRefreshToken(payload), cookieOptions(parseTtlSeconds(env.jwtRefreshTtl, 604800)));

    return { user: toUserDto(user) };
  });

  app.post("/auth/logout", async (_request, reply) => {
    clearAuthCookies(reply);
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: authenticate }, async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    return { user: toUserDto(user) };
  });
}
