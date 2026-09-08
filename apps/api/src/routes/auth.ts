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
import { randomUUID } from "node:crypto";
import type { UserDto } from "@quizzeira/shared";

function toUserDto(user: { id: string; email: string; displayName: string | null }): UserDto {
  return { id: user.id, email: user.email, displayName: user.displayName };
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

  app.post("/auth/demo", async (_request, reply) => {
    const email = "guest@quizzeira-demo.local";
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user
        .create({
          data: {
            email,
            passwordHash: await bcrypt.hash(randomUUID(), 10),
            displayName: "Demo Guest",
          },
        })
        .catch(() => prisma.user.findUnique({ where: { email } }));
    }
    if (!user) {
      return reply.code(500).send({ error: "Demo user unavailable" });
    }

    // Keep the demo sandbox fresh: guest-created attempts and topics expire
    // after 24h, so sample material never accumulates on the shared demo
    // account (same lifecycle principle as the promptdesk demo users).
    const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.quizAttempt.deleteMany({
      where: { userId: user.id, startedAt: { lt: staleCutoff } },
    });
    await prisma.topic.deleteMany({
      where: { userId: user.id, createdAt: { lt: staleCutoff } },
    });

    const payload = { sub: user.id, email: user.email };
    reply.setCookie(ACCESS_COOKIE, signAccessToken(payload), cookieOptions(parseTtlSeconds(env.jwtAccessTtl, 900)));
    // Demo refresh window is short on purpose: guests get a bounded session.
    reply.setCookie(REFRESH_COOKIE, signRefreshToken(payload), cookieOptions(parseTtlSeconds("1h", 3600)));

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
