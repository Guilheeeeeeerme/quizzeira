import type { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { env } from "../lib/env";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export async function registerCookie(app: FastifyInstance) {
  await app.register(cookie, {
    secret: env.jwtAccessSecret,
    parseOptions: {},
  });
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    domain: env.cookieDomain,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearAuthCookies(
  reply: { clearCookie: (name: string, options?: object) => void },
) {
  const opts = { path: "/", domain: env.cookieDomain };
  reply.clearCookie(ACCESS_COOKIE, opts);
  reply.clearCookie(REFRESH_COOKIE, opts);
}
