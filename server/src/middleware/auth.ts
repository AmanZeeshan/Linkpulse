import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/jwt.js";
import { sha256 } from "../lib/hash.js";
import { Errors } from "../lib/errors.js";
import { limiter } from "../lib/rateLimiter.js";
import { clientIp } from "../lib/geo.js";

export type AuthContext = {
  userId: string;
  email: string;
  via: "jwt" | "api_key";
  apiKeyId?: string;
};

export type AuthedRequest = Request & { auth: AuthContext };

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

async function authenticate(req: Request): Promise<AuthContext | null> {
  const apiHeader = req.header("x-api-key");
  const bearer = extractBearer(req.header("authorization"));
  const rawKey = apiHeader || (bearer?.startsWith("sk_live_") ? bearer : null);

  if (rawKey) {
    const keyHash = sha256(rawKey);
    const record = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });
    if (!record || record.revokedAt) return null;
    prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return {
      userId: record.userId,
      email: record.user.email,
      via: "api_key",
      apiKeyId: record.id,
    };
  }

  if (bearer) {
    const payload = verifyToken(bearer);
    return { userId: payload.sub, email: payload.email, via: "jwt" };
  }

  return null;
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = await authenticate(req);
      if (!auth) throw Errors.unauthorized();

      const ip = clientIp(req);
      const key = auth.via === "api_key" ? `key:${auth.apiKeyId}` : `user:${auth.userId}:${ip}`;
      const limit = auth.via === "api_key" ? 120 : 90;
      const result = limiter.consume(key, limit, 60_000);

      res.setHeader("X-RateLimit-Limit", String(result.limit));
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));

      if (!result.allowed) {
        res.setHeader("Retry-After", String(result.retryAfterSec));
        throw Errors.rateLimited(result.retryAfterSec);
      }

      (req as AuthedRequest).auth = auth;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function optionalAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const auth = await authenticate(req);
      if (auth) (req as AuthedRequest).auth = auth;
      next();
    } catch {
      next();
    }
  };
}
